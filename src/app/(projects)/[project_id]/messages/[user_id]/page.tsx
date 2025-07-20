import React from 'react'
import Link from 'next/link'

const UserMessagePage = () => {
  const projectId = "project123" // 예시 프로젝트 ID
  const userId = "user456" // 예시 사용자 ID
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">사용자 메시지 페이지 입니다</h1>
      <p className="mb-2 text-gray-600">프로젝트 ID: {projectId}</p>
      <p className="mb-4 text-gray-600">사용자 ID: {userId}</p>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">프로젝트 내 이동</h2>
          <div className="space-x-4">
            <Link href={`/${projectId}`} className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              프로젝트 메인
            </Link>
            <Link href={`/${projectId}/messages`} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              메시지 목록
            </Link>
            <Link href={`/${projectId}/settings`} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              설정 페이지
            </Link>
            <Link href={`/${projectId}/channels/general`} className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              채널 페이지
            </Link>
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">다른 사용자 메시지</h2>
          <div className="space-x-4">
            <Link href={`/${projectId}/messages/user789`} className="bg-green-400 text-white px-4 py-2 rounded hover:bg-green-500">
              user789 메시지
            </Link>
            <Link href={`/${projectId}/messages/user321`} className="bg-green-300 text-white px-4 py-2 rounded hover:bg-green-400">
              user321 메시지
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

export default UserMessagePage