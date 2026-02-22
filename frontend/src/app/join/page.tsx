"use client";

import React from "react";
import { motion } from "framer-motion";
import { useJoin } from "./hooks/useJoin";

const JoinPage = () => {
  const {
    isPageLoading,
    isJoinError,
    isJoining,
    isJoinError2,
    isJoinButtonDisabled,
    joinInfo,
    serverOwner,
    memberCount,
    handleJoin,
    handleGoHome,
  } = useJoin();

  // 로딩 화면
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">초대 정보를 불러오는 중...</p>
        </motion.div>
      </div>
    );
  }

  // 초대 코드 오류
  if (isJoinError || !joinInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">✕</span>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">
            유효하지 않은 초대 링크
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            초대 링크가 만료되었거나 올바르지 않습니다.
          </p>
          <button
            onClick={handleGoHome}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-200"
          >
            홈으로 돌아가기
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* 왼쪽: Aurora 로고 영역 */}
      <div className="flex-1 hidden md:flex items-center justify-center relative">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/8 rounded-full blur-2xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center"
        >
          <h1 className="text-7xl font-bold text-white tracking-wide">
            Aurora
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mt-4 rounded" />
          <p className="text-slate-400 text-sm mt-4 tracking-wider uppercase">
            Team Collaboration Platform
          </p>
        </motion.div>
      </div>

      {/* 오른쪽: 서버 초대 카드 */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-sm"
        >
          {/* 모바일 로고 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="md:hidden text-center mb-6"
          >
            <h1 className="text-4xl font-bold text-white tracking-wide">
              Aurora
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mt-2 rounded" />
          </motion.div>

          {/* 스마트폰 형태 컨테이너 */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl p-1 shadow-2xl border border-slate-700/50">
            <div className="bg-slate-900 rounded-3xl p-6 min-h-[580px] flex flex-col">

              {/* 초대 헤더 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-5"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-500/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🚀</span>
                </div>
                <p className="text-slate-400 text-xs tracking-widest uppercase mb-1">
                  서버 초대
                </p>
                <h2 className="text-xl font-bold text-white">
                  {joinInfo.serverName}
                </h2>
              </motion.div>

              <div className="h-px bg-slate-700/60 mb-5" />

              {/* 서버 정보 카드 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/30 mb-4"
              >
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                  서버 정보
                </h3>

                  
                  <div className="space-y-3">
                    {/* 멤버 수 */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs">멤버 수</span>
                      <span className="text-white text-sm font-medium">
                        {memberCount}명
                      </span>
                    </div>

                    {/* 서버장 */}
                    {serverOwner && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-xs">서버장</span>
                        <span className="text-white text-sm font-medium">
                          {serverOwner}
                        </span>
                      </div>
                    )}                    
                    
                  </div>
                
              </motion.div>

              {/* 가입하기 영역 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex-1 flex flex-col justify-end"
              >
                <p className="text-slate-400 text-xs text-center mb-4 leading-relaxed">
                  가입 신청 후 서버 관리자의 승인이 완료되면
                  <br />
                  서버에 입장할 수 있습니다.
                </p>

                {/* 에러 메시지 */}
                {isJoinError2 && (
                  <div className="mb-3 p-2.5 bg-red-500/20 border border-red-500/30 rounded-xl">
                    <p className="text-red-300 text-xs text-center">
                      가입 신청 중 오류가 발생했습니다.
                    </p>
                  </div>
                )}

                {/* 가입하기 버튼 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleJoin}
                  disabled={isJoinButtonDisabled}
                  className={`w-full font-semibold py-3 px-4 rounded-xl transition-all duration-200 text-sm
                    ${
                      isJoining
                        ? "bg-gradient-to-r from-slate-600 to-slate-700 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-500/20"
                    }`}
                >
                  {isJoining ? "처리 중..." : "서버 가입하기"}
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinPage;
