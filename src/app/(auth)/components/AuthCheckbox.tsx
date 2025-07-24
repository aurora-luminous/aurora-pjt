'use client'

import React from 'react'

interface AuthCheckboxProps {
  id: string
  name: string
  checked: boolean
  onChange: (checked: boolean) => void
  children: React.ReactNode
  error?: string
}

export const AuthCheckbox: React.FC<AuthCheckboxProps> = ({
  id,
  name,
  checked,
  onChange,
  children,
  error
}) => {
  return (
    <div>
      <label className="flex items-start">
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={`w-4 h-4 text-purple-400 bg-white/10 border rounded focus:ring-purple-400 mt-1 ${
            error ? 'border-red-400' : 'border-white/20'
          }`}
        />
        <span className="ml-2 text-sm text-white/70">
          {children}
        </span>
      </label>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
} 