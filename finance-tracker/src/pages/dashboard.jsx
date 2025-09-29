"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import BalanceSummary from "../components/BalanceSummary";
import TransactionList from "../components/TransactionList";
import SpendingChart from "../components/SpendingChart";
import PdfUpload from "../components/PdfUpload";
import BudgetOverview from "../components/BudgetOverview";
import SavingsGoal from "../components/SavingsGoal";
import { supabase } from "../supabaseClient";

export default function Dashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      toast.error("Failed to load transactions");
    }
  };

  const handleUploadComplete = (newTransactions) => {
    // ✅ Merge new + old, avoid duplicates by transaction "date+desc+amount"
    setTransactions((prev) => {
      const merged = [...newTransactions, ...prev];
      const unique = merged.filter(
        (t, index, self) =>
          index ===
          self.findIndex(
            (x) =>
              x.date === t.date &&
              x.description === t.description &&
              x.amount === t.amount
          )
      );
      return unique;
    });
    toast.success("Transactions updated ✅");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-6 sm:py-8 mt-16">
      <div className="w-full max-w-7xl flex flex-col gap-6 sm:gap-8">
        {/* Header */}
        <header className="bg-white shadow-md rounded-xl p-4 sm:p-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            📊 Financial Dashboard
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Track your balance, spending, budgets, and goals — all in one place.
          </p>
        </header>

        {/* Top Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={() => toast.info("Export feature coming soon")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors w-full sm:w-auto"
          >
            ⬇️ Export Data
          </button>
          <button
            onClick={() => navigate("/report")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            📑 View Report
          </button>
        </div>

        {/* Main Grid */}
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Balance Summary */}
          <div className="col-span-1">
            <BalanceSummary transactions={transactions} />
          </div>

          {/* Spending Chart */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <SpendingChart transactions={transactions} />
          </div>

          {/* Budget Overview */}
          <div className="col-span-1">
            <BudgetOverview />
          </div>

          {/* PDF/CSV Upload */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <PdfUpload onUploadComplete={handleUploadComplete} />
          </div>

          {/* Transaction List */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <TransactionList transactions={transactions} />
          </div>

          {/* Savings Goal */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <SavingsGoal />
          </div>
        </main>
      </div>
    </div>
  );
}
