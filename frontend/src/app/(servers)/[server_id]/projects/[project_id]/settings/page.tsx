import React from 'react'
import Link from 'next/link'

const SettingsPage = () => {
  const projectId = "project123" // 예시 프로젝트 ID
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">설정 페이지 입니다</h1>
      <p className="mb-4 text-gray-600">프로젝트 ID: {projectId}</p>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">프로젝트 내 이동</h2>
          <div className="space-x-4">
            <Link href={`/${projectId}`} className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              프로젝트 메인
            </Link>
            <Link href={`/${projectId}/messages`} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              메시지 페이지
            </Link>
            <Link href={`/${projectId}/channels/general`} className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              채널 페이지
            </Link>
          </div>
        </div>
        
        <div>
          <Link href="/" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            메인으로
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage