'use client'

import React, { useState } from 'react'
import {
  Button as HeroButton,
  Card as HeroCard,
  Chip as HeroChip,
  InputGroup,
  TextField,
  Label,
  Skeleton,
  Spinner,
  Tabs,
  Tab,
} from '@heroui/react'

export { Skeleton, Spinner, Tabs, Tab }

export function useDisclosure(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState)
  return {
    isOpen,
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
    toggle: () => setIsOpen((v) => !v),
  }
}

export function Button({
  children,
  variant = 'primary',
  color,
  size = 'sm',
  isDisabled,
  isLoading,
  className = '',
  onClick,
  ...props
}: any) {
  let mappedVariant: any = variant
  if (color === 'primary' || variant === 'solid') mappedVariant = 'primary'
  if (variant === 'outline') mappedVariant = 'outline'
  if (variant === 'ghost') mappedVariant = 'ghost'
  if (variant === 'flat') mappedVariant = 'secondary'
  if (variant === 'danger' || color === 'danger') mappedVariant = 'danger'

  let sizeStyle = 'px-3 py-1.5 text-xs rounded-md font-medium'
  if (size === 'md') sizeStyle = 'px-3.5 py-2 text-xs font-semibold rounded-md'
  if (size === 'lg') sizeStyle = 'px-4.5 py-2.5 text-sm font-semibold rounded-lg'

  let variantStyle = 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs shadow-zinc-950/10 dark:shadow-white/10 hover:shadow-sm border border-transparent'
  if (variant === 'flat' || variant === 'secondary') {
    variantStyle = 'bg-zinc-100/80 hover:bg-zinc-200/90 dark:bg-zinc-800/50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 backdrop-blur-md border border-zinc-200/40 dark:border-zinc-700/40'
  } else if (variant === 'ghost') {
    variantStyle = 'bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100 border border-transparent'
  } else if (variant === 'outline') {
    variantStyle = 'bg-transparent border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30'
  } else if (variant === 'danger' || color === 'danger') {
    variantStyle = 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 hover:border-red-500/30'
  }

  const baseStyle = 'inline-flex flex-row items-center justify-center whitespace-nowrap shrink-0 transition-all duration-200 ease-out cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100'

  return (
    <HeroButton
      variant={mappedVariant}
      size={size}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      className={`${baseStyle} ${sizeStyle} ${variantStyle} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </HeroButton>
  )
}

export function Input({
  label,
  className = '',
  isDisabled,
  placeholder,
  value,
  onChange,
  required,
  ...props
}: any) {
  return (
    <TextField isDisabled={isDisabled} isRequired={required} className="w-full">
      {label && <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1 block">{label}</Label>}
      <InputGroup className="w-full">
        <InputGroup.Input
          placeholder={placeholder}
          value={value || ''}
          onChange={onChange}
          className={`w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 ${className}`}
          {...props}
        />
      </InputGroup>
    </TextField>
  )
}

export function TextArea({
  label,
  className = '',
  isDisabled,
  placeholder,
  value,
  onChange,
  rows = 6,
  required,
  ...props
}: any) {
  return (
    <TextField isDisabled={isDisabled} isRequired={required} className="w-full">
      {label && <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1 block">{label}</Label>}
      <InputGroup className="w-full">
        <InputGroup.TextArea
          placeholder={placeholder}
          value={value || ''}
          onChange={onChange}
          rows={rows}
          className={`w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 leading-relaxed font-mono ${className}`}
          {...props}
        />
      </InputGroup>
    </TextField>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <HeroCard className={`border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg ${className}`}>
      {children}
    </HeroCard>
  )
}

export function Chip({
  children,
  color = 'default',
  size = 'sm',
  className = '',
}: {
  children: React.ReactNode
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'accent'
  variant?: string
  size?: 'sm' | 'md'
  className?: string
}) {
  let mappedColor: any = color === 'primary' || color === 'secondary' ? 'accent' : color
  return (
    <HeroChip color={mappedColor} className={className}>
      {children}
    </HeroChip>
  )
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-3 ${className}`}>{children}</div>
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-3 pt-3 pb-0 font-bold text-sm text-zinc-900 dark:text-zinc-100 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-3 py-2.5 border-t border-zinc-100 dark:border-zinc-800 ${className}`}>{children}</div>
}

export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md',
}: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode | ((args: { onClose: () => void }) => React.ReactNode)
  size?: 'sm' | 'md' | 'lg' | '2xl'
}) {
  if (!isOpen) return null
  const sizeClass = size === '2xl' ? 'max-w-2xl' : size === 'lg' ? 'max-w-lg' : 'max-w-md'
  const content = typeof children === 'function' ? children({ onClose }) : children
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full ${sizeClass} bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-4 flex flex-col gap-2.5 relative`}
      >
        {content}
      </div>
    </div>
  )
}

export function ModalContent({ children }: { children: (args: { onClose: () => void }) => React.ReactNode }) {
  return <>{children({ onClose: () => {} })}</>
}

export function ModalHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-base font-bold text-zinc-900 dark:text-zinc-100 ${className}`}>{children}</h2>
}

export function ModalBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-2.5 ${className}`}>{children}</div>
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
      {children}
    </div>
  )
}

export function Select({
  value,
  onChange,
  options = [],
  children,
  className = '',
  placeholder,
  ...props
}: {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options?: { value: string; label: string }[]
  children?: React.ReactNode
  className?: string
  placeholder?: string
  [key: string]: any
}) {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        value={value || ''}
        onChange={onChange}
        className="w-full appearance-none cursor-pointer rounded-md border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/80 hover:bg-zinc-200/90 dark:bg-zinc-800/50 dark:hover:bg-zinc-800/80 backdrop-blur-md px-3 py-1.5 pr-9 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 active:scale-[0.99]"
        {...props}
      >
        {placeholder && <option value="" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">{placeholder}</option>}
        {options.length > 0
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 py-1">
                {opt.label}
              </option>
            ))
          : children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}
