'use client'

import React from 'react'

interface AuthInputProps {
  label: string
  type: 'text' | 'email' | 'password'
  id: string
  name: string
  value: string
  placeholder: string
  error?: string
  onChange: (value: string) => void
  required?: boolean
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  type,
  id,
  name,
  value,
  placeholder,
  error,
  onChange,
  required = false
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-white/90 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-colors ${
          error 
            ? 'border-red-400 focus:ring-red-400' 
            : 'border-white/20'
        }`}
        placeholder={placeholder}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
} 