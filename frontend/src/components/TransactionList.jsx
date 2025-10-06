"use client";
import React, { useState, useMemo } from "react";

export default function TransactionList({ transactions = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, income, expense
  const [sortBy, setSortBy] = useState("date"); // date, amount, description

  // Filter and sort transactions
  const processedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType === "income") {
      filtered = filtered.filter(t => t.amount > 0);
    } else if (filterType === "expense") {
      filtered = filtered.filter(t => t.amount < 0);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return Math.abs(b.amount) - Math.abs(a.amount);
        case "description":
          return (a.description || "").localeCompare(b.description || "");
        case "date":
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

    return filtered;
  }, [transactions, searchTerm, filterType, sortBy]);

  // Calculate totals for filtered transactions
  const totals = useMemo(() => {
    const income = processedTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = processedTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expenses, net: income - expenses };
  }, [processedTransactions]);

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Transaction History</h2>
        
        {/* Filters and Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Transactions</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="description">Sort by Description</option>
          </select>
        </div>

        {/* Summary of filtered transactions */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
          <div className="bg-green-50 p-2 rounded text-center">
            <span className="text-green-600 font-semibold">
              Income: ₦{totals.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-red-50 p-2 rounded text-center">
            <span className="text-red-600 font-semibold">
              Expenses: ₦{totals.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className={`${totals.net >= 0 ? 'bg-blue-50' : 'bg-yellow-50'} p-2 rounded text-center`}>
            <span className={`${totals.net >= 0 ? 'text-blue-600' : 'text-yellow-700'} font-semibold`}>
              Net: ₦{totals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        {processedTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">No transactions found</p>
            <p className="text-sm">Upload a PDF or CSV file to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Description</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Category</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-600">Type</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {processedTransactions.map((transaction, index) => {
                const isIncome = transaction.amount > 0;
                return (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-2 text-sm text-gray-700">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-700">
                      {transaction.description || "No description"}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {transaction.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold ${
                          isIncome
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isIncome ? "IN ↓" : "OUT ↑"}
                      </span>
                    </td>
                    <td className={`py-3 px-2 text-sm text-right font-semibold ${
                      isIncome ? "text-green-600" : "text-red-600"
                    }`}>
                      {isIncome ? "+" : "-"}₦
                      {Math.abs(transaction.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Transaction count */}
      {processedTransactions.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {processedTransactions.length} of {transactions.length} transactions
        </div>
      )}
    </div>
  );
}