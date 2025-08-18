"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../hooks/useModal";

const AddServerModal = () => {
  const { isOpen, isServerAddModal, close } = useModal();
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [serverName, setServerName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
  };

  const handleClose = () => {
    setIsSuccess(false);
    close();
  };

  return (
    <AnimatePresence>
      {isOpen && isServerAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-aurora-form/80 backdrop-blur-md"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-xl mx-auto bg-aurora-form rounded-xl p-8 border border-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            {!isSuccess && (
              <div className="flex flex-col">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      서버 도메인 URL을 입력해주세요.
                    </label>
                    <input
                      type="url"
                      value={serverUrl}
                      onChange={(e) => setServerUrl(e.target.value)}
                      placeholder="서버 URL"
                      className="w-full px-4 py-3 bg-white border border-white/20 rounded-lg text-gray-500 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      서버 호스팅 이름을 입력해주세요.
                    </label>
                    <input
                      type="text"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      placeholder="서버 호스팅 이름"
                      className="w-full px-4 py-3 bg-white border border-gray-500 rounded-lg text-gray-500 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-colors"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    서버 추가
                  </button>
                </form>
              </div>
            )}

            {isSuccess && (
              <div className="flex flex-col space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    서버 추가 성공!
                  </h2>
                  <p className="text-white">
                    새로운 서버가 성공적으로 추가되었습니다.
                  </p>
                </div>

                <div className="flex justify-center space-x-3">
                  <button
                    onClick={close}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition duration-200"
                  >
                    확인
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddServerModal;
