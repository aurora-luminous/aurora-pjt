"use client";

import React from "react";
import { useResponsive } from "../../lib/useResponsive";

interface AuthInputProps {
  label: string;
  type: "text" | "email" | "password";
  id: string;
  name: string;
  value: string;
  placeholder: string;
  error?: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  type,
  id,
  name,
  value,
  placeholder,
  error,
  onChange,
  onKeyDown,
  required = false,
}) => {
  const { isMobile } = useResponsive();

  return (
    <div>
      <label
        htmlFor={id}
        className={`
        block font-medium text-white/90 mb-2
        ${isMobile ? "text-sm" : "text-sm"}
      `}
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={`
          w-full bg-white/10 border rounded-lg text-white placeholder-white/50 
          focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent 
          backdrop-blur-sm transition-colors
          ${isMobile ? "px-3 py-2.5 text-sm" : "px-4 py-3 text-base"}
          ${error ? "border-red-400 focus:ring-red-400" : "border-white/20"}
        `}
        placeholder={placeholder}
      />
      {error && (
        <p className={`mt-1 text-red-400 ${isMobile ? "text-xs" : "text-sm"}`}>
          {error}
        </p>
      )}
    </div>
  );
};
