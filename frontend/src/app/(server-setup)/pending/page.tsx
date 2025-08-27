"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useServerJoinStatusQuery } from "@/app/(server-setup)/hooks/useServerMutation";
import { useServerFlow } from "@/app/(server-setup)/hooks/useServerFlow";

const PendingApprovalPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleServerConnection } = useServerFlow();

  // URL 파라미터에서 서버 정보 가져오기
  const serverUrl = searchParams.get("serverUrl") || "";
  const serverName = searchParams.get("serverName") || "";

  // 서버 정보가 없으면 서버 연결 페이지로 리다이렉트
  useEffect(() => {
    if (!serverUrl || !serverName) {
      console.log("❌ 서버 정보가 없습니다. 서버 연결 페이지로 이동합니다.");
      router.push("/server-connect");
    }
  }, [serverUrl, serverName, router]);

  // 로컬 상태
  const [approvalStatus, setApprovalStatus] = useState<
    "pending" | "approved" | "rejected" | "checking"
  >("checking");

  // 서버 접근 권한 조회 - Tanstack Query 자동 polling 사용
  const {
    data: serverAccessList = [],
    isLoading,
    error,
    refetch,
  } = useServerJoinStatusQuery(serverUrl || "dummy", approvalStatus);

  // 사용자의 승인 상태 확인 (이메일 필터링 불필요)
  useEffect(() => {
    if (!serverAccessList.length || !serverUrl) return;

    // /join API는 현재 사용자의 상태만 반환하므로 첫 번째 항목 사용
    const currentUserAccess = serverAccessList[0];

    if (currentUserAccess) {
      switch (currentUserAccess.status) {
        case "Pending":
          setApprovalStatus("pending");
          break;
        case "Approved":
          setApprovalStatus("approved");
          break;
        case "Banned":
          setApprovalStatus("rejected");
          break;
        default:
          setApprovalStatus("pending");
      }
    } else {
      // 목록이 비어있으면 아직 요청이 처리되지 않았음
      setApprovalStatus("pending");
    }
  }, [serverAccessList, serverUrl]);

  // 승인 완료 시 자동 입장
  useEffect(() => {
    if (approvalStatus === "approved" && serverUrl && serverName) {
      console.log("✅ 승인 완료! 서버에 자동 입장합니다.");

      // 잠시 승인 완료 메시지를 보여준 후 입장
      setTimeout(async () => {
        try {
          await handleServerConnection(serverUrl, serverName);
        } catch (error) {
          console.error("자동 입장 실패:", error);
          // 실패 시 수동으로 다시 시도할 수 있도록 UI 제공
        }
      }, 2000);
    }
  }, [approvalStatus, serverUrl, serverName, handleServerConnection]);

  const handleGoToRecentServer = () => {
    router.push("/server-connect");
  };

  const handleManualRefresh = () => {
    refetch();
  };

  // 승인 상태에 따른 UI 렌더링
  const getStatusConfig = () => {
    switch (approvalStatus) {
      case "approved":
        return {
          icon: "✅",
          title: "승인 완료!",
          description:
            "서버 입장이 승인되었습니다.\n잠시 후 자동으로 입장합니다.",
          statusColor: "text-green-300",
          bgColor: "bg-green-500/20 border-green-500/30",
          statusText: "승인 완료",
          dotColor: "bg-green-400",
        };
      case "rejected":
        return {
          icon: "❌",
          title: "가입 거절됨",
          description:
            "서버 관리자가 가입 요청을 거절했습니다.\n다른 서버를 이용해보세요.",
          statusColor: "text-red-300",
          bgColor: "bg-red-500/20 border-red-500/30",
          statusText: "가입 거절",
          dotColor: "bg-red-400",
        };
      case "checking":
        return {
          icon: "🔍",
          title: "상태 확인 중",
          description:
            "현재 승인 상태를 확인하고 있습니다.\n잠시만 기다려주세요.",
          statusColor: "text-blue-300",
          bgColor: "bg-blue-500/20 border-blue-500/30",
          statusText: "확인 중",
          dotColor: "bg-blue-400",
        };
      default:
        return {
          icon: "⏰",
          title: "서버 가입 승인 대기",
          description:
            "서버 관리자의 승인을 대기중입니다.\n승인이 완료되면 자동으로 입장됩니다.",
          statusColor: "text-amber-300",
          bgColor: "bg-amber-500/20 border-amber-500/30",
          statusText: "승인 대기 중",
          dotColor: "bg-amber-400",
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* 배경 애니메이션 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-md w-full mx-auto px-6"
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 text-center">
          {/* 로고 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">Aurora</h1>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto rounded-full"></div>
          </motion.div>

          {/* 상태 아이콘 */}
          <motion.div
            animate={approvalStatus === "pending" ? { rotate: 360 } : {}}
            transition={{
              duration: 3,
              repeat: approvalStatus === "pending" ? Infinity : 0,
              ease: "linear",
            }}
            className="mb-6"
          >
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
              <span className="text-2xl">{statusConfig.icon}</span>
            </div>
          </motion.div>

          {/* 제목 */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-white mb-4"
          >
            {statusConfig.title}
          </motion.h2>

          {/* 서버 정보 */}
          {serverName && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-4"
            >
              <p className="text-gray-400 text-sm">서버:</p>
              <p className="text-white font-medium">{serverName}</p>
            </motion.div>
          )}

          {/* 설명 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-gray-300 mb-8 leading-relaxed whitespace-pre-line"
          >
            {statusConfig.description}
          </motion.p>

          {/* 상태 표시 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className={`${statusConfig.bgColor} rounded-lg p-4 mb-8`}
          >
            <div className="flex items-center justify-center space-x-2">
              <div
                className={`w-2 h-2 ${statusConfig.dotColor} rounded-full ${
                  approvalStatus === "pending" ? "animate-pulse" : ""
                }`}
              ></div>
              <span className={`${statusConfig.statusColor} font-medium`}>
                {statusConfig.statusText}
              </span>
            </div>
          </motion.div>

          {/* 로딩 표시 */}
          {isLoading && (
            <div className="mb-4">
              <div className="text-gray-400 text-sm">상태 확인 중...</div>
            </div>
          )}

          {/* 에러 표시 */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="text-red-300 text-sm">상태 확인 실패</div>
            </div>
          )}

          {/* 구분선 */}
          <div className="border-t border-white/20 my-8"></div>

          {/* 액션 버튼들 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="space-y-4"
          >
            {approvalStatus === "approved" && (
              <button
                onClick={() => handleServerConnection(serverUrl, serverName)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                서버 입장하기
              </button>
            )}

            {(approvalStatus === "pending" ||
              approvalStatus === "checking") && (
              <button
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                {isLoading ? "확인 중..." : "승인 상태 확인"}
              </button>
            )}

            <button
              onClick={handleGoToRecentServer}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              다른 서버 연결하기
            </button>
          </motion.div>
        </div>

        {/* 하단 정보 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="text-center mt-8"
        >
          <p className="text-gray-500 text-xs">
            {approvalStatus === "pending" &&
              "5초마다 자동으로 상태를 확인합니다."}
            {approvalStatus === "approved" &&
              "승인이 완료되어 자동으로 입장합니다."}
            {approvalStatus === "rejected" && "가입이 거절되었습니다."}
            {approvalStatus === "checking" && "현재 승인 상태를 확인 중입니다."}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PendingApprovalPage;
