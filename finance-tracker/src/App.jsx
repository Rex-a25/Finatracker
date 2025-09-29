import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "./supabaseClient";
import Navbar from "./components/nav";
import Landingpage from "./pages/Landingpage";
import SignIn from "./pages/signin";
import Signup from "./pages/signup";
import Explore from "./components/Explore";
import ForgotPassword from "./pages/forgotpassword";
import Dashboard from "./pages/dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import UpdatePassword from "./pages/UpdatePassword";
import Report from "./pages/Reports";
import AddBudget from "./components/AddBudjet";
import BudjetList from "./pages/BudjetList";
import AddSavingsGoal from "./components/AddSavingsGoal";
import ProfilePage from "./pages/ProfilePage";

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN") {
    console.log("User logged in:", session.user);
    navigate("/dashboard");
  }
  if (event === "SIGNED_OUT") {
    console.log("🚪 User logged out");
    navigate("/");
  }
});

return () => {
  data.subscription.unsubscribe();
};
  }, [navigate]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landingpage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/updatepassword" element={<UpdatePassword />} />
        <Route path="/budget/add" element={<AddBudget />} />
        <Route path="/savings" element={<AddSavingsGoal />} />
        <Route path="/profile" element={<ProfilePage/>} />

        {/* 👇 Protect dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
              
            </ProtectedRoute>
          }
        />
         <Route
            path="/report"
            element={
              <ProtectedRoute>
              {(user) => <Report user={user} />}
              </ProtectedRoute>
            }
      />
          <Route
            path="/budget"
            element={
        <ProtectedRoute>
          <BudjetList />
        </ProtectedRoute>
      }
    />
      </Routes>
    
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
