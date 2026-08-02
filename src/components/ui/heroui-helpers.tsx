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

  let defaultStyle = 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 px-4 py-2 shadow-sm border-0'
  if (variant === 'flat' || variant === 'outline' || variant === 'ghost') {
    defaultStyle = 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-4 py-2 shadow-sm border-0'
  }
  if (variant === 'danger' || color === 'danger') {
    defaultStyle = 'bg-red-500 text-white hover:bg-red-600 px-4 py-2 shadow-sm border-0'
  }

  return (
    <HeroButton
      variant={mappedVariant}
      size={size}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      className={`inline-flex flex-row items-center justify-center whitespace-nowrap shrink-0 font-semibold rounded-xl transition-all cursor-pointer ${defaultStyle} ${className}`}
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
          className={`w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 ${className}`}
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
          className={`w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 leading-relaxed font-mono ${className}`}
          {...props}
        />
      </InputGroup>
    </TextField>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <HeroCard className={`border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl ${className}`}>
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
  return <div className={`p-4 ${className}`}>{children}</div>
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-4 pt-4 pb-0 font-bold text-sm text-zinc-900 dark:text-zinc-100 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 border-t border-zinc-100 dark:border-zinc-800 ${className}`}>{children}</div>
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
        className={`w-full ${sizeClass} bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 flex flex-col gap-3 relative`}
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
