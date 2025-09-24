import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(showAll ? 50 : 5);

      if (error) throw error;
      setTransactions(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAmount = (amount, type) => {
    return type === 'income' ? `+$${amount.toFixed(2)}` : `-$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-6 sm:h-7 bg-gray-300 rounded w-1/3 mb-4 sm:mb-6"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between mb-4 last:mb-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-300 rounded w-20 sm:w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="h-5 bg-gray-300 rounded w-12 sm:w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayedTransactions = showAll ? transactions : transactions.slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          Recent Transactions
        </h2>
        {transactions.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors duration-200"
          >
            {showAll ? 'Show Less' : `View All (${transactions.length})`}
          </button>
        )}
      </div>

      {/* Transactions List */}
      <div className="space-y-3 sm:space-y-4">
        {displayedTransactions.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-400 text-4xl mb-3">💸</div>
            <p className="text-gray-500 text-sm sm:text-base">No transactions yet</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Add your first transaction to get started</p>
          </div>
        ) : (
          displayedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 sm:p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-100"
            >
              {/* Transaction Icon and Details */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {transaction.type === 'income' ? '⬆️' : '⬇️'}
                </div>
                
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-medium text-gray-800 truncate">
                    {transaction.description || 'No description'}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {transaction.category || 'Uncategorized'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(transaction.date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right">
                <p
                  className={`text-sm sm:text-base font-semibold ${
                    transaction.type === 'income' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}
                >
                  {formatAmount(transaction.amount, transaction.type)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {transactions.length > 0 && (
        <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-100">
          <div className="flex space-x-3">
            <button className="flex-1 text-center text-xs sm:text-sm text-gray-600 hover:text-gray-800 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              📊 View Report
            </button>
            <button className="flex-1 text-center text-xs sm:text-sm text-gray-600 hover:text-gray-800 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              📁 Export CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}