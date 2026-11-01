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
        "relative rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.45)]",
        className
      )}
    >
      {/* Exact Neural Talent Prism Insignia */}
      <img
        src="/hireforce-logo-prism.png"
        alt="HireForce AI Neural Talent Prism"
        className="w-full h-full object-contain rounded-xl drop-shadow-[0_2px_10px_rgba(16,185,129,0.3)]"
      />

      {/* Live Active Pulse Beacon (Top Right) */}
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-[#0A0A0A] animate-pulse" />
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
                "font-extrabold tracking-tight font-sans transition-colors",
                textSizes[size],
                theme === "dark"
                  ? "text-white group-hover:text-emerald-300"
                  : "text-[#0A0A0A] group-hover:text-[#046307]"
              )}
            >
              HireForce
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
