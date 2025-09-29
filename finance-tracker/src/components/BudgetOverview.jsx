"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function AddBudgetForm({ onClose, onBudgetAdded }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const addBudget = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("You must be logged in");

    const { error } = await supabase
      .from("budgets")
      .insert([{
        name,
        category: category || "General",
        amount: parseFloat(amount),
        start_date: startDate,
        end_date: endDate,
        user_id: user.id,
        recurring: "none",
        period: "custom",
        rollover: false,
      }]);

    if (error) alert("Error adding budget: " + error.message);
    else {
      onBudgetAdded && onBudgetAdded();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <form onSubmit={addBudget} className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Budget</h2>
        <input type="text" placeholder="Budget Name" value={name} onChange={e => setName(e.target.value)} className="w-full mb-2 p-2 border rounded" required />
        <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="w-full mb-2 p-2 border rounded" required />
        <input type="text" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} className="w-full mb-2 p-2 border rounded" />
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mb-2 p-2 border rounded" required />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mb-4 p-2 border rounded" required />
        <div className="flex justify-between">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Add</button>
        </div>
      </form>
    </div>
  );
}

function AddSpendingForm({ budget, onClose, onSpendingAdded }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const addSpending = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("You must be logged in");

    const { error } = await supabase
      .from("transactions")
      .insert([{
        user_id: user.id,
        budget_id: budget.id,
        amount: parseFloat(amount),
        description: description || "No description",
        category: budget.category || "General",
        type: "expense",
        date: new Date().toISOString()
      }]);

    if (error) alert("Error adding spending: " + error.message);
    else {
      onSpendingAdded && onSpendingAdded();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <form onSubmit={addSpending} className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Add Spending to {budget.name}</h2>
        <input type="number" placeholder="Amount spent" value={amount} onChange={e => setAmount(e.target.value)} className="w-full mb-2 p-2 border rounded" required />
        <input type="text" placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} className="w-full mb-4 p-2 border rounded" />
        <div className="flex justify-between">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Add</button>
        </div>
      </form>
    </div>
  );
}

export default function BudgetOverview() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [activeSpendingBudget, setActiveSpendingBudget] = useState(null);

  const fetchBudgetData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: budgetsData } = await supabase.from("budgets").select("*").eq("user_id", user.id);
      const { data: transactions } = await supabase.from("transactions").select("amount, category, budget_id").eq("user_id", user.id);

      const categorySpending = {};
      transactions?.forEach(t => {
        categorySpending[t.budget_id] = (categorySpending[t.budget_id] || 0) + t.amount;
      });

      const budgetsWithSpending = budgetsData?.map(b => {
        const spent = categorySpending[b.id] || 0;
        const remaining = Math.max(b.amount - spent, 0);
        const percentage = Math.min((spent / b.amount) * 100, 100);
        const isOverBudget = spent > b.amount;
        return { ...b, spent, remaining, percentage, isOverBudget };
      }) || [];

      setBudgets(budgetsWithSpending);
      setTotalBudget(budgetsData?.reduce((sum, b) => sum + Number(b.amount), 0) || 0);
      setTotalSpent(budgetsWithSpending?.reduce((sum, b) => sum + b.spent, 0) || 0);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBudgetData(); }, []);

  const deleteBudget = async (id) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;
    await supabase.from("expenses").delete().eq("budget_id", id);
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) alert("Error deleting budget: " + error.message);
    fetchBudgetData();
  };

  const formatCurrency = (amount) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);
  const getProgressColor = (percentage) => percentage >= 90 ? "bg-red-500" : percentage >= 75 ? "bg-yellow-500" : "bg-green-500";

  if (loading) return <div className="p-6 bg-white rounded-xl shadow-md">Loading...</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Budget Summary</h2>
        <button onClick={() => setShowAddBudget(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">+ Add Budget</button>
      </div>

      <p>Total Budget: {formatCurrency(totalBudget)}</p>
      <p>Spent: {formatCurrency(totalSpent)}</p>
      <p>Remaining: {formatCurrency(totalBudget - totalSpent)}</p>

      <div className="space-y-4 mt-4">
        {budgets.length === 0 ? <p className="text-gray-500">No budgets set. Add one!</p> : budgets.map(b => (
          <div key={b.id} className="p-4 bg-gray-50 rounded-lg shadow-sm relative">
            <div className="flex justify-between mb-1">
              <span className="font-medium">{b.name || b.category}</span>
              <span className="text-gray-600">{formatCurrency(b.spent)} / {formatCurrency(b.amount)}</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-1">
              <div className={`${getProgressColor(b.percentage)} h-full rounded-full transition-all duration-500`} style={{ width: `${b.percentage}%` }} />
            </div>
            <p className="text-sm text-gray-500">Remaining: {formatCurrency(b.remaining)}</p>
            {b.isOverBudget && <p className="text-xs text-red-600 mt-1">Over Budget!</p>}
            <div className="flex gap-2 mt-2">
              <button onClick={() => setActiveSpendingBudget(b)} className="text-green-600 text-xs hover:underline">+ Add Spending</button>
              <button onClick={() => deleteBudget(b.id)} className="text-red-600 text-xs hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showAddBudget && <AddBudgetForm onClose={() => setShowAddBudget(false)} onBudgetAdded={fetchBudgetData} />}
      {activeSpendingBudget && <AddSpendingForm budget={activeSpendingBudget} onClose={() => setActiveSpendingBudget(null)} onSpendingAdded={fetchBudgetData} />}
    </div>
  );
}
