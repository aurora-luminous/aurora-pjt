"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useResponsive } from "../lib/useResponsive";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  if (isMobile) {
    // 모바일 레이아웃: 로고는 좌상단 고정, 폼은 중앙
    return (
      <div className="min-h-screen bg-aurora-blue-gradient-diagonal relative">
        {/* 모바일 상단 로고 */}
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center">
            <Image
              src="/background/logo.png"
              alt="Aurora Logo"
              className="w-auto h-8 mr-2"
              width={100}
              height={100}
            />
            <h1 className="text-lg font-bold text-white tracking-wide">
              Aurora
            </h1>
          </div>
        </div>

        {/* 모바일 폼 컨테이너 */}
        <div className="min-h-screen flex items-center justify-center p-4 pt-20">
          <div className="w-full max-w-sm">
            <div className="bg-aurora-form/62 rounded-xl p-6 shadow-2xl border border-white/10">
              <AnimatePresence mode="wait">{children}</AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 데스크탑/태블릿 레이아웃: 기존 가로 분할 레이아웃
  return (
    <div className="min-h-screen flex bg-aurora-dark">
      {/* 로고 컨테이너 */}
      <div className="flex-1 bg-aurora-dark flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-6">
            <Image
              src="/background/logo.png"
              alt="Aurora Logo"
              className="w-auto h-24 mx-auto"
              width={100}
              height={100}
            />
            <h1
              className={`
              font-bold text-white tracking-wide
              ${isTablet ? "text-3xl" : "text-4xl"}
            `}
            >
              Aurora
            </h1>
          </div>
        </div>
      </div>

      {/* 폼 컨테이너 */}
      <div className="flex-3 relative overflow-hidden">
        <div
          className={`
          bg-aurora-blue-gradient-diagonal relative z-10 flex items-center justify-center min-h-full
          ${isTablet ? "p-6" : "p-8"}
        `}
        >
          <div className="w-full max-w-md">
            <div
              className={`
              bg-aurora-form/62 rounded-xl shadow-2xl border border-white/10
              ${isTablet ? "p-7" : "p-8"}
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
