import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

  
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!session) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
