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
  };

  const processFile = async (file) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:4000/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload statement");

      const { transactions } = await res.json();
      if (!transactions.length) throw new Error("No valid transactions found in file");

      await uploadTransactions(transactions);

      if (onUploadComplete) onUploadComplete(transactions);
      toast.success(`✅ Successfully imported ${transactions.length} transactions!`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error processing statement");
    } finally {
      setIsUploading(false);
    }
  };

  const uploadTransactions = async (transactions) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase.from("transactions").insert(
      transactions.map(t => ({
        ...t,
        user_id: user.id,
        created_at: new Date().toISOString()
      }))
    );

    if (error) throw error;
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
            <p>Processing...</p>
          ) : (
            <>
              <p>Drop PDF here or click to browse</p>
              <p className="text-xs mt-1 text-gray-500">PDF parsing supported, CSV optional</p>
            </>
          )}
        </div>
      </div>

      <ToastContainer position="bottom-right" autoClose={5000} />
    </>
  );
}
