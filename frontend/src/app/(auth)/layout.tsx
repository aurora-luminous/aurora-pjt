"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useResponsive } from "../lib/useResponsive";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <div className={`min-h-screen ${isMobile ? "flex flex-col" : "flex"}`}>
      {/* 로고 컨테이너 */}
      <div
        className={`
        ${
          isMobile
            ? "w-full bg-aurora-dark flex items-center justify-center py-8 px-4"
            : "flex-1 bg-aurora-dark flex flex-col items-center justify-center p-8"
        }
      `}
      >
        <div className="text-center">
          <div className={isMobile ? "mb-4" : "mb-6"}>
            <Image
              src="/background/logo.png"
              alt="Aurora Logo"
              className={`w-auto mx-auto ${isMobile ? "h-16" : "h-24"}`}
              width={100}
              height={100}
            />
            <h1
              className={`
              font-bold text-white tracking-wide
              ${isMobile ? "text-2xl" : isTablet ? "text-3xl" : "text-4xl"}
            `}
            >
              Aurora
            </h1>
          </div>
        </div>
      </div>

      {/* 폼 컨테이너 */}
      <div
        className={`
        ${
          isMobile
            ? "flex-1 relative overflow-hidden"
            : "flex-3 relative overflow-hidden"
        }
      `}
      >
        <div
          className={`
          bg-aurora-blue-gradient-diagonal relative z-10 flex items-center justify-center min-h-full
          ${isMobile ? "p-4" : isTablet ? "p-6" : "p-8"}
        `}
        >
          <div
            className={`
            w-full
            ${isMobile ? "max-w-sm" : isTablet ? "max-w-md" : "max-w-md"}
          `}
          >
            <div
              className={`
              bg-aurora-form/62 rounded-xl shadow-2xl border border-white/10
              ${isMobile ? "p-6" : isTablet ? "p-7" : "p-8"}
            `}
            >
              <AnimatePresence mode="wait">{children}</AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
