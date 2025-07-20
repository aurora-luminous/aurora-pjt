import React from 'react'
import Link from 'next/link'

const RegisterPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">회원가입 페이지 입니다</h1>
      
      <div className="space-x-4">
        <Link href="/" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          메인으로
        </Link>
        <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          로그인
        </Link>
      </div>
    </div>
  )
}

export default RegisterPage