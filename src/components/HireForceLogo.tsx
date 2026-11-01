import React from "react";
import { Link } from "react-router-dom";

export interface HireForceLogoProps {
  className?: string;
  theme?: "light" | "dark";
  to?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function HireForceMark({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses[size] || "w-10 h-10"} shrink-0 transition-all duration-300 ease-out group-hover:scale-105 group-hover:rotate-[4deg] ${className}`}
    >
      <defs>
        <linearGradient id="hfEmeraldLeft" x1="4" y1="6" x2="28" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34D399" />
          <stop offset="0.5" stopColor="#10B981" />
          <stop offset="1" stopColor="#046307" />
        </linearGradient>
        <linearGradient id="hfOverlapCenter" x1="14" y1="10" x2="30" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#065F46" />
          <stop offset="1" stopColor="#022C22" />
        </linearGradient>
      </defs>

      {/* Right Interlocking Diamond (Obsidian Black) */}
      <rect
        x="25"
        y="5"
        width="22"
        height="22"
        rx="6"
        transform="rotate(45 25 5)"
        fill="#0A0A0A"
      />

      {/* Left Interlocking Diamond (Luxury Emerald) */}
      <rect
        x="19"
        y="5"
        width="22"
        height="22"
        rx="6"
        transform="rotate(45 19 5)"
        fill="url(#hfEmeraldLeft)"
      />

      {/* Deep Forest Overlap Lens in Center */}
      <path
        d="M22 8.5L32.2 18.7C34.0 20.5 34.0 23.5 32.2 25.3L22 35.5L11.8 25.3C10.0 23.5 10.0 20.5 11.8 18.7L22 8.5Z"
        fill="url(#hfOverlapCenter)"
      />

      {/* Crisp Negative-Space 4-Point AI Spark */}
      <path
        d="M22 12.5C22 18.2 18.2 22 12.5 22C18.2 22 22 25.8 22 31.5C22 25.8 25.8 22 31.5 22C25.8 22 22 18.2 22 12.5Z"
        fill="#FAFAFA"
      />
    </svg>
  );
}

export function HireForceLogo({
  className = "",
  theme = "light",
  to = "/",
  showText = true,
  size = "md",
}: HireForceLogoProps) {
  const content = (
    <div className={`inline-flex items-center gap-3 select-none group cursor-pointer ${className}`}>
      <HireForceMark size={size} />

      {showText && (
        <span
          className={`text-[22px] font-extrabold tracking-[-0.03em] font-sans transition-colors ${
            theme === "dark"
              ? "text-[#FAFAFA] group-hover:text-emerald-300"
              : "text-[#0A0A0A] group-hover:text-[#046307]"
          }`}
        >
          Hire Force
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center focus:outline-hidden">
        {content}
      </Link>
    );
  }

  return content;
}

export default HireForceLogo;

