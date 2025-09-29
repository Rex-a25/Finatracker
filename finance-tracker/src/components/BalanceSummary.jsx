"use client";
import React, { useMemo } from "react";

export default function BalanceSummary({ transactions }) {
  // Compute totals using useMemo for performance
  const { income, expenses } = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;

    if (transactions && transactions.length > 0) {
      transactions.forEach(t => {
        const amt = parseFloat(t.amount) || 0;
        if (t.type === "income") totalIncome += amt;
        else if (t.type === "expense") totalExpenses += amt;
      });
    }

    return { income: totalIncome, expenses: totalExpenses };
  }, [transactions]);

  const totalFlow = income + expenses; // income minus expenses
  const netFlowPercent = totalFlow !== 0 ? Math.abs(income - expenses) / (income + expenses) * 100 : 50;
  const isPositive = income >= expenses;

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 w-full">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center sm:text-left">
        Balance Summary
      </h2>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="text-center sm:text-left p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
          <p className="text-sm text-green-600 font-medium mb-2">Total Received</p>
          <p className="text-lg font-semibold text-green-700">
            ₦{Math.round(income).toLocaleString()}
          </p>
        </div>

        <div className="text-center sm:text-left p-4 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">
          <p className="text-sm text-red-600 font-medium mb-2">Total Spent</p>
          <p className="text-lg font-semibold text-red-700">
            ₦{Math.round(expenses).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Net Flow Bar */}
      <div>
        <div className="flex justify-between items-center mb-1 text-sm text-gray-600">
          <span>Net Flow</span>
          <span className={`font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {isPositive ? "Positive" : "Negative"}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-full rounded-full ${isPositive ? "bg-green-500" : "bg-red-500"} transition-all duration-300`}
            style={{ width: `${netFlowPercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
