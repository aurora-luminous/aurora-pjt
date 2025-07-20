import React from 'react'
import Link from 'next/link'

const LoginPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">로그인 페이지 입니다</h1>
      
      <div className="space-x-4">
        <Link href="/" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          메인으로
        </Link>
        <Link href="/register" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          회원가입
        </Link>
      </div>
    </div>
  )
}

export default LoginPage