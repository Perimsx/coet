'use client'

import React, { useState } from 'react'
import { cn } from '@/shared/utils/utils'
import {
  Button as HeroButton,
  Card as HeroCard,
  Checkbox as HeroCheckbox,
  Chip as HeroChip,
  ListBox,
  Modal as HeroModal,
  InputGroup,
  TextField,
  Label,
  Skeleton,
  Spinner,
  Select as HeroSelect,
  Tabs,
  Tab,
  Fieldset,
  FieldGroup,
  Form,
  Description,
  FieldError,
  Switch as HeroSwitch,
  SwitchGroup,
} from '@heroui/react'

export {
  Skeleton,
  Spinner,
  Tabs,
  Tab,
  Fieldset,
  FieldGroup,
  Form,
  Description,
  FieldError,
  HeroSwitch,
  SwitchGroup,
}

export function Switch({
  children,
  checked,
  isSelected,
  onChange,
  isDisabled,
  size = 'md',
  className = '',
  description,
  'aria-label': ariaLabel,
  ...props
}: {
  children?: React.ReactNode
  checked?: boolean
  isSelected?: boolean
  onChange?: (checked: boolean) => void
  isDisabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  description?: React.ReactNode
  'aria-label'?: string
  [key: string]: any
}) {
  const active = checked ?? isSelected
  const labelText =
    ariaLabel || (typeof children === 'string' ? children : '开关')
  return (
    <HeroSwitch
      isSelected={active}
      onChange={onChange}
      isDisabled={isDisabled}
      size={size}
      aria-label={labelText}
      className={`inline-flex items-center ${className}`}
      {...props}
    >
      <HeroSwitch.Content className="inline-flex items-center gap-2 cursor-pointer select-none">
        <HeroSwitch.Control className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none data-[selected=true]:bg-blue-600 bg-zinc-300 dark:bg-zinc-700">
          <HeroSwitch.Thumb className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out data-[selected=true]:translate-x-4 translate-x-0" />
        </HeroSwitch.Control>
        {children ? (
          <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
            {children}
          </span>
        ) : null}
      </HeroSwitch.Content>
      {description && <Description>{description}</Description>}
    </HeroSwitch>
  )
}

export function Checkbox({
  children,
  checked = false,
  onChange,
  disabled = false,
  className = '',
}: {
  children?: React.ReactNode
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <HeroCheckbox
      isSelected={checked}
      isDisabled={disabled}
      onChange={onChange}
      className={`inline-flex items-center gap-2 cursor-pointer ${className}`}
    >
      <HeroCheckbox.Content className="inline-flex items-center gap-2">
        <HeroCheckbox.Control className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-300 dark:border-zinc-700 transition-colors data-[selected=true]:bg-primary data-[selected=true]:border-primary">
          <HeroCheckbox.Indicator className="h-3 w-3 text-white shrink-0" />
        </HeroCheckbox.Control>
        {children && (
          <span className="text-xs text-zinc-700 dark:text-zinc-300">
            {children}
          </span>
        )}
      </HeroCheckbox.Content>
    </HeroCheckbox>
  )
}

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
  size = 'sm',
  isDisabled,
  isLoading,
  className = '',
  onClick,
  ...props
}: any) {
  const baseClasses =
    'inline-flex flex-row items-center justify-center gap-1.5 font-medium cursor-pointer transition-all disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap'
  const sizeClasses =
    size === 'xs'
      ? 'h-7 px-2.5 text-[11px] rounded-md'
      : size === 'sm'
        ? 'h-9 px-3.5 text-xs rounded-lg'
        : size === 'lg'
          ? 'h-11 px-5 text-sm rounded-lg'
          : 'h-10 px-4 text-xs rounded-lg'

  const variantClasses =
    variant === 'primary' || variant === 'solid'
      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 shadow-sm'
      : variant === 'secondary' || variant === 'outline' || variant === 'flat'
        ? 'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 active:scale-95 shadow-xs'
        : variant === 'danger'
          ? 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95 shadow-sm'
          : 'bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'

  return (
    <HeroButton
      size={size}
      isDisabled={isDisabled || isLoading}
      isPending={isLoading}
      onClick={onClick}
      className={cn(baseClasses, sizeClasses, variantClasses, className)}
      {...props}
    >
      {children}
    </HeroButton>
  )
}

export { InputGroup, TextField, Label }

export function Input({
  label,
  className = '',
  isDisabled,
  placeholder,
  value,
  onChange,
  required,
  prefix,
  suffix,
  variant,
  ...props
}: any) {
  return (
    <TextField isDisabled={isDisabled} isRequired={required} fullWidth>
      {label && (
        <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5 block">
          {label}
        </Label>
      )}
      <InputGroup
        variant={variant}
        fullWidth
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 overflow-hidden"
      >
        {prefix && <InputGroup.Prefix>{prefix}</InputGroup.Prefix>}
        <InputGroup.Input
          placeholder={placeholder}
          value={value ?? ''}
          onChange={onChange}
          className={`w-full px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 bg-transparent outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 border-0 ${className}`}
          {...props}
        />
        {suffix && <InputGroup.Suffix>{suffix}</InputGroup.Suffix>}
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
  rows = 5,
  required,
  prefix,
  suffix,
  variant,
  ...props
}: any) {
  return (
    <TextField isDisabled={isDisabled} isRequired={required} fullWidth>
      {label && (
        <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5 block">
          {label}
        </Label>
      )}
      <InputGroup
        variant={variant}
        fullWidth
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 overflow-hidden"
      >
        {prefix && <InputGroup.Prefix>{prefix}</InputGroup.Prefix>}
        <InputGroup.TextArea
          placeholder={placeholder}
          value={value ?? ''}
          onChange={onChange}
          rows={rows}
          className={`w-full p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 bg-transparent outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 border-0 ${className}`}
          {...props}
        />
        {suffix && <InputGroup.Suffix>{suffix}</InputGroup.Suffix>}
      </InputGroup>
    </TextField>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <HeroCard className={`xuzhan-admin-card ${className}`}>{children}</HeroCard>
}

export function Chip({
  children,
  color = 'default',
  size = 'sm',
  className = '',
}: {
  children: React.ReactNode
  color?:
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'secondary'
    | 'accent'
  variant?: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <HeroChip
      color={color === 'primary' || color === 'secondary' ? 'accent' : color}
      size={size}
      className={className}
    >
      {children}
    </HeroChip>
  )
}

export function CardBody({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <HeroCard.Content>
      <div className={className}>{children}</div>
    </HeroCard.Content>
  )
}

export function CardHeader({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <HeroCard.Header className={className}>{children}</HeroCard.Header>
}

export function CardFooter({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <HeroCard.Footer className={className}>{children}</HeroCard.Footer>
}

export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md',
}: {
  isOpen: boolean
  onClose: () => void
  children:
    | React.ReactNode
    | ((args: { onClose: () => void }) => React.ReactNode)
  size?: 'sm' | 'md' | 'lg' | '2xl'
}) {
  const content =
    typeof children === 'function' ? children({ onClose }) : children
  const modalSize = size === '2xl' ? 'lg' : size === 'lg' ? 'md' : 'sm'
  return (
    <HeroModal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <HeroModal.Backdrop variant="blur">
        <HeroModal.Container size={modalSize}>
          <HeroModal.Dialog>{content}</HeroModal.Dialog>
        </HeroModal.Container>
      </HeroModal.Backdrop>
    </HeroModal>
  )
}

export function ModalHeader({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <HeroModal.Header className={className}>{children}</HeroModal.Header>
}

export function ModalBody({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <HeroModal.Body className={className}>{children}</HeroModal.Body>
}

export function ModalFooter({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <HeroModal.Footer className={className}>{children}</HeroModal.Footer>
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '确认删除？',
  description = '此操作无法撤销，请确认是否继续。',
  confirmText = '确认删除',
  confirmVariant = 'danger',
  isLoading = false,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  description?: React.ReactNode
  confirmText?: string
  confirmVariant?: 'danger' | 'primary'
  isLoading?: boolean
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
        {title}
      </ModalHeader>
      <ModalBody className="py-2 text-xs text-zinc-600 dark:text-zinc-400">
        {description}
      </ModalBody>
      <ModalFooter className="flex items-center justify-end gap-2 pt-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          isDisabled={isLoading}
        >
          取消
        </Button>
        <Button
          variant={confirmVariant}
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export function Select({
  value,
  onChange,
  options = [],
  className = '',
  placeholder,
  ...props
}: {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options?: { value: string; label: string }[]
  className?: string
  placeholder?: string
  [key: string]: any
}) {
  const items = options.length ? options : []
  return (
    <HeroSelect
      {...props}
      selectedKey={value || undefined}
      onSelectionChange={(key) =>
        onChange?.({
          target: { value: String(key ?? '') },
        } as React.ChangeEvent<HTMLSelectElement>)
      }
      className={`min-w-[130px] ${className}`}
    >
      <HeroSelect.Trigger className="flex h-9 w-full items-center justify-between gap-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
        <HeroSelect.Value>
          {({ defaultChildren }) => defaultChildren || placeholder || '选择项目'}
        </HeroSelect.Value>
        <HeroSelect.Indicator />
      </HeroSelect.Trigger>
      <HeroSelect.Popover
        placement="bottom start"
        offset={4}
        className="z-[99] min-w-[var(--trigger-width)] w-max max-w-[220px] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 text-zinc-900 dark:text-zinc-100 shadow-lg animate-in fade-in-50 zoom-in-95 duration-100"
      >
        <ListBox items={items}>
          {(item: { value: string; label: string }) => (
            <ListBox.Item
              id={item.value}
              textValue={item.label}
              className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-xs font-medium outline-none transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/80 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-600 dark:data-[selected=true]:bg-blue-950/60 dark:data-[selected=true]:text-blue-400"
            >
              {item.label}
            </ListBox.Item>
          )}
        </ListBox>
      </HeroSelect.Popover>
    </HeroSelect>
  )
}
