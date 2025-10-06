"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";

// --- Custom Toast Implementation ---
// Replaces react-toastify to avoid external CSS issues

const TOAST_CONFIG = {
  success: { bgColor: "bg-green-600", icon: "✅" },
  error: { bgColor: "bg-red-600", icon: "❌" },
  warn: { bgColor: "bg-yellow-600", icon: "⚠️" },
};

const useToast = () => {
  const [toastState, setToastState] = useState(null);
  const timeoutRef = useRef(null);

  const showToast = useCallback((message, type = "success", duration = 5000) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setToastState({ message, type });

    timeoutRef.current = setTimeout(() => {
      setToastState(null);
    }, duration);
  }, []);

  const customToast = {
    success: (msg) => showToast(msg, "success"),
    error: (msg) => showToast(msg, "error"),
    warn: (msg) => showToast(msg, "warn"),
  };

  const ToastContainer = () => {
    if (!toastState) return null;

    const config = TOAST_CONFIG[toastState.type] || TOAST_CONFIG.success;

    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div
          className={`p-4 rounded-xl shadow-2xl text-white flex items-center space-x-3 transition-opacity duration-500 transform ${config.bgColor}`}
          style={{ animation: "toast-in 0.5s forwards" }}
        >
          <span className="text-xl">{config.icon}</span>
          <p className="font-medium text-sm">{toastState.message}</p>
        </div>
      </div>
    );
  };

  useEffect(() => {
    let style = document.getElementById("custom-toast-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "custom-toast-style";
      style.textContent = `
        @keyframes toast-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return { customToast, ToastContainer };
};
// --- End Custom Toast Implementation ---

export default function PdfUpload({ onUploadComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const { customToast, ToastContainer } = useToast();

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
      customToast.error("Please upload a valid PDF or CSV file.");
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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Upload failed: Unknown server error");
      }

      const data = await res.json();

      if (!data.transactions?.length) {
        customToast.warn("No transactions found in file. Check formatting or try another file.");
        return;
      }

      onUploadComplete?.(data.transactions);
      customToast.success(`Uploaded ${data.transactions.length} transactions successfully`);
    } catch (err) {
      console.error(err);
      customToast.error(err.message || "Error processing file.");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 font-inter">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Import Transactions <span className="text-sm text-blue-500">(PDF/CSV)</span>
        </h2>

        {/* Dropzone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
            ${dragActive ? "border-blue-500 bg-blue-50 scale-[1.01]" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}
            ${isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
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
            <div className="flex justify-center items-center space-x-3 text-blue-600">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              <p className="font-semibold">Processing file, please wait...</p>
            </div>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="font-medium text-gray-700">Drop your file here</p>
              <p className="text-sm mt-1 text-gray-500">or click to browse (.pdf or .csv)</p>
            </>
          )}
        </div>

        {/* Sample Download */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3 text-center justify-center">
          <button
            onClick={() => {
              const sampleCSV = `Transaction Date,Transaction Detail,Money In (NGN),Money Out (NGN),Category
2024-01-15,Grocery Store,,"85.50",Food
2024-01-14,Salary Payment,2500.00,,Income
2024-01-13,Netflix Subscription,,"15.99",Entertainment
2024-01-12,Gas Station,,"45.00",Transport`;
              const blob = new Blob([sampleCSV], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "sample-transactions.csv";
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors"
          >
            Download sample CSV template
          </button>
        </div>
      </div>

      {/* Custom toast container */}
      <ToastContainer />
    </>
  );
}
