import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function BalanceSummary() {
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalanceData();
  }, []);

  const fetchBalanceData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id);

      if (error) throw error;

      const totalIncome = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) || 0;
      
      const totalExpenses = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      setIncome(totalIncome);
      setExpenses(totalExpenses);
      setBalance(totalIncome - totalExpenses);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching balance data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-5 sm:h-6 bg-gray-300 rounded w-1/2 mb-3 sm:mb-4"></div>
          <div className="h-7 sm:h-8 lg:h-10 bg-gray-300 rounded w-3/4 mb-2 sm:mb-3"></div>
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-4">
            <div className="h-16 sm:h-20 bg-gray-200 rounded"></div>
            <div className="h-16 sm:h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700 mb-2">
          Balance Summary
        </h2>
        
        {/* Current Balance - Responsive text sizing */}
        <div className="mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">Current Balance</p>
          <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${
            balance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ${Math.abs(balance).toFixed(2)}
            {balance < 0 && (
              <span className="text-sm sm:text-base ml-1">(Overdraft)</span>
            )}
          </p>
        </div>
      </div>

      {/* Income vs Expenses Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
        {/* Income Card */}
        <div className="text-center p-2 sm:p-3 lg:p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors duration-200">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full mb-1 sm:mb-2"></div>
            <p className="text-xs sm:text-sm text-green-600 font-medium mb-1">Income</p>
            <p className="text-sm sm:text-base lg:text-lg font-semibold text-green-700 truncate w-full">
              ${income.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="text-center p-2 sm:p-3 lg:p-4 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors duration-200">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-400 rounded-full mb-1 sm:mb-2"></div>
            <p className="text-xs sm:text-sm text-red-600 font-medium mb-1">Expenses</p>
            <p className="text-sm sm:text-base lg:text-lg font-semibold text-red-700 truncate w-full">
              ${expenses.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Net Flow Indicator */}
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm text-gray-600">Net Flow</span>
          <span className={`text-xs sm:text-sm font-medium ${
            balance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {balance >= 0 ? 'Positive' : 'Negative'}
          </span>
        </div>
        {/* Progress bar showing income/expense ratio */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-2">
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ 
              width: `${income + expenses > 0 ? (income / (income + expenses)) * 100 : 50}%` 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}