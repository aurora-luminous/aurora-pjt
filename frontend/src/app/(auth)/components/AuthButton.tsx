"use client";

import React from "react";
import { useResponsive } from "../../lib/useResponsive";

interface AuthButtonProps {
  type?: "submit" | "button";
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  type = "button",
  variant = "primary",
  children,
  onClick,
  disabled = false,
  loading = false,
  className = "",
}) => {
  const { isMobile } = useResponsive();

  const baseClasses = `
    w-full font-semibold rounded-lg transition duration-200 
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent 
    disabled:opacity-50 disabled:cursor-not-allowed
    ${isMobile ? "py-2.5 px-3 text-sm" : "py-3 px-4 text-base"}
  `;

  const variantClasses = {
    primary:
      "bg-purple-500 hover:bg-purple-600 text-white focus:ring-purple-400",
    secondary:
      "bg-white/10 hover:bg-white/20 text-white/80 focus:ring-white/50",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div
            className={`
            border-2 border-white/30 border-t-white rounded-full animate-spin mr-2
            ${isMobile ? "w-4 h-4" : "w-5 h-5"}
          `}
          ></div>
          <span className={isMobile ? "text-sm" : "text-base"}>처리중...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};
