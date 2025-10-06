"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const MouseAnimation = () => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const lookAtMouse = (factor = 0.05) => ({
    x: (mouse.x - window.innerWidth / 2) * factor,
    y: (mouse.y - window.innerHeight / 2) * factor,
    rotate: (mouse.x - window.innerWidth / 2) * 0.02,
  });

  return (
    <div className=" h-full w-full flex flex-col items-center justify-center gap-24 pointer-events-none z-50">

      {/* --- CIRCLE FACE --- */}
      <div className="relative w-36 h-36 rounded-full bg-blue-400/30 flex items-center justify-center shadow-lg">
        {/* Eyes */}
        <motion.div
          className="absolute w-3 h-3 bg-black rounded-full left-1/3 top-1/3"
          animate={lookAtMouse(0.04)}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />
        <motion.div
          className="absolute w-3 h-3 bg-black rounded-full right-1/3 top-1/3"
          animate={lookAtMouse(0.04)}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />
        {/* Mouth */}
        <motion.div
          className="absolute w-10 h-3 bg-black rounded-b-full bottom-6"
          animate={lookAtMouse(0.02)}
          transition={{ type: "spring", stiffness: 40, damping: 15 }}
        />
      </div>

      {/* --- SQUARE FACE --- */}
      <div className="relative w-28 h-28 bg-pink-400/30 rotate-6 shadow-md flex items-center justify-center">
        <motion.div
          className="absolute w-3 h-3 bg-black rounded-full left-1/3 top-1/4"
          animate={lookAtMouse(0.03)}
          transition={{ type: "spring", stiffness: 50, damping: 18 }}
        />
        <motion.div
          className="absolute w-3 h-3 bg-black rounded-full right-1/3 top-1/4"
          animate={lookAtMouse(0.03)}
          transition={{ type: "spring", stiffness: 50, damping: 18 }}
        />
        <motion.div
          className="absolute w-10 h-1 bg-black rounded-full bottom-6"
          animate={lookAtMouse(0.02)}
          transition={{ type: "spring", stiffness: 40, damping: 15 }}
        />
      </div>

      {/* --- TRIANGLE FACE --- */}
      <div className="relative w-0 h-10 border-l-[45px] border-r-[45px] border-b-[80px] border-l-transparent border-r-transparent border-b-yellow-300/50  flex justify-center">
        <motion.div
          className="absolute top-3 left-[-15px] w-2 h-2 bg-black rounded-full"
          animate={lookAtMouse(0.05)}
          transition={{ type: "spring", stiffness: 60, damping: 22 }}
        />
        <motion.div
          className="absolute top-3 right-[-15px] w-2 h-2 bg-black rounded-full"
          animate={lookAtMouse(0.05)}
          transition={{ type: "spring", stiffness: 60, damping: 22 }}
        />
        <motion.div
          className="absolute bottom-2 left-[-20px] w-10 h-1 bg-black rounded-full"
          animate={lookAtMouse(0.03)}
          transition={{ type: "spring", stiffness: 50, damping: 18 }}
        />
      </div>

    </div>
  );
};

export default MouseAnimation;
