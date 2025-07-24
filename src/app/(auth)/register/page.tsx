'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuthForm } from '../hooks/useAuthForm'
import { AuthFormData } from '../types/AuthFormData'
import { AuthInput } from '../components/AuthInput'
import { AuthCheckbox } from '../components/AuthCheckbox'
import { AuthButton } from '../components/AuthButton'
import { AuthInputWithButton } from '../components/AuthInputWithButton'

const pageVariants = {
  initial: {
    opacity: 0,
    y: 50,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -50,
  },
}

const RegisterPage = () => {
  const { formData, errors, isLoading, updateField, handleSubmit } = useAuthForm({
    initialData: {
      name: '',
      confirmPassword: '',
      agreeToTerms: false
    },
    onSubmit: async (data: AuthFormData) => {
      // 실제 회원가입 로직 구현
      console.log('Register data:', data)
      // 예: API 호출, 회원가입 처리
      await new Promise(resolve => setTimeout(resolve, 1000)) // 임시 delay
    }
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit('register')
  }

  return (
    <motion.div 
      key="register"
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="exit"
      transition={{
        duration: 0.4,
        ease: "easeInOut"
      }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">회원가입</h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">

      <AuthInputWithButton
          label="이메일"
          type="email"
          id="email"
          name="email"
          value={formData.email}
          placeholder="이메일을 입력하세요"
          error={errors.email}
          onChange={(value) => updateField('email', value)}
          buttonText="이메일 인증"
          onButtonClick={() => {
            alert('이메일 인증 버튼 클릭')
          }}
          required
        />
        <AuthInput
          label="이름"
          type="text"
          id="name"
          name="name"
          value={formData.name || ''}
          placeholder="이름을 입력하세요"
          error={errors.name}
          onChange={(value) => updateField('name', value)}
          required
        />

       

        <AuthInput
          label="비밀번호"
          type="password"
          id="password"
          name="password"
          value={formData.password}
          placeholder="비밀번호를 입력하세요"
          error={errors.password}
          onChange={(value) => updateField('password', value)}
          required
        />

        <AuthInput
          label="비밀번호 확인"
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword || ''}
          placeholder="비밀번호를 다시 입력하세요"
          error={errors.confirmPassword}
          onChange={(value) => updateField('confirmPassword', value)}
          required
        />

        {/* <AuthCheckbox
          id="agreeToTerms"
          name="agreeToTerms"
          checked={formData.agreeToTerms || false}
          onChange={(checked) => updateField('agreeToTerms', checked)}
          error={errors.agreeToTerms}
        >
          <Link href="#" className="text-purple-300 hover:text-purple-200">서비스 약관</Link> 및{' '}
          <Link href="#" className="text-purple-300 hover:text-purple-200">개인정보 처리방침</Link>에 동의합니다.
        </AuthCheckbox> */}
        <div className="mt-8 text-center">
        <p className="text-white/70">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-purple-300 hover:text-purple-200 font-medium">
            로그인 하러가기
          </Link>
        </p>
      </div>
        <AuthButton
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
          className='mb-6 mt-4'
        >
          회원가입
        </AuthButton>
      </form>

    </motion.div>
  )
}

export default RegisterPage