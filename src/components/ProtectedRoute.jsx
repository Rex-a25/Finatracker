import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/signin" />;

  // Support function-as-children
  return typeof children === "function" ? children(user) : children;
}
