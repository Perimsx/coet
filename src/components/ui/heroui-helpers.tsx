'use client'

import React, { useState } from 'react'
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
} from '@heroui/react'

export { Skeleton, Spinner, Tabs, Tab }

export function Checkbox({
  children,
  checked = false,
  onChange,
  disabled = false,
  className = '',
}: {
  children: React.ReactNode
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
      className={className}
    >
      <HeroCheckbox.Content>
        <HeroCheckbox.Control>
          <HeroCheckbox.Indicator />
        </HeroCheckbox.Control>
        <span>{children}</span>
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
  return (
    <HeroButton
      variant={
        variant === 'flat'
          ? 'secondary'
          : variant === 'solid'
            ? 'primary'
            : variant
      }
      size={size}
      isDisabled={isDisabled || isLoading}
      isPending={isLoading}
      onClick={onClick}
      className={className}
      {...props}
    >
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
    <TextField isDisabled={isDisabled} isRequired={required} fullWidth>
      {label && <Label>{label}</Label>}
      <InputGroup fullWidth>
        <InputGroup.Input
          placeholder={placeholder}
          value={value || ''}
          onChange={onChange}
          className={className}
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
    <TextField isDisabled={isDisabled} isRequired={required} fullWidth>
      {label && <Label>{label}</Label>}
      <InputGroup fullWidth>
        <InputGroup.TextArea
          placeholder={placeholder}
          value={value || ''}
          onChange={onChange}
          rows={rows}
          className={className}
          {...props}
        />
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
  return <HeroCard className={className}>{children}</HeroCard>
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
  return <HeroCard.Content className={className}>{children}</HeroCard.Content>
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

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return <HeroModal.Footer>{children}</HeroModal.Footer>
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
      className={className}
      fullWidth
    >
      <HeroSelect.Trigger>
        <HeroSelect.Value>
          {({ defaultChildren }) => defaultChildren || placeholder}
        </HeroSelect.Value>
        <HeroSelect.Indicator />
      </HeroSelect.Trigger>
      <HeroSelect.Popover>
        <ListBox items={items}>
          {(item) => <ListBox.Item id={item.value}>{item.label}</ListBox.Item>}
        </ListBox>
      </HeroSelect.Popover>
    </HeroSelect>
  )
}
