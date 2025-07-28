"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const ServerSetupLayout = ({ children }: { children: React.ReactNode }) => {
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
              className="w-auto h-24 mx-auto"
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
          <Image
            src="/background/logo.png"
            alt="Aurora Logo"
            className="w-auto h-10 mx-auto"
            width={100}
            height={100}
          />
          <h1 className="text-xl font-bold text-white tracking-wide">Aurora</h1>
        </motion.div>

        {/* Content Container */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
          <motion.div
            initial={{ maxWidth: "28rem" }}
            animate={{ maxWidth: "32rem" }}
            transition={{ duration: 0.8, ease: "easeInOut", delay: 0.3 }}
            className="w-full"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-aurora-form/62 rounded-xl p-8 shadow-2xl border border-white/10"
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
