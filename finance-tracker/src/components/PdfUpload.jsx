"use client";
import React, { useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PdfUpload({ onUploadComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const processFile = async (file) => {
    const allowed = [".pdf", ".csv"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!allowed.includes(ext)) {
      toast.error("Please upload a valid PDF or CSV file.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      if (!data.transactions?.length) {
        toast.warn("No transactions found in file.");
        return;
      }

      onUploadComplete?.(data.transactions);
      toast.success(`✅ Uploaded ${data.transactions.length} transactions`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error processing file");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Import Transactions (PDF/CSV)</h2>

        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={isUploading ? undefined : triggerFileInput}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.csv"
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <p>⏳ Uploading...</p>
          ) : (
            <>
              <p className="font-medium">Drop PDF/CSV here or click to browse</p>
              <p className="text-xs mt-1 text-gray-500">
                Bank statements or transaction exports supported
              </p>
            </>
          )}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3 text-center">
          <button
            onClick={() => {
              const sampleCSV = `Transaction Date,Transaction Detail,Money In (NGN),Money Out (NGN)
2024-01-15,Grocery Store,,85.50
2024-01-14,Salary Payment,2500.00,
2024-01-13,Netflix Subscription,,15.99
2024-01-12,Gas Station,,45.00`;
              const blob = new Blob([sampleCSV], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "sample-transactions.csv";
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Download sample CSV template
          </button>
        </div>
      </div>

      <ToastContainer position="bottom-right" autoClose={5000} />
    </>
  );
}
