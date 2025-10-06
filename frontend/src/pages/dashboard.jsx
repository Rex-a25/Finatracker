"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

import BalanceSummary from "../components/BalanceSummary";
import TransactionList from "../components/TransactionList";
import LoadingOverlay from "../components/LoadingOverlay";
import StatementUpload from "../components/StatementUpload";
import BudgetOverview from "../components/BudgetOverview";
import SavingsGoal from "../components/SavingsGoal";
import { supabase } from "../supabaseClient";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user || null);
    });
  }, []);

  // Fetch transactions with RLS
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
      toast.success(`Loaded ${data.length} transactions from database.`);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch initial transactions AND set up Realtime subscription (MODIFIED)
  useEffect(() => {
    if (user) {
      // 2a. Initial data fetch (still needed for first load)
      fetchTransactions();

      // 2b. Setup Realtime Listener (NEW)
      const transactionsChannel = supabase
        .channel("transactions_changes") // Unique channel name
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
          (payload) => {
            // Real-time event received! Prepend the new transaction to the list
            const newTransaction = payload.new;
            
            setTransactions((currentTransactions) => [
              newTransaction,
              ...currentTransactions,
            ]);

            // Optional toast for user feedback
            toast.info(`🔔 New transaction detected: ${newTransaction.description}`);
          }
        )
        .subscribe();

      // Cleanup function: Unsubscribe when the component unmounts (NEW)
      return () => {
        transactionsChannel.unsubscribe();
      };
      
    } else if (user === null) {
      setIsLoading(false);
    }
  }, [user]); // Re-run when the user object changes

  // Handle upload complete
  const handleUploadComplete = async (newTransactions) => {
    if (!user) {
      toast.error("You must be logged in to save transactions.");
      return;
    }

    try {
      setIsLoading(true);

      const transactionsToInsert = newTransactions.map((t) => ({
        id: uuidv4(),
        type: t.amount > 0 ? "income" : "expense",
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from("transactions")
        .insert(transactionsToInsert);

      if (error) throw error;

      // REMOVED: No need to call fetchTransactions() manually. 
      // The Realtime listener set up in useEffect now handles the update automatically.
      
      toast.success(
        `Successfully saved ${newTransactions.length} new transactions!`
      );
    } catch (err) {
      console.error("Error saving new transactions:", err);
      toast.error("Failed to save new transactions to the database.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-3 sm:px-4 py-4 sm:py-6 md:py-8 mt-14">
      <div className="w-full max-w-7xl flex flex-col gap-5 sm:gap-6 md:gap-8">
        {/* Header */}
        <header className="bg-white shadow-md rounded-xl p-4 sm:p-6 text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            📊 Financial Dashboard
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Track your balance, spending, budgets, and goals{" "}
            <span className="text-blue-800 font-bold">all in one place</span>!
          </p>
        </header>

        {/* Top Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={() => navigate("/report")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
            disabled={isLoading}
          >
            📑 View Report
          </button>
        </div>

        {/* Main Grid */}
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
          {/* Balance Summary */}
          <div className="col-span-1">
            <BalanceSummary transactions={transactions} />
          </div>

          {/* PDF Upload */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <StatementUpload
              onUploadComplete={handleUploadComplete}
              disabled={isLoading}
            />
          </div>

          {/* Budget Overview */}
          <div className="col-span-1">
            <BudgetOverview />
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