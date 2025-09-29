// server.js
import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import pdfParse from "pdf-parse";
import Papa from "papaparse";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ---- CSV Parser ----
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filePath, "utf8");
    Papa.parse(fileData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: reject,
    });
  });
}

// ---- PDF Parser ----
async function extractPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

// ---- Upload Endpoint ----
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    let transactions = [];

    // Handle CSV
    if (file.mimetype === "text/csv") {
      const rows = await parseCSV(file.path);

      transactions = rows.map((row) => ({
        date:
          row.Date ||
          row["Transaction Date"] ||
          row["Transaction_Date"] ||
          null,
        description:
          row.Description ||
          row["Transaction Detail"] ||
          row["Details"] ||
          "",
        amount: parseFloat(
          row.Amount ||
            row["Transaction Amount"] ||
            row["Money In (NGN)"] ||
            row["Money Out (NGN)"] ||
            0
        ),
        category: row.Category || "Uncategorized",
      }));
    }

    // Handle PDF
    else if (file.mimetype === "application/pdf") {
      const text = await extractPDF(file.path);

      if (text) {
        // Example regex: "12/01/2024 Grocery Store -85.50"
        const regex =
          /(\d{2}\/\d{2}\/\d{4})\s+([A-Za-z0-9\s]+?)\s+(-?\d+\.\d{2})/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
          transactions.push({
            date: match[1],
            description: match[2].trim(),
            amount: parseFloat(match[3]),
            category: "Uncategorized",
          });
        }
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    if (!transactions.length) {
      return res.json({
        success: true,
        transactions: [],
        message: "No transactions found",
      });
    }

    res.json({ success: true, transactions });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to process file" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
