"use client";

import React from "react";
import { motion } from "framer-motion";
import { usePending } from "../hooks/usePending";
import { useResponsive } from "../../lib/useResponsive";

const PendingApprovalPage = () => {
  const { isMobile, isTablet } = useResponsive();
  const {
    statusConfig,
    handleGoToRecentServer,
    handleManualRefresh,
    approvalStatus,
    serverName,
    serverUrl,
    isLoading,
    error,
    handleServerConnection,
  } = usePending();

  // 모바일 레이아웃
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        {/* 모바일 상단 로고 */}
        <div className="flex-shrink-0 p-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl font-bold text-white tracking-wide mb-2">
              Aurora
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded"></div>
          </motion.div>
        </div>

        {/* 모바일 컨텐츠 */}
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-sm"
          >
            {/* 스마트폰 형태 컨테이너 */}
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl p-1 shadow-2xl border border-slate-700/50">
              <div className="bg-slate-900 rounded-3xl p-4 min-h-[500px] flex flex-col">
                {/* 상단 카드: 서버 가입 승인 대기 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-slate-800/60 rounded-2xl p-4 mb-4 border border-slate-700/30"
                >
                  <h2 className="text-lg font-semibold text-white text-center mb-3">
                    서버 가입 승인 대기
                  </h2>

                  <div className="h-px bg-slate-700 mb-3"></div>

                  <div className="text-center mb-3 space-y-1">
                    <p className="text-slate-300 text-sm">
                      서버 관리자 승인을 대기중입니다.
                    </p>
                    <p className="text-slate-300 text-sm">
                      수락 시 입장이 가능합니다.
                    </p>
                  </div>

                  {/* 서버 정보 */}
                  {serverName && (
                    <div className="text-center mb-3">
                      <p className="text-slate-400 text-xs mb-1">서버:</p>
                      <p className="text-white font-medium text-sm">
                        {serverName}
                      </p>
                    </div>
                  )}

                  {/* 상태 표시 */}
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-2">
                    <div className="flex items-center justify-center space-x-2">
                      <div
                        className={`w-2 h-2 bg-blue-400 rounded-full ${
                          approvalStatus === "pending" ? "animate-pulse" : ""
                        }`}
                      ></div>
                      <span className="text-white text-sm font-medium">
                        {statusConfig.statusText}
                      </span>
                    </div>
                  </div>

                  {/* 로딩/에러 */}
                  {isLoading && (
                    <div className="mt-2 text-center">
                      <p className="text-slate-400 text-xs">상태 확인 중...</p>
                    </div>
                  )}

                  {error && (
                    <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <p className="text-red-300 text-xs text-center">
                        상태 확인 실패
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* 하단 카드: 서버 가입 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/30 flex-1 flex flex-col"
                >
                  <h3 className="text-base font-semibold text-white mb-3">
                    서버 가입
                  </h3>

                  <div className="flex-1 mb-4">
                    <p className="text-slate-300 text-sm leading-relaxed">
                      대기중일 때 기존 서버로 이동하고 싶으시다면 아래 버튼을
                      클릭해주세요.
                    </p>
                  </div>

                  {/* 버튼들 */}
                  <div className="space-y-2">
                    {approvalStatus === "active" && (
                      <button
                        onClick={() =>
                          handleServerConnection(serverUrl, serverName)
                        }
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-2.5 px-3 rounded-xl transition-all duration-200 text-sm"
                      >
                        서버 입장하기
                      </button>
                    )}

                    {(approvalStatus === "pending" ||
                      approvalStatus === "checking") && (
                      <button
                        onClick={handleManualRefresh}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-slate-500 disabled:to-slate-600 text-white font-medium py-2.5 px-3 rounded-xl transition-all duration-200 disabled:cursor-not-allowed text-sm"
                      >
                        {isLoading ? "확인 중..." : "승인 상태 확인"}
                      </button>
                    )}

                    <button
                      onClick={handleGoToRecentServer}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 px-3 rounded-xl transition-all duration-200 text-sm"
                    >
                      최근 서버 둘아가기
                    </button>
                  </div>
                </motion.div>

                {/* 하단 상태 텍스트 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-center mt-3"
                >
                  <p className="text-slate-500 text-xs">
                    {approvalStatus === "pending" &&
                      "현재 승인 상태를 확인 중입니다."}
                    {approvalStatus === "active" &&
                      "승인이 완료되어 자동으로 입장합니다."}
                    {approvalStatus === "inactive" && "가입이 거절되었습니다."}
                    {approvalStatus === "checking" &&
                      "5초마다 자동으로 상태를 확인합니다."}
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 데스크탑/태블릿 레이아웃 (기존 양분 레이아웃)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* 왼쪽: Aurora 로고 */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* 배경 효과 */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center"
        >
          <h1
            className={`font-bold text-white tracking-wide ${
              isTablet ? "text-5xl" : "text-7xl"
            }`}
          >
            Aurora
          </h1>
          <div
            className={`bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mt-4 rounded ${
              isTablet ? "w-20 h-1" : "w-24 h-1"
            }`}
          ></div>
        </motion.div>
      </div>

      {/* 오른쪽: 컨텐츠 */}
      <div
        className={`flex-1 flex items-center justify-center ${
          isTablet ? "p-6" : "p-8"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-sm"
        >
          {/* 스마트폰 형태 컨테이너 */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl p-1 shadow-2xl border border-slate-700/50">
            <div
              className={`bg-slate-900 rounded-3xl flex flex-col ${
                isTablet ? "p-5 min-h-[550px]" : "p-6 min-h-[600px]"
              }`}
            >
              {/* 상단 카드: 서버 가입 승인 대기 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`bg-slate-800/60 rounded-2xl border border-slate-700/30 ${
                  isTablet ? "p-5 mb-5" : "p-6 mb-6"
                }`}
              >
                <h2
                  className={`font-semibold text-white text-center mb-4 ${
                    isTablet ? "text-lg" : "text-xl"
                  }`}
                >
                  서버 가입 승인 대기
                </h2>

                <div className="h-px bg-slate-700 mb-4"></div>

                <div className="text-center mb-4 space-y-2">
                  <p className="text-slate-300 text-sm">
                    서버 관리자 승인을 대기중입니다.
                  </p>
                  <p className="text-slate-300 text-sm">
                    수락 시 입장이 가능합니다.
                  </p>
                </div>

                {/* 서버 정보 */}
                {serverName && (
                  <div className="text-center mb-4">
                    <p className="text-slate-400 text-xs mb-1">서버:</p>
                    <p className="text-white font-medium">{serverName}</p>
                  </div>
                )}

                {/* 상태 표시 */}
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3">
                  <div className="flex items-center justify-center space-x-2">
                    <div
                      className={`w-2 h-2 bg-blue-400 rounded-full ${
                        approvalStatus === "pending" ? "animate-pulse" : ""
                      }`}
                    ></div>
                    <span className="text-white text-sm font-medium">
                      {statusConfig.statusText}
                    </span>
                  </div>
                </div>

                {/* 로딩/에러 */}
                {isLoading && (
                  <div className="mt-3 text-center">
                    <p className="text-slate-400 text-xs">상태 확인 중...</p>
                  </div>
                )}

                {error && (
                  <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-300 text-xs text-center">
                      상태 확인 실패
                    </p>
                  </div>
                )}
              </motion.div>

              {/* 하단 카드: 서버 가입 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={`bg-slate-800/60 rounded-2xl border border-slate-700/30 flex-1 flex flex-col ${
                  isTablet ? "p-5" : "p-6"
                }`}
              >
                <h3
                  className={`font-semibold text-white mb-4 ${
                    isTablet ? "text-base" : "text-lg"
                  }`}
                >
                  서버 가입
                </h3>

                <div className="flex-1 mb-6">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    대기중일 때 기존 서버로 이동하고 싶으시다면
                    <br />
                    아래 버튼을 클릭해주세요.
                  </p>
                </div>

                {/* 버튼들 */}
                <div className="space-y-3">
                  {approvalStatus === "active" && (
                    <button
                      onClick={() =>
                        handleServerConnection(serverUrl, serverName)
                      }
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200"
                    >
                      서버 입장하기
                    </button>
                  )}

                  {(approvalStatus === "pending" ||
                    approvalStatus === "checking") && (
                    <button
                      onClick={handleManualRefresh}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-slate-500 disabled:to-slate-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "확인 중..." : "승인 상태 확인"}
                    </button>
                  )}

                  <button
                    onClick={handleGoToRecentServer}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200"
                  >
                    최근 서버 둘아가기
                  </button>
                </div>
              </motion.div>

              {/* 하단 상태 텍스트 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center mt-4"
              >
                <p className="text-slate-500 text-xs">
                  {approvalStatus === "pending" &&
                    "현재 승인 상태를 확인 중입니다."}
                  {approvalStatus === "active" &&
                    "승인이 완료되어 자동으로 입장합니다."}
                  {approvalStatus === "inactive" && "가입이 거절되었습니다."}
                  {approvalStatus === "checking" &&
                    "5초마다 자동으로 상태를 확인합니다."}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
