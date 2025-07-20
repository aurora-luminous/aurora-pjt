import React from 'react'
import Link from 'next/link'

const ServerConnectPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">서버 연결 페이지 입니다</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">네비게이션</h2>
          <div className="space-x-4">
            <Link href="/" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
              메인으로
            </Link>
            <Link href="/project123" className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              프로젝트 상세 (예시)
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServerConnectPage