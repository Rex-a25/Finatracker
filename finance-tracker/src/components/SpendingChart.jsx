"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function SpendingChart({ transactions, user }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    // If transactions are provided, use them
    if (transactions && transactions.length > 0) {
      processTransactions(transactions);
    } 
    // Otherwise, fetch from Supabase using user
    else if (user) {
      fetchExpenses(user);
    }
  }, [transactions, user]);

  const fetchExpenses = async (user) => {
    try {
      const { data: expenses, error } = await supabase
        .from("transactions")
        .select("amount, category, type")
        .eq("user_id", user.id)
        .eq("type", "expense");

      if (error) throw error;
      processTransactions(expenses || []);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  };

  const processTransactions = (txns) => {
    const totals = {};
    txns.forEach((t) => {
      if (t.type !== "expense") return;
      const category = t.category || "Uncategorized";
      let amt = parseFloat(t.amount);
      if (isNaN(amt)) return;
      amt = Math.round(amt * 100) / 100;
      totals[category] = (totals[category] || 0) + amt;
    });

    const chartData = Object.keys(totals).map((cat) => ({
      name: cat,
      value: Math.round(totals[cat] * 100) / 100,
    }));

    setData(chartData);
  };

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#9932CC",
    "#FF69B4",
    "#2E8B57",
    "#FF4500",
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-md">
          <p className="font-semibold text-gray-800">{payload[0].name}</p>
          <p className="text-gray-600">
            Amount:{" "}
            <span className="font-medium">
              ₦{payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6 w-full h-[300px] flex items-center justify-center">
        <p className="text-gray-500">No expense data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 w-full h-[300px]">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Spending by Category</h2>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "14px" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
