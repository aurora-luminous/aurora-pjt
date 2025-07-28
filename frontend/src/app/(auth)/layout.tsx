"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import Image from "next/image";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 패널 로고 컨테이너*/}
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
            <h1 className="text-4xl font-bold text-white tracking-wide">
              Aurora
            </h1>
          </div>
        </div>
      </div>

      {/* 오른쪽 패널 form 컨테이너*/}
      <div className="flex-3 relative overflow-hidden">
        <div className="bg-aurora-blue-gradient-diagonal relative z-10 flex items-center justify-center min-h-full p-8">
          <div className="w-full max-w-md">
            <div className="bg-aurora-form/62 rounded-xl p-8 shadow-2xl border border-white/10">
              <AnimatePresence mode="wait">{children}</AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
