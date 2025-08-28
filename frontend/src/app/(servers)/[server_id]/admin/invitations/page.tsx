"use client";

import React from "react";
import { useInvitationsPage } from "@/app/(servers)/hooks/useInvitations";
import InviteCard from "../components/InviteCard";
import CreateInviteModal from "../components/CreateInviteModal";

const InvitationsPage = () => {
  const {
    invitations,
    isLoading,
    error,
    showCreateModal,
    setShowCreateModal,
    handleCreateInvite,
    handleDeleteInvite,
    handleCopyInvite,
  } = useInvitationsPage();

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">초대 목록을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400">초대 목록을 불러올 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-900 p-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">초대</h1>
          <p className="text-gray-400">
            서버 초대 링크를 관리하고 새로운 멤버를 초대하세요. 총{" "}
            {invitations.length}개의 초대
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>🔗</span>
          <span>초대 링크 만들기</span>
        </button>
      </div>

      {/* 안내 메시지 */}
      <div className="mb-6 bg-green-900/20 border border-green-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-green-400 text-lg">💡</span>
          <div>
            <h3 className="text-green-200 font-medium mb-1">초대 링크 관리</h3>
            <p className="text-green-300 text-sm">
              초대 링크의 만료 시간과 사용 횟수를 설정할 수 있습니다. 보안을
              위해 정기적으로 링크를 갱신하세요.
            </p>
          </div>
        </div>
      </div>

      {/* 초대 목록 */}
      <div className="space-y-4">
        {invitations.map((invitation) => (
          <InviteCard
            key={invitation.id}
            invitation={invitation}
            onDelete={handleDeleteInvite}
            onCopy={handleCopyInvite}
          />
        ))}
      </div>

      {invitations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">아직 생성된 초대가 없습니다.</div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            첫 번째 초대 링크 만들기
          </button>
        </div>
      )}

      {/* 모달 */}
      {showCreateModal && (
        <CreateInviteModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateInvite}
        />
      )}
    </div>
  );
};

export default InvitationsPage;
