---
name: heroui-react
description: Comprehensive knowledge, usage patterns, and best practices for building React UI components using @heroui/react v3.
---

# HeroUI v3 Agent Skill

This skill provides comprehensive patterns and guidelines for constructing production-ready React interfaces using `@heroui/react` (v3).

## Core Principles

1. **Official Deconstructed API**:
   - Use `TextField`, `Label`, and `InputGroup` (`InputGroup.Input` / `InputGroup.TextArea`) for all text input controls.
   - Avoid wrapping inputs with redundant manual `<label>` elements.
2. **Interactive Controls & Buttons**:
   - Utilize `Button` with official variants (`primary`, `secondary`, `outline`, `ghost`, `danger`) and size attributes (`sm`, `md`, `lg`).
   - Use `isDisabled` and `isLoading` for defensive action feedback.
3. **Overlays & Dialogs**:
   - Structure modals using `<Modal>`, `<ModalHeader>`, `<ModalBody>`, and `<ModalFooter>`.
   - Maintain compact vertical padding (`gap-2.5` to `gap-3`) and backdrop blur effects for elevated aesthetics.
4. **Data Display & Feedback**:
   - Use `Card`, `CardBody`, `CardHeader`, `CardFooter` for grouped content panels.
   - Use `Chip` for status indication (`primary`, `success`, `warning`, `danger`, `accent`).
   - Use `Skeleton` for loading states and `Spinner` for active background task progress.
5. **Navigation & Collections**:
   - Leverage `Tabs` and `Tab` for segmented options and settings navigation.
   - Ensure tables enforce horizontal min-width bounds (`min-w-[650px]`) for mobile responsive safety.

## Standard Code Patterns

### Text Fields (Input & TextArea)

```tsx
import { TextField, Label, InputGroup } from '@heroui/react'

export function SingleLineInput({ label, placeholder, value, onChange }) {
  return (
    <TextField className="w-full">
      {label && <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1 block">{label}</Label>}
      <InputGroup className="w-full">
        <InputGroup.Input
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20"
        />
      </InputGroup>
    </TextField>
  )
}
```

### Modals & Dialogs

```tsx
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react'

export function EditModal({ isOpen, onClose, onSave }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalHeader>编辑设置</ModalHeader>
      <ModalBody className="gap-3">
        {/* Form Controls */}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>取消</Button>
        <Button variant="primary" onClick={onSave}>保存变更</Button>
      </ModalFooter>
    </Modal>
  )
}
```
