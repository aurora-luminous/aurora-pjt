import React from 'react'
import Link from 'next/link'

const ProjectPage = () => {
  const projectId = "project123" // 예시 프로젝트 ID
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">프로젝트 상세 페이지 입니다</h1>
      <p className="mb-4 text-gray-600">프로젝트 ID: {projectId}</p>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">프로젝트 관리</h2>
          <div className="space-x-4">
            <Link href={`/${projectId}/settings`} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              설정 페이지
            </Link>
            <Link href={`/${projectId}/messages`} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              메시지 페이지
            </Link>
            <Link href={`/${projectId}/channels/general`} className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              채널 페이지 (general)
            </Link>
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">기타</h2>
          <div className="space-x-4">
            <Link href="/" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
              메인으로
            </Link>
            <Link href="/projects/create" className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              프로젝트 생성
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectPage