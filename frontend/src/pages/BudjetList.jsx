"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function BudjetList({ onBudgetAdded }) {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setBudgets(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching budgets:", err);
      setLoading(false);
    }
  };

  const deleteBudget = async (budgetId) => {
    const confirmDelete = confirm("Are you sure you want to delete this budget and all its related expenses?");
    if (!confirmDelete) return;

    try {
      // Delete related expenses first
      const { error: expenseError } = await supabase
        .from("expenses")
        .delete()
        .eq("budget_id", budgetId);

      if (expenseError) throw expenseError;

      // Delete the budget
      const { error: budgetError } = await supabase
        .from("budgets")
        .delete()
        .eq("id", budgetId);

      if (budgetError) throw budgetError;

      // Update local state
      setBudgets(budgets.filter(b => b.id !== budgetId));
      alert("✅ Budget deleted successfully!");
    } catch (err) {
      console.error("Error deleting budget:", err);
      alert("Error deleting budget: " + err.message);
    }
  };

  if (loading) return <div className="p-6 bg-white rounded-xl shadow-md">Loading...</div>;

  return (
    <div className="p-6 mt-28 max-w-2xl mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">My Budgets</h1>

      {budgets.length === 0 ? (
        <p className="text-gray-500">No budgets yet. Add one!</p>
      ) : (
        <ul className="space-y-3">
          {budgets.map((b) => (
            <li key={b.id} className="p-4 bg-gray-50 rounded-lg shadow flex justify-between items-center">
              <div>
                <div className="font-medium">{b.name || b.category}</div>
                <div className="text-gray-600">
                  ₦{b.spent || 0} / ₦{b.amount}
                </div>
              </div>
              <button
                onClick={() => deleteBudget(b.id)}
                className="text-red-600 hover:text-red-800 font-semibold"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
