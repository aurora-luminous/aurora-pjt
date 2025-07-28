'use client'

import React from 'react'

interface AuthButtonProps {
  type?: 'submit' | 'button'
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  type = 'button',
  variant = 'primary',
  children,
  onClick,
  disabled = false,
  loading = false,
  className = ''
}) => {
  const baseClasses = 'w-full font-semibold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-purple-500 hover:bg-purple-600 text-white focus:ring-purple-400',
    secondary: 'bg-white/10 hover:bg-white/20 text-white/80 focus:ring-white/50'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
          처리중...
        </div>
      ) : (
        children
      )}
    </button>
  )
} 