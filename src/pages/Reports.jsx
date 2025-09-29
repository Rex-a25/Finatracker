import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import SpendingChart from "../components/SpendingChart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Report() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (!error && data) setTransactions(data);
    };
    fetchTransactions();
  }, [user]);

  // Compute summary
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  // Prepare line chart data
  const trendData = transactions.map((t) => ({
    date: new Date(t.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    amount: t.type === "expense" ? -t.amount : t.amount,
  }));

  // Highlights
  const topCategory = transactions.reduce((acc, t) => {
    if (t.type === "expense") {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
    }
    return acc;
  }, {});

  const biggestCategory =
    Object.keys(topCategory).length > 0
      ? Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0]
      : null;

  const biggestTransaction =
    transactions.length > 0
      ? [...transactions].sort((a, b) => b.amount - a.amount)[0]
      : null;

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
            <p className="text-2xl font-bold">${income.toFixed(2)}</p>
          </div>
          <div className="bg-red-100 p-4 rounded-xl text-center">
            <h3 className="text-lg font-semibold text-red-800">Total Expenses</h3>
            <p className="text-2xl font-bold">${expenses.toFixed(2)}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded-xl text-center">
            <h3 className="text-lg font-semibold text-blue-800">Balance</h3>
            <p className="text-2xl font-bold">${balance.toFixed(2)}</p>
          </div>
        </section>

        {/* Charts Section */}
        <main className="grid gap-6 grid-cols-1 md:grid-cols-2 w-full">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Spending Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Spending by Category
            </h2>
            {user ? (
              <SpendingChart user={user} />
            ) : (
              <p className="text-gray-500">Loading user...</p>
            )}
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
                  {biggestCategory[0]} (${biggestCategory[1].toFixed(2)})
                </h3>
              </div>
            ) : (
              <p className="text-gray-400">No category data yet</p>
            )}

            {biggestTransaction ? (
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-gray-600 text-sm">Biggest Transaction</p>
                <h3 className="text-lg font-semibold text-gray-800">
                  {biggestTransaction.description} (${biggestTransaction.amount})
                </h3>
              </div>
            ) : (
              <p className="text-gray-400">No transaction data yet</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
