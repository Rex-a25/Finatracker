"use client";
import { useState } from "react";
import { supabase } from "../supabaseClient";

export const BUDGET_CATEGORIES = [
  "food",
  "transport",
  "entertainment",
  "utilities",
  "shopping",
  "tfare",
  "others"
];

export default function AddBudget({ onBudgetAdded }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [recurring, setRecurring] = useState("none"); // default to "none"

  const addBudget = async (e) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to add a budget.");
      return;
    }

    const { data, error } = await supabase
      .from("budgets")
      .insert([{
        name,
        category: category || "General",
        amount: parseFloat(amount),
        user_id: user.id,
        recurring,
        period: "custom",
        rollover: false,
      }])
      .select();

    if (error) {
      console.error("Error creating budget:", error);
      alert("Error creating budget: " + error.message);
    } else {
      alert("✅ Budget added!");
      onBudgetAdded && onBudgetAdded(data[0]);

      // Clear form
      setName("");
      setAmount("");
      setCategory("");
      setRecurring("none");
    }
  };

  return (
    <form
      onSubmit={addBudget}
      className="max-w-md mx-auto my-10 p-6 bg-white rounded-2xl shadow-lg"
    >
      <h2 className="text-2xl font-bold text-blue-600 mb-4">Add Budget</h2>

      <input
        type="text"
        placeholder="Budget Name"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
        required
      />

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
        required
      />

      <select
        value={category}
        onChange={e => setCategory(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      >
        <option value="">Select Category</option>
        {BUDGET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <select
        value={recurring}
        onChange={e => setRecurring(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      >
        <option value="none">No Recurring</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
      >
        Save Budget
      </button>
    </form>
  );
}
