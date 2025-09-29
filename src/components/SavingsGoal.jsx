import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function SavingsGoal() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSaved, setTotalSaved] = useState(0);

  useEffect(() => {
    fetchSavingsData();
  }, []);

  const fetchSavingsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch savings goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('target_date', { ascending: true });

      if (goalsError) throw goalsError;

      // Fetch savings transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount, description, date')
        .eq('user_id', user.id)
        .eq('type', 'income')
        .ilike('description', '%saving%')
        .or('category.ilike.%saving%,category.ilike.%investment%');

      if (transactionsError) throw transactionsError;

      // Calculate total saved
      const totalSavedAmount = transactions?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;
      setTotalSaved(totalSavedAmount);

      // Calculate progress for each goal
      const goalsWithProgress = goalsData?.map(goal => {
        const progress = Math.min((totalSavedAmount / goal.target_amount) * 100, 100);
        const daysLeft = Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24));
        const isCompleted = progress >= 100;
        const isOverdue = daysLeft < 0 && !isCompleted;

        return {
          ...goal,
          progress,
          daysLeft: Math.max(daysLeft, 0),
          isCompleted,
          isOverdue,
          currentAmount: Math.min(totalSavedAmount, goal.target_amount)
        };
      }) || [];

      setGoals(goalsWithProgress);
      setLoading(false);

    } catch (error) {
      console.error('Error fetching savings data:', error);
      setLoading(false);
    }
  };

  const getProgressColor = (progress, isOverdue) => {
    if (isOverdue) return 'text-red-500';
    if (progress >= 100) return 'text-green-500';
    if (progress >= 75) return 'text-blue-500';
    if (progress >= 50) return 'text-yellow-500';
    return 'text-gray-400';
  };

  const getDaysText = (daysLeft, isOverdue) => {
    if (isOverdue) return 'Overdue!';
    if (daysLeft === 0) return 'Due today!';
    if (daysLeft === 1) return '1 day left';
    return `${daysLeft} days left`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-6 sm:h-7 bg-gray-300 rounded w-1/3 mb-4 sm:mb-6"></div>
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          Savings Goals
        </h2>
        <span className="text-sm text-gray-500">
          Saved: ${totalSaved.toFixed(2)}
        </span>
      </div>

      {/* Goals List */}
      <div className="space-y-4 sm:space-y-6">
        {goals.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <div className="text-gray-400 text-4xl mb-3">🎯</div>
            <p className="text-gray-500 text-sm sm:text-base mb-2">No savings goals yet</p>
            <p className="text-gray-400 text-xs sm:text-sm">
              Set your first savings goal to start tracking
            </p>
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors duration-200">
              
              {/* Progress Circle */}
              <div className="relative flex-shrink-0">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e5e7eb" strokeWidth="2"/>
                  
                  {/* Progress circle */}
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="15.9155" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    strokeLinecap="round"
                    className={getProgressColor(goal.progress, goal.isOverdue)}
                    strokeDasharray="100"
                    strokeDashoffset={100 - goal.progress}
                  />
                  
                  {/* Center text */}
                  <text x="18" y="18" textAnchor="middle" dy=".3em" className="text-xs font-semibold fill-current">
                    {Math.round(goal.progress)}%
                  </text>
                </svg>
                
                {/* Completion checkmark */}
                {goal.isCompleted && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-green-500 text-lg">✓</span>
                  </div>
                )}
              </div>

              {/* Goal Details */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-sm sm:text-base font-medium text-gray-800 truncate">
                    {goal.name}
                  </h3>
                  <span className={`text-xs font-semibold ${
                    goal.isCompleted ? 'text-green-600' : 
                    goal.isOverdue ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    ${goal.currentAmount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
                  </span>
                </div>
                
                <p className="text-xs text-gray-600 mb-2 truncate">
                  {goal.description}
                </p>
                
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-medium ${
                    goal.isOverdue ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {getDaysText(goal.daysLeft, goal.isOverdue)}
                  </span>
                  
                  {/* Due date */}
                  <span className="text-xs text-gray-400">
                    {new Date(goal.target_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: goal.target_date.split('-')[0] !== new Date().getFullYear().toString() ? 'numeric' : undefined
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Progress Summary */}
      {goals.length > 0 && (
        <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-sm font-semibold text-green-600">
                {goals.filter(g => g.isCompleted).length}/{goals.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">On Track</p>
              <p className="text-sm font-semibold text-blue-600">
                {goals.filter(g => !g.isCompleted && !g.isOverdue).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action */}
      <div className="mt-4 sm:mt-6">
        <button 
          onClick={() => window.location.href = '/savings'}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
        >
          + Add Savings Goal
        </button>
      </div>
    </div>
  );
}