import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function BudgetOverview() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (budgetsError) throw budgetsError;

      // Fetch transactions to calculate spending
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount, category, date')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', new Date().toISOString().split('T')[0].slice(0, 7) + '-01') // Current month
        .lte('date', new Date().toISOString().split('T')[0]); // Until today

      if (transactionsError) throw transactionsError;

      // Calculate spending per category
      const categorySpending = {};
      transactions?.forEach(transaction => {
        const category = transaction.category || 'Uncategorized';
        categorySpending[category] = (categorySpending[category] || 0) + transaction.amount;
      });

      // Merge budgets with actual spending
      const budgetsWithSpending = budgetsData?.map(budget => {
        const spent = categorySpending[budget.category] || 0;
        const percentage = Math.min((spent / budget.amount) * 100, 100);
        const isOverBudget = spent > budget.amount;

        return {
          ...budget,
          spent,
          percentage,
          isOverBudget
        };
      }) || [];

      setBudgets(budgetsWithSpending);
      
      // Calculate total spent
      const total = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0);
      setTotalSpent(total);
      setLoading(false);

    } catch (error) {
      console.error('Error fetching budget data:', error);
      setLoading(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-6 sm:h-7 bg-gray-300 rounded w-1/3 mb-4 sm:mb-6"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-4 last:mb-0">
              <div className="flex justify-between mb-2">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/6"></div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          Budget Overview
        </h2>
        <span className="text-sm text-gray-500">
          Total: ${totalSpent.toFixed(2)}
        </span>
      </div>

      {/* Budgets List */}
      <div className="space-y-4 sm:space-y-6">
        {budgets.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <div className="text-gray-400 text-4xl mb-3">💰</div>
            <p className="text-gray-500 text-sm sm:text-base mb-2">No budgets set</p>
            <p className="text-gray-400 text-xs sm:text-sm">
              Create budgets to track your spending
            </p>
          </div>
        ) : (
          budgets.map((budget) => (
            <div key={budget.id} className="group">
              {/* Budget Header */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm sm:text-base font-medium text-gray-700">
                  {budget.category}
                </span>
                <span className={`text-xs font-semibold ${
                  budget.isOverBudget ? 'text-red-600' : 'text-gray-500'
                }`}>
                  ${budget.spent.toFixed(2)} / ${budget.amount.toFixed(2)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(budget.percentage)} ${
                    budget.isOverBudget ? 'animate-pulse' : ''
                  }`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                ></div>
              </div>

              {/* Progress Info */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {budget.percentage.toFixed(1)}% used
                </span>
                {budget.isOverBudget && (
                  <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded-full">
                    Over Budget!
                  </span>
                )}
              </div>

              {/* Alert for overspending */}
              {budget.isOverBudget && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700">
                    You've exceeded your {budget.category} budget by ${(budget.spent - budget.amount).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button 
          onClick={() => window.location.href = '/budget'}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
        >
          + Manage Budgets
        </button>
      </div>
    </div>
  );
}