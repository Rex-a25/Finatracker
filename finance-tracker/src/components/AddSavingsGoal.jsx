"use client";
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function AddSavingsGoal() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    target_amount: "",
    description: "",
    target_date: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase.from("savings_goals").insert([
        {
          user_id: user.id,
          name: form.name,
          target_amount: parseFloat(form.target_amount),
          description: form.description,
          target_date: form.target_date || null,
        },
      ]);

      if (error) throw error;

      toast.success("Savings goal added!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add savings goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Add Savings Goal</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Goal Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-200"
              placeholder="e.g. New Laptop"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Target Amount</label>
            <input
              type="number"
              step="0.01"
              name="target_amount"
              value={form.target_amount}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-200"
              placeholder="50000"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Description (optional)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-200"
              placeholder="Why are you saving?"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Target Date (optional)</label>
            <input
              type="date"
              name="target_date"
              value={form.target_date}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-blue-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            {loading ? "Saving..." : "Save Goal"}
          </button>
        </form>
      </div>
    </div>
  );
}
