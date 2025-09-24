import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CsvUpload({ onUploadComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
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
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const text = await readFileAsText(file);
      const transactions = parseCSV(text);
      
      if (transactions.length === 0) {
        throw new Error('No valid transactions found in CSV');
      }

      await uploadTransactions(transactions);
      
      toast.success(`Successfully uploaded ${transactions.length} transactions!`);
      if (onUploadComplete) {
        onUploadComplete();
      }
      
    } catch (error) {
      console.error('Error processing CSV:', error);
      toast.error(error.message || 'Error processing CSV file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV file is empty or invalid');

    // Simple CSV parsing (supports basic CSV format)
    const transactions = [];
    
    for (let i = 1; i < lines.length; i++) { // Skip header row
      const line = lines[i].trim();
      if (!line) continue;

      // Basic CSV parsing (handles quoted fields)
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      // Expecting format: date,description,amount,type,category
      if (values.length >= 3) {
        const [date, description, amount, type = 'expense', category = 'Uncategorized'] = values;
        
        const transaction = {
          date: parseDate(date),
          description: description.replace(/"/g, ''),
          amount: parseFloat(amount.replace(/[$,]/g, '')),
          type: type.toLowerCase().includes('income') ? 'income' : 'expense',
          category: category.replace(/"/g, '') || 'Uncategorized'
        };

        // Validate transaction
        if (transaction.date && transaction.description && !isNaN(transaction.amount)) {
          transactions.push(transaction);
        }
      }
    }

    return transactions;
  };

  const parseDate = (dateString) => {
    const formats = [
      'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 
      'MM-DD-YYYY', 'DD-MM-YYYY'
    ];
    
    for (let format of formats) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    // Fallback to today if date parsing fails
    return new Date().toISOString().split('T')[0];
  };

  const uploadTransactions = async (transactions) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const transactionsWithUser = transactions.map(transaction => ({
      ...transaction,
      user_id: user.id,
      created_at: new Date().toISOString()
    }));

    // Upload in batches to avoid timeout
    const batchSize = 10;
    for (let i = 0; i < transactionsWithUser.length; i += batchSize) {
      const batch = transactionsWithUser.slice(i, i + batchSize);
      const { error } = await supabase
        .from('transactions')
        .insert(batch);

      if (error) throw error;
      
      setUploadProgress(Math.round(((i + batch.length) / transactionsWithUser.length) * 100));
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
          Import Transactions
        </h2>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            accept=".csv"
            className="hidden"
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Uploading transactions...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">📁</span>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Drop your CSV file here or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Supports: Date, Description, Amount, Type, Category
              </p>
            </>
          )}
        </div>

        {/* CSV Format Guide */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Expected CSV Format:</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Date:</span>
              <span>MM/DD/YYYY or YYYY-MM-DD</span>
            </div>
            <div className="flex justify-between">
              <span>Description:</span>
              <span>Transaction details</span>
            </div>
            <div className="flex justify-between">
              <span>Amount:</span>
              <span>Number (e.g., 100.50)</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span>income or expense</span>
            </div>
            <div className="flex justify-between">
              <span>Category:</span>
              <span>Food, Shopping, etc.</span>
            </div>
          </div>
        </div>

        {/* Sample Download */}
        <div className="mt-4 gap-3 flex text-center">
          <button
            onClick={() => {
              // Create sample CSV content
              const sampleCSV = `date,description,amount,type,category
2024-01-15,Grocery Store,85.50,expense,Food
2024-01-14,Salary Payment,2500.00,income,Salary
2024-01-13,Netflix Subscription,15.99,expense,Entertainment
2024-01-12,Gas Station,45.00,expense,Transportation`;
              
              const blob = new Blob([sampleCSV], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'sample-transactions.csv';
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Download sample CSV template
          </button>
          <a 
          className='text-sm text-blue-700 underline hover:text-blue-500'
          target='_blank'
          href="https://www.freeconvert.com/csv-converter"> Convert your file to csv</a>
        </div>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}