
import React from "react";

const Footer = () => {
  return (
    <footer className="bg-blue-950 text-gray-300 py-10">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        
        <div>
          <h2 className="text-white text-xl font-bold">Finance Tracker</h2>
          <p className="mt-3 text-sm text-gray-400">
            Simplify your finances. Track, save, and grow smarter every day.
          </p>
        </div>

        
        <div>
          <h3 className="text-white text-lg font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#features" className="hover:text-white">Features</a></li>
            <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
            <li><a href="#about" className="hover:text-white">About Us</a></li>
            <li><a href="#contact" className="hover:text-white">Contact</a></li>
          </ul>
        </div>

        
        <div>
          <h3 className="text-white text-lg font-semibold mb-3">Follow Us</h3>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-white">🐦 Twitter</a>
            <a href="#" className="hover:text-white">📘 Facebook</a>
            <a href="#" className="hover:text-white">📸 Instagram</a>
          </div>
        </div>
      </div>

      
      <div className="mt-10 border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Finance Tracker. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
