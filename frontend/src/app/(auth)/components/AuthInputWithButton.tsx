"use client";

import React from "react";
import { useResponsive } from "../../lib/useResponsive";

interface AuthInputWithButtonProps {
  label: string;
  type: "text" | "email" | "password";
  id: string;
  name: string;
  value: string;
  placeholder: string;
  error?: string;
  onChange: (value: string) => void;
  required?: boolean;
  buttonText: string;
  onButtonClick: () => void;
  buttonDisabled?: boolean;
  buttonLoading?: boolean;
}

export const AuthInputWithButton: React.FC<AuthInputWithButtonProps> = ({
  label,
  type,
  id,
  name,
  value,
  placeholder,
  error,
  onChange,
  required = false,
  buttonText,
  onButtonClick,
  buttonDisabled = false,
  buttonLoading = false,
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
      <div className={`${isMobile ? "flex flex-col gap-3" : "flex gap-2"}`}>
        <input
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            bg-white/10 border rounded-lg text-white placeholder-white/50 
            focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent 
            backdrop-blur-sm transition-colors
            ${
              isMobile
                ? "w-full px-3 py-2.5 text-sm"
                : "flex-1 px-4 py-3 text-base"
            }
            ${error ? "border-red-400 focus:ring-red-400" : "border-white/20"}
          `}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onButtonClick}
          disabled={buttonDisabled || buttonLoading}
          className={`
            bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg 
            transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 
            disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap
            ${isMobile ? "w-full px-3 py-2.5 text-sm" : "px-4 py-3 text-sm"}
          `}
        >
          {buttonLoading ? (
            <div className="flex items-center justify-center">
              <div
                className={`
                border-2 border-white/30 border-t-white rounded-full animate-spin mr-2
                ${isMobile ? "w-4 h-4" : "w-4 h-4"}
              `}
              ></div>
              <span className={isMobile ? "text-sm" : "text-sm"}>처리중</span>
            </div>
          ) : (
            buttonText
          )}
        </button>
      </div>
      {error && (
        <p className={`mt-1 text-red-400 ${isMobile ? "text-xs" : "text-sm"}`}>
          {error}
        </p>
      )}
    </div>
  );
};
