"use client";
import React, { useState } from "react";

export default function TransactionList({ transactions }) {
  const [showAll, setShowAll] = useState(false);

  if (!transactions) return null;

  const displayedTransactions = showAll ? transactions : transactions.slice(0, 5);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAmount = (amount, type) => {
    const formatted = parseFloat(amount).toFixed(2);
    return type === "income" ? `+₦${formatted}` : `-₦${formatted}`;
  };

  const exportToCSV = () => {
    if (!transactions.length) return;

    const headers = ["Date", "Description", "Category", "Type", "Amount"];
    const rows = transactions.map((t) => [
      formatDate(t.date),
      `"${t.description || "No description"}"`,
      t.category || "Uncategorized",
      t.type,
      parseFloat(t.amount).toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "transactions_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          Recent Transactions
        </h2>
        {transactions.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors duration-200 mt-2 sm:mt-0"
          >
            {showAll ? "Show Less" : `View All (${transactions.length})`}
          </button>
        )}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {displayedTransactions.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base">
            💸 No transactions yet
          </div>
        ) : (
          displayedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-100"
            >
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                    transaction.type === "income"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {transaction.type === "income" ? "⬆️" : "⬇️"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-medium text-gray-800 truncate">
                    {transaction.description || "No description"}
                  </p>
                  <div className="flex flex-wrap items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {transaction.category || "Uncategorized"}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(transaction.date)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right mt-2 sm:mt-0">
                <p
                  className={`text-sm sm:text-base font-semibold ${
                    transaction.type === "income" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatAmount(transaction.amount, transaction.type)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {transactions.length > 0 && (
        <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          <button
            onClick={exportToCSV}
            className="flex-1 text-center text-xs sm:text-sm text-gray-600 hover:text-gray-800 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            📁 Export CSV
          </button>
        </div>
      )}
    </div>
  );
}
