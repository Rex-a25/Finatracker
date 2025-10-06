"use client";
import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AddExpense({ budgetId, onExpenseAdded }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const handleAddExpense = async (e) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("You must be logged in");
 
    const { error } = await supabase
      .from("expenses")
      .insert([
        {
          user_id: user.id,
          budget_id: budgetId,
          description,
          amount,
        },
      ]);

    if (error) {
      console.error("Error adding expense:", error);
    } else {
      setDescription("");
      setAmount("");
      if (onExpenseAdded) onExpenseAdded();
    }
    if (!error) {
       setDescription("");
       setAmount("");
        if (onExpenseAdded) onExpenseAdded(); // ✅ refresh parent
    }
  };

  return (
    <form onSubmit={handleAddExpense} className="mt-2 flex space-x-2">
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 rounded flex-1"
        required
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border p-2 rounded w-32"
        required
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Add
      </button>
    </form>
  );
}
