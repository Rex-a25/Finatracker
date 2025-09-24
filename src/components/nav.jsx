"use client";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import gsap from "gsap";

export default function Navbar() {
  const navRef = useRef(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const hideNav = ["/signin", "/signup", "/forgotpassword", "/updatepassword"];
  const location = useLocation();
  const navigate = useNavigate();
  const currentNav = location.pathname;

  useEffect(() => {
    const nav = navRef.current;

    // Animate navbar on mount
    gsap.fromTo(
      nav,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power4.out" }
    );

    const handleScroll = () => {
      if (isSignedIn) {
        if (window.scrollY > 50) {
          gsap.to(nav, { backgroundColor: "#1E3A8A", duration: 0.5 }); // blue
        } else {
          gsap.to(nav, { backgroundColor: "transparent", duration: 0.5 });
        }
      } else {
        // always blue if logged out
        gsap.to(nav, { backgroundColor: "#1E3A8A", duration: 0.5 });
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Initial auth state check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session);
      handleScroll(); // run once to set correct color
    });

    // Auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsSignedIn(!!session);
        handleScroll();
      }
    );

    return () => {
      window.removeEventListener("scroll", handleScroll);
      authListener.subscription.unsubscribe();
    };
  }, [isSignedIn]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setIsSignedIn(false);
      navigate("/");
    }
  };

  const navBaseStyles =
    "fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center transition-colors";
  const textColor = "text-white";
  const hoverColor = "hover:text-blue-200";

  return (
    <nav
      ref={navRef}
      className={
        hideNav.includes(currentNav) ? "hidden" : `${navBaseStyles} ${textColor}`
      }
    >
      <div className="font-bold text-xl">FinaTracker</div>
      <div className="flex items-center gap-6">
        <ul className="flex gap-6 font-medium">
          <li className={`cursor-pointer ${hoverColor}`}>
            <Link to="/">Home</Link>
          </li>

          {!isSignedIn ? (
            <>
              <li className={`cursor-pointer ${hoverColor}`}>
                <a href="#explore">Explore</a>
              </li>
              <li className={`cursor-pointer ${hoverColor}`}>
                <a href="#contact">Contact</a>
              </li>
            </>
          ) : (
            <>
              <li className={`cursor-pointer ${hoverColor}`}>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className={`cursor-pointer ${hoverColor}`}>
                <Link to="/profile">Profile</Link>
              </li>
              <li className={`cursor-pointer ${hoverColor}`}>
                <Link to="/budget">Budgets</Link>
              </li>
              <li className={`cursor-pointer ${hoverColor}`}>
                <Link to="/report">Reports</Link>
              </li>
            </>
          )}
        </ul>

        {!isSignedIn ? (
          <Link to="/signin">
            <button className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">
              Sign In
            </button>
          </Link>
        ) : (
          <button
            onClick={handleLogout}
            className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
          >
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
}
