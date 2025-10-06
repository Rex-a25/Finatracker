"use client";
import { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// Define consistent, professional colors
const CHART_COLORS = [
  "#2563EB", // Blue
  "#059669", // Green
  "#EA580C", // Orange
  "#DB2777", // Pink
  "#7C3AED", // Purple
  "#F59E0B", // Amber
  "#475569", // Slate
  "#14B8A6", // Teal
];

// Custom Legend Component
const CustomCategoryLegend = ({ data, total }) => (
    <div className="flex flex-col gap-1 text-sm font-medium">
        {data.map((entry, index) => {
            const percent = (entry.value / total) * 100;
            return (
                <div key={`legend-${index}`} className="flex justify-between items-center pr-2">
                    <div className="flex items-center">
                        <span 
                            className="inline-block w-3 h-3 mr-2 rounded-full" 
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        ></span>
                        <span className="text-gray-700">{entry.name}</span>
                    </div>
                    <span className="text-gray-500">
                        {percent.toFixed(1)}% (₦{entry.value.toLocaleString()})
                    </span>
                </div>
            );
        })}
    </div>
);


export default function SpendingChart({ transactions = [] }) {
  const { chartData, totalExpenses } = useMemo(() => {
    const totals = {};
    let total = 0;

    transactions.forEach((t) => {
      const amount = parseFloat(t.amount);
      
      // Filter: Only include expenses (negative amounts)
      if (amount >= 0 || isNaN(amount)) return; 
      
      const expenseAmount = Math.abs(amount);
      const category = t.category || "Uncategorized";
      
      totals[category] = (totals[category] || 0) + expenseAmount;
      total += expenseAmount;
    });

    const data = Object.keys(totals).map((cat) => ({
      name: cat,
      value: Math.round(totals[cat] * 100) / 100, 
    }));

    // Sort by value (biggest first) for better visual flow
    data.sort((a, b) => b.value - a.value);

    return { chartData: data, totalExpenses: total };
  }, [transactions]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const percent = (entry.value / totalExpenses) * 100;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-md">
          <p className="font-semibold text-gray-800">{entry.name}</p>
          <p className="text-gray-600">
            Amount:{" "}
            <span className="font-medium">
              ₦{entry.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </p>
          <p className="text-gray-600">Percentage: {percent.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-white shadow-none p-0 w-full h-[300px] flex items-center justify-center">
        <p className="text-gray-500">No expense data available.</p>
      </div>
    );
  }

  // Use a flex container to put the PieChart and the Legend side-by-side
  return (
    <div className="w-full h-[350px] flex flex-col md:flex-row items-center justify-between">
        {/* Pie Chart (Takes 50% width on md screens) */}
        <div className="w-full md:w-1/2 h-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120} // Increased size for visibility
                        dataKey="value"
                        labelLine={false} // Removed label lines
                    >
                        {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    {/* 🚨 Removed the default <Legend /> component */}
                </PieChart>
            </ResponsiveContainer>
        </div>

        {/* Custom Legend (Takes 50% width on md screens) */}
        <div className="w-full md:w-1/2 h-full flex flex-col justify-center items-start pt-4 md:pt-0">
            <h4 className="font-bold text-gray-800 mb-2">Category Breakdown</h4>
            <CustomCategoryLegend data={chartData} total={totalExpenses} />
        </div>
    </div>
  );
}