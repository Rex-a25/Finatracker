"use client";
import React, { useMemo } from "react";

export default function BalanceSummary({ transactions }) {
  // Compute totals using useMemo for performance
  const { income, expenses } = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;

    if (transactions && transactions.length > 0) {
      transactions.forEach(t => {
        // Sanitize the amount before parsing to handle commas and bad input
        const sanitizedAmountString = String(t.amount || 0).replace(/,/g, '');
        const amt = parseFloat(sanitizedAmountString) || 0;

        // FIXED: Determine type based on amount sign
        // Positive amounts are income, negative amounts are expenses
        if (amt > 0) {
          totalIncome += amt;
        } else if (amt < 0) {
          totalExpenses += Math.abs(amt); // Store expenses as positive for display
        }
        // amt === 0 is ignored
      });
    }

    return { income: totalIncome, expenses: totalExpenses };
  }, [transactions]);

  const netFlow = income - expenses; // Correct calculation: Income - Expenses
  const totalMagnitude = income + expenses; // Use the sum for proportional bar calculation
  
  // Calculate flow percentage based on total magnitude
  const netFlowPercent = totalMagnitude === 0 ? 0 : (Math.abs(netFlow) / totalMagnitude) * 100;
  
  const isPositive = netFlow >= 0;

  return (
    <div className="bg-white w-full rounded-xl shadow-md p-4 sm:p-6  h-full">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center sm:text-left">
        Balance Summary
      </h2>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center sm:text-left p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors transform hover:scale-[1.02] shadow-sm">
          <p className="text-sm text-green-600 font-medium mb-2">Total Income</p>
          <p className="text-lg font-semibold text-green-700">
            ₦{income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="text-center sm:text-left p-4 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors transform hover:scale-[1.02] shadow-sm">
          <p className="text-sm text-red-600 font-medium mb-2">Total Expenses</p>
          <p className="text-lg font-semibold text-red-700">
            ₦{expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Net Flow Value */}
      <div className={`p-4 rounded-lg text-center shadow-lg transform transition duration-300 ${isPositive ? 'bg-blue-500 text-white' : 'bg-yellow-500 text-gray-800'}`}>
        <p className="text-sm font-medium mb-1">Current Net Flow</p>
        <p className="text-2xl font-extrabold">
          {netFlow >= 0 ? '+' : '-'}₦{Math.abs(netFlow).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Net Flow Bar - Simple indication of which flow is dominant */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-1 text-sm text-gray-600">
          <span>Income vs. Spending</span>
          <span className={`font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {isPositive ? "Income Dominant" : "Spending Dominant"}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full rounded-l-full ${isPositive ? "bg-green-500" : "bg-red-500"} transition-all duration-300`} 
            style={{ width: `${Math.min(100, Math.max(0, (income / totalMagnitude) * 100))}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{Math.round((income / totalMagnitude) * 100) || 0}% Income</span>
            <span>{Math.round((expenses / totalMagnitude) * 100) || 0}% Spent</span>
        </div>
      </div>
    </div>
  );
}