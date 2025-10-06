"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function SavingsGoal() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, type: null, goalId: null });

  useEffect(() => {
    fetchSavingsData();
  }, []);

  const fetchSavingsData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", user.id);

      if (goalsError) throw goalsError;

      // Fetch transactions
      const { data: txs, error: txsError } = await supabase
        .from("savings_transactions")
        .select("goal_id, amount")
        .eq("user_id", user.id);

      if (txsError) throw txsError;

      const totals =
        txs?.reduce((acc, t) => {
          acc[t.goal_id] = (acc[t.goal_id] || 0) + t.amount;
          return acc;
        }, {}) || {};

      const goalsWithProgress =
        goalsData?.map((g) => {
          const saved = totals[g.id] || 0;
          const progress = g.target_amount
            ? Math.min((saved / g.target_amount) * 100, 100)
            : 0;
          return { ...g, saved, progress };
        }) || [];

      setGoals(goalsWithProgress);
    } catch (err) {
      console.error("Error fetching savings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async (goalId, amount, note) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase.from("savings_transactions").insert([
        {
          goal_id: goalId,
          user_id: user.id,
          amount,
          note,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setModal({ open: false, type: null, goalId: null });
      fetchSavingsData(); // refresh UI
    } catch (err) {
      console.error("Transaction error:", err);
    }
  };

  const handleAddGoal = async (name, targetAmount) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase.from("savings_goals").insert([
        {
          name,
          target_amount: parseFloat(targetAmount),
          user_id: user.id,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      fetchSavingsData();
    } catch (err) {
      console.error("Add goal error:", err);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Savings Goals</h2>

      {/* Add Savings Goal Button */}
      <div className="mb-4">
        <button
          onClick={() => setModal({ open: true, type: "addGoal" })}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          + Add Savings Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <p>No savings goals yet.</p>
      ) : (
        goals.map((goal) => (
          <div key={goal.id} className="border p-4 rounded mb-4">
            <h3 className="font-medium">{goal.name}</h3>
            <p className="text-sm text-gray-500">
              ${goal.saved.toFixed(2)} / ${goal.target_amount.toFixed(2)}
            </p>
            <div className="w-full bg-gray-200 h-2 rounded mt-2 mb-3">
              <div
                className="bg-blue-600 h-2 rounded"
                style={{ width: `${goal.progress}%` }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setModal({ open: true, type: "add", goalId: goal.id })
                }
                className="px-3 py-1 text-sm bg-green-500 text-white rounded"
              >
                + Add
              </button>
              <button
                onClick={() =>
                  setModal({ open: true, type: "withdraw", goalId: goal.id })
                }
                className="px-3 py-1 text-sm bg-red-500 text-white rounded"
              >
                – Withdraw
              </button>
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {modal.open && (
        <TransactionModal
          type={modal.type}
          goalId={modal.goalId}
          onClose={() => setModal({ open: false, type: null, goalId: null })}
          onSave={handleTransaction}
          onAddGoal={handleAddGoal}
        />
      )}
    </div>
  );
}

// Modal Component handles both Add/Withdraw and Add Goal
function TransactionModal({ type, goalId, onClose, onSave, onAddGoal }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (type === "addGoal") {
      if (!goalName || !targetAmount) return;
      onAddGoal(goalName, targetAmount);
    } else {
      const value = parseFloat(amount);
      if (!value || value <= 0) return;
      onSave(goalId, type === "add" ? value : -value, note);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-80">
        <h3 className="font-semibold mb-3">
          {type === "addGoal"
            ? "Add Savings Goal"
            : type === "add"
            ? "Add Savings"
            : "Withdraw Savings"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          {type === "addGoal" ? (
            <>
              <input
                type="text"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Goal Name"
                required
              />
              <input
                type="number"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Target Amount"
                required
              />
            </>
          ) : (
            <>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter amount"
                required
              />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Optional note"
              />
            </>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded bg-blue-600 text-white"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
