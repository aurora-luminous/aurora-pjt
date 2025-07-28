"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../hooks/useModal";

const AddServerModal = () => {
  const { isOpen, isServerAddModal, close } = useModal();

  return (
    <AnimatePresence>
      {isOpen && isServerAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                서버 추가 성공!
              </h2>
              <p className="text-gray-600">
                새로운 서버가 성공적으로 추가되었습니다.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={close}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
              >
                취소
              </button>
              <button
                onClick={close}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition duration-200"
              >
                확인
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddServerModal;
