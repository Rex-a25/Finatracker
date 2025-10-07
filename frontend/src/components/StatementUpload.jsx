"use client";
import React, { useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { toast, ToastContainer } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";

export default function StatementUpload({ onUploadComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
    
    // CRITICAL CORRECTION: Clear the file input value after selection
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const processFile = async (file) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // ⚠️ NOTE: Ensure the port matches your backend (4000 or 5000 from previous snippets)
      const res = await fetch("http://localhost:5000/upload", { 
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        // IMPROVEMENT: Read error response from server if available
        const errorText = await res.text();
        let errorMessage = `Server responded with status ${res.status}.`;
        try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const responseData = await res.json();
      const transactions = responseData.transactions || [];
      
      if (!transactions.length) {
        // IMPROVEMENT: Handle the server's empty success array gracefully
        toast.warn("⚠️ File processed, but no valid transactions were found.");
        if (onUploadComplete) onUploadComplete([]);
        return; // Exit function gracefully
      }

      await uploadTransactions(transactions);

      if (onUploadComplete) onUploadComplete(transactions);
      toast.success(`✅ Successfully imported ${transactions.length} transactions!`);
      
    } catch (err) {
      console.error(err);
      toast.error(err.message || "An unknown error occurred while processing statement.");
    } finally {
      setIsUploading(false);
    }
  };

  const uploadTransactions = async (transactions) => {
   
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    
    if (!user) throw new Error("User not authenticated. Please log in again.");

    // Minor improvement: map category to default if null/empty string
    const transactionsToInsert = transactions.map(t => ({
      date: t.date,
      description: t.description,
      amount: t.amount,
      category: t.category || 'Uncategorized', // Ensure category isn't null
      user_id: user.id,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase.from("transactions").insert(transactionsToInsert);

    if (error) {
        console.error("Supabase Insert Error:", error);
        // Throw a user-friendly error message
        throw new Error(`Failed to save transactions: ${error.message}`);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Upload Bank Statement</h2>

        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          // Only allow click interaction if not uploading
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
            <p className="text-blue-600 font-medium">
                <span className="animate-spin inline-block mr-2">⚙️</span>
                Processing file, please wait...
            </p>
          ) : (
            <>
              <p className="text-gray-700 font-medium">Drop PDF/CSV file here or click to browse</p>
              <p className="text-xs mt-1 text-gray-500">Supports PDF/Image parsing via Gemini, or direct CSV parsing.</p>
              <p className="text-xs mt-1 text-gray-500">Depending on your file size, it may take a while to analyse so please wait.</p>
              
            </>
          )}
        </div>
      </div>

      <ToastContainer position="bottom-right" autoClose={5000} />
    </>
  );
}