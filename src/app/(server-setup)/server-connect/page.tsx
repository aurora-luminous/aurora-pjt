'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

const ServerConnectPage = () => {
  const [serverUrl, setServerUrl] = useState('')
  const [serverName, setServerName] = useState('')
  const [selectedServer, setSelectedServer] = useState('SSAFY 연구반')

  const handleServerAdd = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('서버 추가:', { serverUrl, serverName })
    // 서버 추가 로직 구현
  }

  const handleServerJoin = () => {
    console.log('서버 입장:', selectedServer)
    // 서버 입장 로직 구현
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽: 서버 추가 폼 */}
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-white mb-2">서버 추가</h2>
          </div>

          <form onSubmit={handleServerAdd} className="space-y-4">
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

            <p className="text-sm text-white">
              서버에 참여하시려면 <span className="text-purple-300">서버 관리자</span>
            </p>

            <button
              type="submit"
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              서버 추가
            </button>
          </form>
        </div>

        {/* 오른쪽: 사용자 정보 및 서버 선택 */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-6">반갑습니다 김세현 님</h2>
            
            {/* 프로필 이미지 */}
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-300 overflow-hidden">
              <img 
                src="/background/logo.png" 
                alt="프로필" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
              <div className="hidden w-full h-full bg-gray-400 flex items-center justify-center text-white text-xl font-bold">
                김
              </div>
            </div>

            <div className="space-y-4">
              <div className='text-start'>
              <div className='mb-7'>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  서버 선택
                </label>
                <select
                  value={selectedServer}
                  onChange={(e) => setSelectedServer(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-500 rounded-lg text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-colors"
                >
                  <option value="SSAFY 연구반" className="bg-gray-800">SSAFY 연구반</option>
                  <option value="테스트 서버" className="bg-gray-800">테스트 서버</option>
                  <option value="개발 서버" className="bg-gray-800">개발 서버</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleServerJoin}
                  className="w-1/3 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  서버 입장
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ServerConnectPage