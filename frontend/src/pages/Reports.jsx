import { useEffect, useState, useMemo } from "react";
// Assuming you are using react-hot-toast or similar for notifications
import { toast } from "react-toastify"; 
import { supabase } from "../supabaseClient";
import SpendingChart from "../components/SpendingChart";
import {
  AreaChart, 
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area, 
} from "recharts";


// Custom Tooltip component for the Running Balance Chart
const BalanceTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // payload[0] contains the data for the Area component
    const balance = payload[0].value;
    // Color-code based on positive (green) or negative (red) balance
    const color = balance >= 0 ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className="bg-white p-3 border rounded-lg shadow-md">
        <p className="text-sm font-bold text-gray-800">{label}</p>
        <p className={`text-lg font-bold ${color}`}>
          ₦{balance.toFixed(2)}
        </p>
        <p className="text-gray-500 text-xs">Running Balance</p>
      </div>
    );
  }
  return null;
};


export default function Report() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // MOVED: State must be defined inside the component function
  const [isExporting, setIsExporting] = useState(false); 


  // --- Export Data Handler (Now accesses 'transactions' state) ---
  const handleExportData = async () => {
    // Check if there's data to export
    if (transactions.length === 0) {
        toast.error("No transactions to export!");
        return;
    }

    setIsExporting(true);
    // ⚠️ Ensure this is the correct URL for your backend's export endpoint
    const endpoint = "http://localhost:5000/api/reports/export"; 

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add Authorization if needed (e.g., 'Bearer ' + user.token)
            },
            body: JSON.stringify({ 
                // CORRECTED: Pass the component's 'transactions' state
                transactions: transactions 
            }),
        });

        if (!response.ok) {
            // Robust error handling for server issues
            const errorText = await response.text();
            let errorMessage = 'Server failed to generate report.';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        // --- Handle the file download ---
        const blob = await response.blob(); 
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        // Use the filename suggested by the backend's header, or fall back
        a.download = response.headers.get('Content-Disposition') 
            ? response.headers.get('Content-Disposition').split('filename=')[1].replace(/"/g, '')
            : 'Finatracker_Report.pdf'; 
            
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url); 

        toast.success("Report successfully exported!");

    } catch (error) {
        console.error("Export Error:", error);
        toast.error(`Failed to export data: ${error.message}`);
    } finally {
        setIsExporting(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
      
      if (!data.user) {
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: true });

        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error("Error fetching report transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, [user]);

  // --- Core Financial Calculations ---
  const { 
    income, 
    expenses, 
    balance, 
    trendData, 
    biggestCategory, 
    biggestTransaction 
  } = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let currentBalance = 0;
    
    const trendData = [];
    const categoryTotals = {};
    
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedTransactions.forEach((t) => {
      const amount = parseFloat(t.amount) || 0;
      const category = t.category || "Uncategorized";

      if (amount > 0) {
        totalIncome += amount;
      } else if (amount < 0) {
        const expenseAmount = Math.abs(amount);
        totalExpenses += expenseAmount;
        categoryTotals[category] = (categoryTotals[category] || 0) + expenseAmount;
      }

      currentBalance += amount;
      trendData.push({
        date: new Date(t.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        balance: currentBalance,
        amount: amount, 
      });
    });

    const topCategoryEntry =
      Object.keys(categoryTotals).length > 0
        ? Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]
        : null;

    return {
      income: totalIncome,
      expenses: totalExpenses,
      balance: currentBalance,
      trendData,
      biggestCategory: topCategoryEntry,
      biggestTransaction: transactions.length > 0
        ? [...transactions].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0]
        : null,
    };
  }, [transactions]);
  // --- End Core Financial Calculations ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center pt-16">
        <p className="text-xl font-semibold text-blue-600">Loading Financial Report...</p>
      </div>
    );
  }

  // Empty State
  if (transactions.length === 0) {
    return (
      <div className="min-h-screen gap-20 flex-col bg-gray-100 flex items-center justify-center pt-16">
        <p className="text-xl font-semibold text-gray-500">No transactions available to generate report.</p>
        <button
            onClick={handleExportData}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors w-full sm:w-auto mt-4"
            disabled={true} >
            ⬇️ Export Data
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-8 mt-20">
      <div className="w-full max-w-6xl flex flex-col items-center gap-8">
        
        {/* Header */}
        <header className="bg-white shadow-md rounded-xl p-6 w-full text-center">
          <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Get insights into your spending and financial habits.
          </p>
        </header>

        {/* Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          <div className="bg-green-100 p-4 rounded-xl text-center">
            <h3 className="text-lg font-semibold text-green-800">Total Income</h3>
            <p className="text-2xl font-bold">₦{income.toFixed(2)}</p>
          </div>
          <div className="bg-red-100 p-4 rounded-xl text-center">
            <h3 className="text-lg font-semibold text-red-800">Total Expenses</h3>
            <p className="text-2xl font-bold">₦{expenses.toFixed(2)}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded-xl text-center">
            <h3 className="text-lg font-semibold text-blue-800">Net Balance</h3>
            <p className="text-2xl font-bold">₦{balance.toFixed(2)}</p>
          </div>
        </section>

        {/* Charts Section */}
        <main className="grid gap-6 grid-cols-1 md:grid-cols-2 w-full">
          
          {/* Running Balance Trend Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Running Balance Trend
            </h2>
            {trendData.length > 0 ? ( 
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                {/* 1. Gradient Definition for Area Fill */}
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['auto', 'auto']} /> 
                
                {/* 2. Custom Tooltip */}
                <Tooltip content={<BalanceTooltip />} />
                
                {/* 3. Highlight the Zero Line (Critical Benchmark) */}
                <ReferenceLine 
                  y={0} 
                  stroke="#EF4444" 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: 'Zero Balance', 
                    position: 'insideBottomRight', 
                    fill: '#EF4444', 
                    fontSize: 10 
                  }} 
                />
                
                {/* 4. Use Area component for the gradient trend */}
                <Area
                  type="monotone"
                  dataKey="balance" 
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#balanceGradient)" // Apply the gradient
                />
              </AreaChart>
            </ResponsiveContainer>
            ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">No transaction data to show trend.</div>
            )}
          </div>

          {/* Spending by Category Chart (Uses the improved SpendingChart.jsx) */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Spending by Category
            </h2>
            <SpendingChart transactions={transactions} />
          </div>
        </main>

        {/* Highlights Section */}
        <section className="bg-white p-6 rounded-xl shadow-md w-full">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Quick Insights
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {biggestCategory ? (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-gray-600 text-sm">Top Spending Category</p>
                <h3 className="text-lg font-semibold text-gray-800">
                  {biggestCategory[0]} (₦{biggestCategory[1].toFixed(2)})
                </h3>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 rounded-lg text-gray-400">No expense category data yet</div>
            )}

            {biggestTransaction ? (
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-gray-600 text-sm">Biggest Transaction (Magnitude)</p>
                <h3 className="text-lg font-semibold text-gray-800">
                  {biggestTransaction.description} (₦{Math.abs(biggestTransaction.amount).toFixed(2)})
                </h3>
              </div>
            ) : (
              <div className="p-4 bg-purple-50 rounded-lg text-gray-400">No transaction data yet</div>
            )}
          </div>
          <div>
            <button
                onClick={handleExportData}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors w-full sm:w-auto mt-6"
                disabled={isLoading || isExporting} >
                ⬇️ Export Data
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}