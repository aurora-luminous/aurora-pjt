"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useResponsive } from "../../lib/useResponsive";
import { useModal } from "../hooks/useModal";
import { useLogoutMutation } from "../../(auth)/hooks/useAuthMutations";

const SettingModal = () => {
  const { isMobile, isTablet } = useResponsive();
  const { isOpen, isSettingModal, close } = useModal();
  const router = useRouter();
  const logoutMutation = useLogoutMutation();

  // 음성/마이크 설정 상태 (UI만, 실제 기능은 나중에 구현)
  const [audioSettings, setAudioSettings] = useState({
    microphone: true,
    speaker: true,
    noiseSuppression: false,
    echoCancellation: true,
    autoGainControl: true,
  });

  const handleClose = () => {
    close();
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      console.log("✅ 로그아웃 성공");
      handleClose();
      router.push("/login");
    } catch (error) {
      console.error("❌ 로그아웃 실패:", error);
    }
  };

  const handleAudioSettingChange = (setting: keyof typeof audioSettings) => {
    setAudioSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && isSettingModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center"
          onClick={handleClose}
        >
          {isMobile ? (
            // 모바일: Bottom Sheet
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 bg-gray-700 rounded-t-xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 드래그 핸들 */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
              </div>

              {/* 헤더 */}
              <div className="flex justify-between items-center px-4 pb-4">
                <h2 className="text-lg font-semibold text-white">설정</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors text-lg"
                >
                  ✕
                </button>
              </div>

              {/* 스크롤 가능한 콘텐츠 */}
              <div className="overflow-y-auto px-4 pb-4 max-h-[calc(80vh-80px)]">
                <div className="space-y-4">
                  {/* 음성 설정 섹션 */}
                  <div className="bg-gray-600 rounded-lg p-3">
                    <h3 className="text-white font-medium mb-3 text-sm flex items-center">
                      <span className="mr-2">🎤</span>
                      음성 및 비디오
                    </h3>
                    <div className="space-y-3">
                      {/* 마이크 설정 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-2 text-sm">🎙️</span>
                          <div>
                            <div className="text-white text-sm">마이크</div>
                            <div className="text-gray-300 text-xs">
                              마이크 음소거 해제
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAudioSettingChange("microphone")}
                          className={`relative flex-shrink-0 rounded-full transition-colors w-8 h-5 ${
                            audioSettings.microphone
                              ? "bg-blue-600"
                              : "bg-gray-400"
                          }`}
                        >
                          <span
                            className={`block rounded-full bg-white transition-transform w-3 h-3 mt-1 ${
                              audioSettings.microphone
                                ? "translate-x-4"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      {/* 스피커 설정 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-2 text-sm">🔊</span>
                          <div>
                            <div className="text-white text-sm">스피커</div>
                            <div className="text-gray-300 text-xs">
                              스피커 음소거 해제
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAudioSettingChange("speaker")}
                          className={`relative flex-shrink-0 rounded-full transition-colors w-8 h-5 ${
                            audioSettings.speaker
                              ? "bg-blue-600"
                              : "bg-gray-400"
                          }`}
                        >
                          <span
                            className={`block rounded-full bg-white transition-transform w-3 h-3 mt-1 ${
                              audioSettings.speaker
                                ? "translate-x-4"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      {/* 노이즈 억제 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-2 text-sm">🔇</span>
                          <div>
                            <div className="text-white text-sm">
                              노이즈 억제
                            </div>
                            <div className="text-gray-300 text-xs">
                              배경 소음 제거
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleAudioSettingChange("noiseSuppression")
                          }
                          className={`relative flex-shrink-0 rounded-full transition-colors w-8 h-5 ${
                            audioSettings.noiseSuppression
                              ? "bg-blue-600"
                              : "bg-gray-400"
                          }`}
                        >
                          <span
                            className={`block rounded-full bg-white transition-transform w-3 h-3 mt-1 ${
                              audioSettings.noiseSuppression
                                ? "translate-x-4"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      {/* 에코 제거 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-2 text-sm">📢</span>
                          <div>
                            <div className="text-white text-sm">에코 제거</div>
                            <div className="text-gray-300 text-xs">
                              음성 에코 제거
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleAudioSettingChange("echoCancellation")
                          }
                          className={`relative flex-shrink-0 rounded-full transition-colors w-8 h-5 ${
                            audioSettings.echoCancellation
                              ? "bg-blue-600"
                              : "bg-gray-400"
                          }`}
                        >
                          <span
                            className={`block rounded-full bg-white transition-transform w-3 h-3 mt-1 ${
                              audioSettings.echoCancellation
                                ? "translate-x-4"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      {/* 자동 게인 제어 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-2 text-sm">🎚️</span>
                          <div>
                            <div className="text-white text-sm">
                              자동 게인 제어
                            </div>
                            <div className="text-gray-300 text-xs">
                              마이크 볼륨 자동 조절
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleAudioSettingChange("autoGainControl")
                          }
                          className={`relative flex-shrink-0 rounded-full transition-colors w-8 h-5 ${
                            audioSettings.autoGainControl
                              ? "bg-blue-600"
                              : "bg-gray-400"
                          }`}
                        >
                          <span
                            className={`block rounded-full bg-white transition-transform w-3 h-3 mt-1 ${
                              audioSettings.autoGainControl
                                ? "translate-x-4"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 계정 섹션 */}
                  <div className="bg-gray-600 rounded-lg p-3">
                    <h3 className="text-white font-medium mb-3 text-sm flex items-center">
                      <span className="mr-2">👤</span>
                      계정
                    </h3>
                    <button
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-2 text-sm font-medium transition-colors flex items-center justify-center"
                    >
                      <span className="mr-2">🚪</span>
                      {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            // 데스크톱/태블릿: 기존 모달
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full mx-auto bg-gray-700 rounded-lg ${
                isTablet ? "max-w-lg p-5" : "max-w-md p-6"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-semibold text-white text-xl">설정</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* 음성 설정 섹션 */}
                <div className="bg-gray-600 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4 text-base flex items-center">
                    <span className="mr-3">🎤</span>
                    음성 및 비디오
                  </h3>
                  <div className="space-y-4">
                    {/* 마이크 설정 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-3 text-base">🎙️</span>
                        <div>
                          <div className="text-white text-base">마이크</div>
                          <div className="text-gray-300 text-sm">
                            마이크 음소거 해제
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAudioSettingChange("microphone")}
                        className={`relative flex-shrink-0 rounded-full transition-colors w-12 h-6 ${
                          audioSettings.microphone
                            ? "bg-blue-600"
                            : "bg-gray-400"
                        }`}
                      >
                        <span
                          className={`block rounded-full bg-white transition-transform w-4 h-4 mt-1 ${
                            audioSettings.microphone
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* 스피커 설정 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-3 text-base">🔊</span>
                        <div>
                          <div className="text-white text-base">스피커</div>
                          <div className="text-gray-300 text-sm">
                            스피커 음소거 해제
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAudioSettingChange("speaker")}
                        className={`relative flex-shrink-0 rounded-full transition-colors w-12 h-6 ${
                          audioSettings.speaker ? "bg-blue-600" : "bg-gray-400"
                        }`}
                      >
                        <span
                          className={`block rounded-full bg-white transition-transform w-4 h-4 mt-1 ${
                            audioSettings.speaker
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* 노이즈 억제 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-3 text-base">🔇</span>
                        <div>
                          <div className="text-white text-base">
                            노이즈 억제
                          </div>
                          <div className="text-gray-300 text-sm">
                            배경 소음 제거
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleAudioSettingChange("noiseSuppression")
                        }
                        className={`relative flex-shrink-0 rounded-full transition-colors w-12 h-6 ${
                          audioSettings.noiseSuppression
                            ? "bg-blue-600"
                            : "bg-gray-400"
                        }`}
                      >
                        <span
                          className={`block rounded-full bg-white transition-transform w-4 h-4 mt-1 ${
                            audioSettings.noiseSuppression
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* 에코 제거 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-3 text-base">📢</span>
                        <div>
                          <div className="text-white text-base">에코 제거</div>
                          <div className="text-gray-300 text-sm">
                            음성 에코 제거
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleAudioSettingChange("echoCancellation")
                        }
                        className={`relative flex-shrink-0 rounded-full transition-colors w-12 h-6 ${
                          audioSettings.echoCancellation
                            ? "bg-blue-600"
                            : "bg-gray-400"
                        }`}
                      >
                        <span
                          className={`block rounded-full bg-white transition-transform w-4 h-4 mt-1 ${
                            audioSettings.echoCancellation
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* 자동 게인 제어 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-3 text-base">🎚️</span>
                        <div>
                          <div className="text-white text-base">
                            자동 게인 제어
                          </div>
                          <div className="text-gray-300 text-sm">
                            마이크 볼륨 자동 조절
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleAudioSettingChange("autoGainControl")
                        }
                        className={`relative flex-shrink-0 rounded-full transition-colors w-12 h-6 ${
                          audioSettings.autoGainControl
                            ? "bg-blue-600"
                            : "bg-gray-400"
                        }`}
                      >
                        <span
                          className={`block rounded-full bg-white transition-transform w-4 h-4 mt-1 ${
                            audioSettings.autoGainControl
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 계정 섹션 */}
                <div className="bg-gray-600 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4 text-base flex items-center">
                    <span className="mr-3">👤</span>
                    계정
                  </h3>
                  <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-3 font-medium transition-colors flex items-center justify-center"
                  >
                    <span className="mr-2">🚪</span>
                    {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 모바일에서는 Portal을 사용하여 document.body에 직접 렌더링
  if (typeof window !== "undefined" && isMobile) {
    return createPortal(modalContent, document.body);
  }

  // 데스크톱/태블릿에서는 일반 렌더링
  return modalContent;
};

export default SettingModal;
