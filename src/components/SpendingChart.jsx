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

export default function SpendingChart({ user }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!user) return;

    const fetchExpenses = async () => {
      const { data: expenses, error } = await supabase
        .from("transactions")
        .select("amount, category, type, date")
        .eq("user_id", user.id)
        .eq("type", "expense");

      if (error) {
        console.error("Error fetching expenses:", error);
        return;
      }

      // Group expenses by category
      const totals = {};
      expenses.forEach((item) => {
        const category = item.category || "Uncategorized";
        totals[category] = (totals[category] || 0) + parseFloat(item.amount);
      });

      // Convert to chart data format
      const chartData = Object.keys(totals).map((category) => ({
        name: category,
        value: totals[category],
      }));

      setData(chartData);
    };

    fetchExpenses();
  }, [user]);

  // Pie chart colors
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

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-md">
          <p className="font-semibold text-gray-800">{payload[0].name}</p>
          <p className="text-gray-600">
            Amount: <span className="font-medium">₦{payload[0].value.toFixed(2)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 w-full h-[450px] flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Spending Breakdown
      </h2>
      {data.length === 0 ? (
        <p className="text-gray-500">No expenses recorded yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={130}
              dataKey="value"
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(1)}%`
              }
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: "14px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
