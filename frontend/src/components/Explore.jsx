// src/components/Explore.jsx
import { TrendingUp, PieChart, Wallet, Shield } from "lucide-react";

export default function Explore() {
  const features = [
    {
      icon: <Wallet className="w-8 h-8 text-indigo-600" />,
      title: "Expense Tracking",
      desc: "Easily log and categorize your daily expenses to stay on top of your spending.",
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-600" />,
      title: "Budget Goals",
      desc: "Set financial goals and track your progress with real-time insights.",
    },
    {
      icon: <PieChart className="w-8 h-8 text-yellow-600" />,
      title: "Spending Breakdown",
      desc: "Visualize your finances with interactive charts and graphs.",
    },
    {
      icon: <Shield className="w-8 h-8 text-red-600" />,
      title: "Secure Data",
      desc: "Your financial information is stored securely with top-grade encryption.",
    },
  ];

  return (
    <section className="py-16 bg-gray-50" id="explore">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-10">Explore Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-center mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
