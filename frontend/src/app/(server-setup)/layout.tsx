"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAuth } from "../(auth)/hooks/useAuth";
import { usePathname } from "next/navigation";
import { useResponsive } from "../lib/useResponsive";

const ServerSetupLayout = ({ children }: { children: React.ReactNode }) => {
  const { handleLogout } = useAuth();
  const pathname = usePathname();
  const { isMobile, isTablet } = useResponsive();

  // pending 페이지일 때는 전체 화면 레이아웃 사용
  const isPendingPage = pathname.includes("/pending");

  if (isPendingPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  // 모바일 레이아웃
  if (isMobile) {
    return (
      <div className="min-h-screen bg-aurora-blue-gradient-diagonal relative">
        {/* 모바일 상단 헤더 */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
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
          <button
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            로그아웃
          </button>
        </div>

        {/* 모바일 폼 컨테이너 */}
        <div className="min-h-screen flex items-center justify-center p-4 pt-20">
          <div className="w-full max-w-sm">
            <div className="bg-aurora-form/62 rounded-xl p-6 shadow-2xl border border-white/10">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 데스크탑/태블릿 애니메이션 레이아웃
  return (
    <div className="min-h-screen flex relative bg-aurora-blue-gradient-diagonal">
      {/* Left Panel - 사라지는 애니메이션 */}
      <motion.div
        initial={{ width: "50%", opacity: 1 }}
        animate={{ width: "0%", opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="bg-aurora-dark flex flex-col items-center justify-center p-8 overflow-hidden relative z-10"
      >
        {/* 로고가 여기서 시작해서 좌상단으로 이동 */}
        <motion.div
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: -200, y: -300, scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="text-center"
        >
          <div className="mb-6">
            <Image
              src="/background/logo.png"
              alt="Aurora Logo"
              className={`w-auto mx-auto ${isTablet ? "h-20" : "h-24"}`}
              width={100}
              height={100}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Right Panel - 확장되는 애니메이션 */}
      <motion.div
        initial={{ width: "50%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="relative overflow-hidden"
      >
        {/* Logo - 좌상단에 새로 나타남 */}
        <motion.div
          initial={{ opacity: 0, x: -50, y: -50 }}
          animate={{ opacity: 1, x: 32, y: 32 }}
          transition={{ duration: 0.8, ease: "easeInOut", delay: 0.4 }}
          className="absolute top-0 left-0 z-20"
        >
          <div className="flex items-center">
            <Image
              src="/background/logo.png"
              alt="Aurora Logo"
              className={`w-auto mr-2 ${isTablet ? "h-8" : "h-10"}`}
              width={100}
              height={100}
            />
            <h1
              className={`font-bold text-white tracking-wide ${
                isTablet ? "text-lg" : "text-xl"
              }`}
            >
              Aurora
            </h1>
          </div>
        </motion.div>

        {/* 로그아웃 버튼 */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          onClick={handleLogout}
          className="absolute top-8 right-8 z-20 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          로그아웃
        </motion.button>

        {/* Content Container */}
        <div
          className={`relative z-10 flex items-center justify-center min-h-screen ${
            isTablet ? "p-6" : "p-8"
          }`}
        >
          <motion.div
            initial={{ maxWidth: "28rem" }}
            animate={{ maxWidth: isTablet ? "30rem" : "32rem" }}
            transition={{ duration: 0.8, ease: "easeInOut", delay: 0.3 }}
            className="w-full"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className={`bg-aurora-form/62 rounded-xl shadow-2xl border border-white/10 ${
                isTablet ? "p-6" : "p-8"
              }`}
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ServerSetupLayout;
