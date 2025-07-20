import React from 'react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">메인 페이지 입니다</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">인증 페이지</h2>
          <div className="space-x-4">
            <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              로그인 페이지
            </Link>
            <Link href="/register" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              회원가입 페이지
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">프로젝트 관련</h2>
          <div className="space-x-4">
            <Link href="/projects/create" className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              프로젝트 생성
            </Link>
            <Link href="/project123" className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              프로젝트 상세 (예시)
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">서버 관련</h2>
          <Link href="/server-connect" className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            서버 연결
          </Link>
        </div>
      </div>
    </div>
  )
}
