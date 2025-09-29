import React from "react";
import BalanceSummary from "../components/BalanceSummary";
import TransactionList from "../components/TransactionList";
import BudgetOverview from "../components/BudgetOverview";
import SavingsGoal from "../components/SavingsGoal";
import CsvUpload from "../components/Csvuploads";
// import SpendingChart from "../components/SpendingChart";

export default function Dashboard() {
  const handleUploadComplete = () => {
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-8 mt-20">
    
      <div className="w-full max-w-6xl flex flex-col items-center gap-8">
      
        <header className="bg-white shadow-md rounded-xl p-6 w-full text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome Back 
          </h1>
          <p className="text-gray-600 mt-2">
            Here's a quick look at your financial tracker summary.
          </p>
        </header>

   
        <main className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
       
          <div className="md:col-span-1">
            <BalanceSummary />
          </div>
          
          <div className="md:col-span-1">
            <BudgetOverview />
          </div>
          
          <div className="md:col-span-2 lg:col-span-1">
            <CsvUpload onUploadComplete={handleUploadComplete} />
          </div>

         
          <div className="md:col-span-2 lg:col-span-3">
            <TransactionList />
          </div>

    
          <div className="md:col-span-2 lg:col-span-3">
            <SavingsGoal />
          </div>
        </main>
      </div>
    </div>
  );
}