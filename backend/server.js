import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import PDFDocument from "pdfkit";
import AbortController from 'abort-controller';
// Removed top-level pdf-parse import to avoid module conflict.

dotenv.config();

const app = express();

console.log("Key loaded:", !!process.env.GEMINI_API_KEY); 

app.use(cors());
// Corrected: Increase the JSON body limit to handle large transaction arrays (e.g., 50MB).
app.use(express.json({ limit: '50mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("FATAL: GEMINI_API_KEY is not set in environment variables.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

const modelSequence = ["gemini-2.5-flash", "gemini-2.5-pro"]; 

function fileToGenerativePart(filePath, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType,
        },
    };
}

async function parseWithGemini(filePath, fileType) {
    const TIMEOUT_MS = 30000;
    
    // --- NEW FIX: Simplified and Robust PDF Loading ---
    let partsToSend = [];
    let effectiveModelSequence = modelSequence;

    if (fileType === 'application/pdf') {
        try {
            // Fix: Use simple synchronous require to load the CJS version of pdf-parse,
            // which is more compatible and stable in mixed Node.js environments.
            const pdf = require('pdf-parse'); 
            
            console.log("Pre-processing PDF for reliable text extraction...");
            const dataBuffer = fs.readFileSync(filePath);
            
            // Wait for PDF to be parsed into a raw text object
            const data = await pdf(dataBuffer); 
            
            if (data && data.text && data.text.length > 0) {
                // Send the ENTIRE extracted raw text as a text part for maximum reliability
                partsToSend.push({ text: data.text });
                // Use the stronger model for large text/table analysis
                effectiveModelSequence = ['gemini-2.5-pro', 'gemini-2.5-flash'];
            } else {
                 console.warn("PDF text extraction failed or returned empty text. Falling back to inline PDF upload.");
                 partsToSend.push(fileToGenerativePart(filePath, fileType));
                 effectiveModelSequence = modelSequence;
            }

        } catch (e) {
             console.error(`PDF-Parse failed (${e.message}). Falling back to inline PDF upload.`);
             partsToSend.push(fileToGenerativePart(filePath, fileType));
             effectiveModelSequence = modelSequence;
        }

    } else {
        // For images or standard files, use the original inline data method
        const mimeTypeForGemini = fileType.includes('csv') || fileType.includes('text') 
                              ? 'text/plain' 
                              : fileType;
        partsToSend.push(fileToGenerativePart(filePath, mimeTypeForGemini));
    }
    // --- END NEW FIX ---
    
    const prompt = `
You are a financial data parser. Analyze the following raw text or attached document. Extract all transactions found in the text/document.

**STRICT OUTPUT RULE: RETURN ONLY A JSON ARRAY.**

IMPORTANT: 
1. **If you find transactions,** return them as a JSON array (starting with '[' and ending with ']').
2. **If you find NO transactions,** return an empty JSON array: []. 

TRANSACTION RULES:
1. **Amount Sign**:
    - Use a **POSITIVE** number for income/credits/money in.
    - Use a **NEGATIVE** number for expenses/debits/money out.
2. **Date Format**: Ensure the date is strictly in 'YYYY-MM-DD' format.
3. **Fields**: Each transaction must strictly adhere to this JSON structure:
{
  "date": "YYYY-MM-DD",
  "description": "transaction description",
  "amount": number,
  "category": "category name" // Infer a logical category (e.g., 'Groceries', 'Salary', 'Transfer')
}

Return ONLY the JSON array. Do not use markdown like 'json' or backticks.`;
    
    // Add the instruction prompt as the last part
    partsToSend.push({ text: prompt });
    
    let lastErrorMessage = "No models could be reached.";

    for (const modelName of effectiveModelSequence) {
        let timeoutId;
        try {
            console.log(`Attempting parse with model: ${modelName}...`);
            
            const currentModel = genAI.getGenerativeModel({ model: modelName });

            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            // API Call uses the dynamically created partsToSend array
            const apiCallPromise = currentModel.generateContent({
                contents: [{ parts: partsToSend }],
            }, {
                requestOptions: { 
                    signal: controller.signal 
                }
            });
            
            const result = await apiCallPromise;
            clearTimeout(timeoutId);

            const responseText = result.response?.text();
            if (!responseText) {
                console.error(`Model ${modelName} returned an empty response.`);
                lastErrorMessage = `Model ${modelName} returned an empty response.`;
                continue; 
            }
            
            let cleanedText = responseText.trim();
            cleanedText = cleanedText.replace(/```json\s*|```\s*$/gi, '').trim();
            cleanedText = cleanedText.replace(/```\s*|```\s*$/gi, '').trim();

            const firstBracket = cleanedText.indexOf('[');
            const lastBracket = cleanedText.lastIndexOf(']');

            let jsonString = '[]'; 

            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                jsonString = cleanedText.substring(firstBracket, lastBracket + 1);
            } else {
                jsonString = cleanedText;
            }

            let transactions = [];
            try {
                transactions = JSON.parse(jsonString);
            } catch (parseError) {
                throw new Error(`[Gemini Parse Error] Model ${modelName} returned malformed JSON. The file may be too complex.`);
            }

            if (!Array.isArray(transactions)) {
                throw new Error(`[Gemini Parse Error] Model ${modelName} did not return a JSON array.`);
            }
            
            console.log(`✅ Successfully parsed with model: ${modelName}`);
            
            return transactions.map(t => ({
                date: t.date || new Date().toISOString().split('T')[0],
                description: t.description || 'Unknown',
                amount: parseFloat(t.amount) || 0, 
                category: t.category || 'Uncategorized'
            })).filter(t => t.amount !== 0); 
            
        } catch (err) {
            clearTimeout(timeoutId);

            lastErrorMessage = err.message || "Unknown API Error";
            
            if (lastErrorMessage.includes('The user aborted a request')) {
                lastErrorMessage = `Request timed out after ${TIMEOUT_MS / 1000} seconds.`;
            } else if (lastErrorMessage.startsWith('[Gemini Parse Error]')) {
                throw err;
            }

            console.error(`❌ Model ${modelName} failed with error:`, lastErrorMessage);
        }
    }

    throw new Error(`[Critical API Error] All models failed. Last error: ${lastErrorMessage.replace(/\[GoogleGenerativeAI Error\]:\s*/, '').trim()}`);
}

async function parseCSV(filePath) {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.split('\n');
    if (lines.length < 2) return []; 
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const transactions = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, '')); 
        
        const transaction = {
            date: '', description: '', amount: 0, category: 'Uncategorized'
        };
        
        let isSplitAmount = false; 
        
        headers.forEach((header, index) => {
            const value = values[index] || '';
            const amt = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;

            if (header.includes('date')) {
                const date = new Date(value);
                if (!isNaN(date)) {
                    transaction.date = date.toISOString().split('T')[0];
                }
            } else if (header.includes('description') || header.includes('detail')) {
                transaction.description = value;
            } else if (header.includes('money in') || header.includes('credit') || header.includes('deposit')) {
                if (amt > 0) transaction.amount = amt;
                isSplitAmount = true;
            } else if (header.includes('money out') || header.includes('debit') || header.includes('withdrawal')) {
                if (amt > 0) transaction.amount = -amt; 
                isSplitAmount = true;
            } else if (header.includes('category')) {
                transaction.category = value || 'Uncategorized';
            }
        });
        
        const amountIndex = headers.findIndex(h => h.includes('amount') && !h.includes('in') && !h.includes('out'));
        if (amountIndex !== -1 && !isSplitAmount) {
            const value = values[amountIndex] || '';
            transaction.amount = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
        }

        if (transaction.amount !== 0 && transaction.date) {
            transactions.push(transaction);
        }
    }
    
    return transactions;
}

app.post("/upload", upload.single("file"), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        let transactions = [];
        const isCSV = file.originalname.toLowerCase().endsWith('.csv');
        
        if (isCSV) {
            transactions = await parseCSV(file.path);
            
            if (transactions.length === 0) {
                 console.log(`⚠️ CSV parsing failed (0 transactions). Falling back to Gemini for text extraction...`);
                 transactions = await parseWithGemini(file.path, 'text/plain'); 
            }
        } else {
            transactions = await parseWithGemini(file.path, file.mimetype);
        }

        try {
            fs.unlinkSync(file.path); 
        } catch (cleanupErr) {
            console.warn(`Could not delete temp file ${file.path}:`, cleanupErr.message);
        }

        console.log(`✅ Parsed ${transactions.length} transactions`);
        console.log('Sample:', transactions.slice(0, 2));

        if (transactions.length === 0) {
             console.error("WARNING: File returned 0 transactions. It may be unreadable or empty.");
             return res.json({ success: true, transactions: [], message: "File processed, but zero transactions were extracted." });
        }

        res.json({ success: true, transactions });
        
    } catch (err) {
        console.error("Upload error:", err.message);
        
        if (file && fs.existsSync(file.path)) {
            try { fs.unlinkSync(file.path); } catch(e) { /* ignore */ }
        }
        
        let status = 500;
        let frontendMessage = "An unknown server error occurred while processing the file.";

        if (err.message.startsWith('[Critical API Error]')) {
            status = 503;
            frontendMessage = err.message.replace(/\[Critical API Error\]\s*/, 'API Connection Failed: ');
        } else if (err.message.startsWith('[Gemini Parse Error]')) {
            status = 422;
            frontendMessage = err.message.replace(/\[Gemini Parse Error\]\s*/, 'Data Extraction Failed: ');
        }
        
        res.status(status).json({ 
            error: frontendMessage,
            status: status
        });
    }
});
 
function buildPdf(data, res) {
    const doc = new PDFDocument({ margin: 30 });
    const filename = `Finatracker_Report_${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    const transactions = data.transactions;

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals = {};

    transactions.forEach(t => {
        const amount = parseFloat(t.amount) || 0;
        const category = t.category || "Uncategorized";

        if (amount > 0) {
            totalIncome += amount;
        } else if (amount < 0) {
            const expenseAmount = Math.abs(amount);
            totalExpenses += expenseAmount;
            categoryTotals[category] = (categoryTotals[category] || 0) + expenseAmount;
        }
    });

    const netBalance = totalIncome - totalExpenses;
    
    const formatCurrency = (amount, color = false) => {
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'NGN', 
        }).format(amount);
        
        if (color) {
            return {
                text: formatted,
                color: amount >= 0 ? '#10B981' : '#EF4444'
            };
        }
        return formatted;
    };
    
    doc.fontSize(20).text('Finatracker Financial Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Report Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1.5);
    
    doc.fontSize(14).text('Financial Summary', { underline: true });
    doc.moveDown(0.5);

    const summaryY = doc.y;
    const boxWidth = 150;
    const boxHeight = 50;

    const netBalanceFormatted = formatCurrency(netBalance, true);
    
    doc.fillColor('#D1FAE5')
       .rect(30, summaryY, boxWidth, boxHeight)
       .fill()
       .fillColor('#065F46')
       .fontSize(10).text('Total Income', 30, summaryY + 8, { width: boxWidth, align: 'center' })
       .fontSize(14).text(formatCurrency(totalIncome), 30, summaryY + 25, { width: boxWidth, align: 'center' });

    doc.fillColor('#FEE2E2')
       .rect(30 + boxWidth + 10, summaryY, boxWidth, boxHeight)
       .fill()
       .fillColor('#991B1B')
       .fontSize(10).text('Total Expenses', 30 + boxWidth + 10, summaryY + 8, { width: boxWidth, align: 'center' })
       .fontSize(14).text(formatCurrency(totalExpenses), 30 + boxWidth + 10, summaryY + 25, { width: boxWidth, align: 'center' });

    doc.fillColor('#DBEAFE')
       .rect(30 + 2 * (boxWidth + 10), summaryY, boxWidth, boxHeight)
       .fill()
       .fillColor('#1E40AF')
       .fontSize(10).text('Net Balance', 30 + 2 * (boxWidth + 10), summaryY + 8, { width: boxWidth, align: 'center' })
       .fillColor(netBalanceFormatted.color)
       .fontSize(14).text(netBalanceFormatted.text, 30 + 2 * (boxWidth + 10), summaryY + 25, { width: boxWidth, align: 'center' });

    doc.moveDown(4); 
    
    doc.fillColor('#000000').fontSize(14).text('Spending by Category (Expense Only)', { underline: true });
    doc.moveDown(0.5);
    
    const sortedCategories = Object.entries(categoryTotals)
                                 .sort(([, a], [, b]) => b - a)
                                 .slice(0, 5); 
    
    if (sortedCategories.length > 0) {
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Category', 30, doc.y, { width: 200, continued: true });
        doc.text('Total Spent', 250, doc.y, { width: 100 });
        doc.font('Helvetica');
        doc.moveDown(0.2);
        
        sortedCategories.forEach(([category, amount]) => {
            doc.text(category, 30, doc.y, { width: 200, continued: true });
            doc.text(formatCurrency(amount), 250, doc.y, { width: 100 });
            doc.moveDown(0.2);
        });
        doc.moveDown(1);
    } else {
        doc.fontSize(10).text("No expense data available to show categories.", 30);
        doc.moveDown(1);
    }

    doc.fontSize(14).text('Transaction Details', { underline: true });
    doc.moveDown(0.5);
    
    const tableHeaders = ['Date', 'Description', 'Category', 'Amount'];
    const colWidth = 130;
    let y = doc.y;

    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10);
    tableHeaders.forEach((header, i) => {
        doc.text(header, 30 + i * colWidth, y, { width: colWidth, align: 'left' });
    });
    doc.moveDown(0.5);
    doc.strokeColor('#aaaaaa').lineWidth(0.5).moveTo(30, doc.y).lineTo(580, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(9);
    transactions.forEach(t => {
        if (doc.y > 750) { 
            doc.addPage();
            y = 30; 
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10);
            tableHeaders.forEach((header, i) => {
                doc.text(header, 30 + i * colWidth, y, { width: colWidth, align: 'left' });
            });
            doc.moveDown(0.5);
            doc.strokeColor('#aaaaaa').lineWidth(0.5).moveTo(30, doc.y).lineTo(580, doc.y).stroke();
            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(9);
        }

        const amountInfo = formatCurrency(t.amount, true);

        doc.text(t.date, 30, doc.y, { width: colWidth, align: 'left', continued: true });
        doc.text(t.description, 30 + colWidth, doc.y, { width: colWidth, align: 'left', continued: true });
        doc.text(t.category, 30 + 2 * colWidth, doc.y, { width: colWidth, align: 'left', continued: true });
        doc.fillColor(amountInfo.color).text(amountInfo.text, 30 + 3 * colWidth, doc.y, { width: colWidth, align: 'right' });
        
        doc.fillColor('#000000'); 
        doc.moveDown(0.5);
    });
    
    doc.end();
}

app.post("/api/reports/export", async (req, res) => {
    const { transactions } = req.body; 

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({ error: "No transaction data provided for export." });
    }

    try {
        buildPdf({ transactions }, res);
        
    } catch (error) {
        console.error("PDF Generation Error:", error);
        res.status(500).json({ error: "Failed to generate PDF report." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(` Server running on http://localhost:${PORT}`)
);