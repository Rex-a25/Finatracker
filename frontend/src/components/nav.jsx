"use client";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import gsap from "gsap";
import { HiMenu, HiX } from "react-icons/hi";
import { Underline } from "lucide-react";

export default function Navbar() {
  const navRef = useRef(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const hideNav = ["/signin", "/signup", "/forgotpassword", "/updatepassword"];
  const location = useLocation();
  const navigate = useNavigate();
  const currentNav = location.pathname;

  useEffect(() => {
    const nav = navRef.current;

    gsap.fromTo(
      nav,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power4.out" }
    );

    const handleScroll = () => {
      if (isSignedIn) {
        gsap.to(nav, { backgroundColor: "#1E3A8A", duration: 0.5 });
      } else {
        gsap.to(nav, { backgroundColor: "#1E3A8A", duration: 0.5 });
      }
    };
   
    

    window.addEventListener("scroll", handleScroll);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session);
      handleScroll();
    });

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
      alert('Goodbye Gorgeous')
      navigate("/");
    }
  };

  const navBaseStyles =
    "fixed top-0 left-0 w-full z-50 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center transition-colors";
  const textColor = "text-white";
  const hoverColor = "hover:text-blue-200";
  
    

  return (
    <nav
      ref={navRef}
      className={
        hideNav.includes(currentNav)
          ? "hidden"
          : `${navBaseStyles} ${textColor}`
      }
    >
      {/* Logo */}
      <div className="font-bold text-lg sm:text-xl">FinaTracker</div>

      {/* Desktop links */}
      
      <div 
      // onLoad={underline}
      className="hidden md:flex items-center gap-6">
        <ul className="flex gap-4 sm:gap-6 font-medium">
          <li className={`cursor-pointer ${hoverColor} ${currentNav === '/' && isSignedIn ? 'border-b-2 font-bold ': '' }`}>
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
              <li className={`cursor-pointer ${hoverColor} ${currentNav === '/dashboard' ? 'border-b-2 font-bold ': '' }`}>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className={`cursor-pointer ${hoverColor} ${currentNav === '/profile' ? 'border-b-2 font-bold ': '' }`}>
                <Link to="/profile">Profile</Link>
              </li>
              <li className={`cursor-pointer ${hoverColor} ${currentNav === '/budget' ? 'border-b-2 font-bold ': '' }`}>
                <Link to="/budget">Budgets</Link>
              </li>
              <li className={`cursor-pointer ${hoverColor}${currentNav === '/report' ? 'border-b-2 font-bold ': '' }`}>
                <Link to="/report">Reports</Link>
              </li>
            </>
          )}
        </ul>

        {!isSignedIn ? (
          <Link to="/signin">
            <button className="bg-blue-700 hover:bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-sm sm:text-base">
              Sign In
            </button>
          </Link>
        ) : (
          <button
            onClick={handleLogout}
            className="bg-blue-700 hover:bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-sm sm:text-base"
          >
            Sign Out
          </button>
        )}
      </div>

      {/* Mobile Hamburger */}
      <div className="md:hidden">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-2xl sm:text-3xl focus:outline-none"
        >
          {menuOpen ? <HiX /> : <HiMenu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed top-16 left-0 w-full h-screen bg-blue-900 text-white flex flex-col gap-6 py-6 px-6 md:hidden transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link to="/" onClick={() => setMenuOpen(false)} className="text-lg font-medium">
          Home
        </Link>

        {!isSignedIn ? (
          <>
            <a href="#explore" onClick={() => setMenuOpen(false)} className="text-lg font-medium">
              Explore
            </a>
            <a href="#contact" onClick={() => setMenuOpen(false)} className="text-lg font-medium">
              Contact
            </a>
            <Link to="/signin" onClick={() => setMenuOpen(false)}>
              <button className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold w-full mt-2">
                Sign In
              </button>
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-lg font-medium">
              Dashboard
            </Link>
            <Link to="/profile" onClick={() => setMenuOpen(false)} className="text-lg font-medium">
              Profile
            </Link>
            <Link to="/budget" onClick={() => setMenuOpen(false)} className="text-lg font-medium">
              Budgets
            </Link>
            <Link to="/report" onClick={() => setMenuOpen(false)} className="text-lg font-medium">
              Reports
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold w-full mt-2"
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
