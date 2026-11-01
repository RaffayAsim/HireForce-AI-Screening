import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "full" | "mark" | "stacked";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  theme?: "light" | "dark";
  showBadge?: boolean;
  badgeText?: string;
  subtitle?: string;
  to?: string;
  className?: string;
}

export const BrandMark: React.FC<{ size?: number; className?: string }> = ({
  size = 38,
  className,
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "relative flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:rotate-[4deg]",
        className
      )}
    >
      <svg
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="hfEmeraldLeftBrand" x1="4" y1="6" x2="28" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34D399" />
            <stop offset="0.5" stopColor="#10B981" />
            <stop offset="1" stopColor="#046307" />
          </linearGradient>
          <linearGradient id="hfOverlapCenterBrand" x1="14" y1="10" x2="30" y2="34" gradientUnits="userSpaceOnUse">
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
          fill="url(#hfEmeraldLeftBrand)"
        />

        {/* Deep Forest Overlap Lens in Center */}
        <path
          d="M22 8.5L32.2 18.7C34.0 20.5 34.0 23.5 32.2 25.3L22 35.5L11.8 25.3C10.0 23.5 10.0 20.5 11.8 18.7L22 8.5Z"
          fill="url(#hfOverlapCenterBrand)"
        />

        {/* Crisp Negative-Space 4-Point AI Spark */}
        <path
          d="M22 12.5C22 18.2 18.2 22 12.5 22C18.2 22 22 25.8 22 31.5C22 25.8 25.8 22 31.5 22C25.8 22 22 18.2 22 12.5Z"
          fill="#FAFAFA"
        />
      </svg>
    </div>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = "full",
  size = "md",
  theme = "light",
  showBadge = true,
  badgeText = "AI",
  subtitle,
  to = "/",
  className,
}) => {
  const pixelSizes = {
    xs: 24,
    sm: 30,
    md: 38,
    lg: 46,
    xl: 56,
  };

  const textSizes = {
    xs: "text-sm",
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const badgeSizes = {
    xs: "text-[8px] px-1 py-0",
    sm: "text-[9px] px-1.5 py-0.2",
    md: "text-[10px] px-1.5 py-0.5",
    lg: "text-xs px-2 py-0.5",
    xl: "text-sm px-2.5 py-1",
  };

  const markSize = pixelSizes[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group select-none", className)}>
      <BrandMark size={markSize} />

      {variant !== "mark" && (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "font-extrabold tracking-[-0.03em] font-sans transition-colors",
                textSizes[size],
                theme === "dark"
                  ? "text-[#FAFAFA] group-hover:text-emerald-300"
                  : "text-[#0A0A0A] group-hover:text-[#046307]"
              )}
            >
              Hire Force
            </span>

            {showBadge && (
              <span
                className={cn(
                  "font-mono font-bold uppercase tracking-wider rounded-full border transition-colors",
                  badgeSizes[size],
                  theme === "dark"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-emerald-500/10 text-[#046307] border-emerald-500/25"
                )}
              >
                {badgeText}
              </span>
            )}
          </div>

          {subtitle && (
            <span
              className={cn(
                "text-xs leading-none mt-0.5 tracking-tight",
                theme === "dark" ? "text-neutral-400" : "text-neutral-500"
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return content;
};

export default BrandLogo;
