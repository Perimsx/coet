"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/shared/utils/utils";
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
  DatePicker as HeroDatePicker,
} from "@heroui/react";

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
};

export function Switch({
  children,
  checked,
  isSelected,
  onChange,
  isDisabled,
  size = "md",
  className = "",
  description,
  "aria-label": ariaLabel,
  ...props
}: {
  children?: React.ReactNode;
  checked?: boolean;
  isSelected?: boolean;
  onChange?: (checked: boolean) => void;
  isDisabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  description?: React.ReactNode;
  "aria-label"?: string;
  [key: string]: any;
}) {
  const active = checked ?? isSelected;
  const labelText =
    ariaLabel || (typeof children === "string" ? children : "开关");
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
  );
}

export function Checkbox({
  children,
  checked = false,
  onChange,
  disabled = false,
  className = "",
  "aria-label": ariaLabel,
}: {
  children?: React.ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const accessibleLabel =
    ariaLabel || (typeof children === "string" ? children : "复选框");
  return (
    <HeroCheckbox
      isSelected={checked}
      isDisabled={disabled}
      onChange={onChange}
      aria-label={accessibleLabel}
      className={`inline-flex items-center gap-2 cursor-pointer ${className}`}
    >
      <HeroCheckbox.Control className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-300 dark:border-zinc-700 transition-colors data-[selected=true]:bg-primary data-[selected=true]:border-primary">
        <HeroCheckbox.Indicator className="h-3 w-3 text-white shrink-0" />
      </HeroCheckbox.Control>
      {children && (
        <span className="text-xs text-zinc-700 dark:text-zinc-300">
          {children}
        </span>
      )}
    </HeroCheckbox>
  );
}

export function useDisclosure(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((value) => !value), []);
  return {
    isOpen,
    onOpen,
    onClose,
    toggle,
  };
}

export function Button({
  children,
  variant = "primary",
  size = "sm",
  isIconOnly = false,
  isDisabled,
  isLoading,
  className = "",
  onClick,
  ...props
}: any) {
  const baseClasses =
    "inline-flex flex-row items-center justify-center font-medium cursor-pointer transition-all disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

  const iconOnlyClasses = isIconOnly
    ? size === "xs"
      ? "h-7 w-7 p-0 rounded-md shrink-0"
      : size === "sm"
        ? "h-8 w-8 p-0 rounded-lg shrink-0"
        : size === "lg"
          ? "h-10 w-10 p-0 rounded-lg shrink-0"
          : "h-8 w-8 p-0 rounded-lg shrink-0"
    : size === "xs"
      ? "h-7 px-2 text-[11px] gap-1 rounded-md"
      : size === "sm"
        ? "h-8 px-2.5 text-xs gap-1.5 rounded-lg"
        : size === "lg"
          ? "h-10 px-4 text-sm gap-2 rounded-lg"
          : "h-9 px-3 text-xs gap-1.5 rounded-lg";

  const variantClasses =
    variant === "primary" || variant === "solid"
      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 shadow-xs"
      : variant === "secondary" || variant === "outline" || variant === "flat"
        ? "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 active:scale-95 shadow-2xs"
        : variant === "danger"
          ? "bg-rose-600 text-white hover:bg-rose-700 active:scale-95 shadow-xs"
          : "bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60";

  return (
    <HeroButton
      size={size}
      isDisabled={isDisabled || isLoading}
      isPending={isLoading}
      onClick={onClick}
      className={cn(baseClasses, iconOnlyClasses, variantClasses, className)}
      {...props}
    >
      {children}
    </HeroButton>
  );
}

export { InputGroup, TextField, Label };

export function Input({
  label,
  className = "",
  isDisabled,
  placeholder,
  value,
  onChange,
  required,
  prefix,
  suffix,
  variant,
  "aria-label": ariaLabel,
  ...props
}: any) {
  const accessibleLabel = ariaLabel || label || placeholder || "输入框";
  return (
    <TextField
      isDisabled={isDisabled}
      isRequired={required}
      aria-label={accessibleLabel}
      fullWidth
    >
      {label && (
        <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5 block">
          {label}
        </Label>
      )}
      <InputGroup
        variant={variant}
        fullWidth
        className="w-full flex flex-row items-center h-8 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xs transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 overflow-hidden"
      >
        {prefix && (
          <InputGroup.Prefix className="flex items-center shrink-0 pl-2.5 pr-1 text-zinc-400 select-none">
            {prefix}
          </InputGroup.Prefix>
        )}
        <InputGroup.Input
          placeholder={placeholder}
          value={value ?? ""}
          onChange={onChange}
          aria-label={accessibleLabel}
          className={`flex-1 min-w-0 h-full pl-1 pr-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 bg-transparent outline-none focus:outline-none focus:ring-0 focus-visible:outline-none border-0 ${className}`}
          {...props}
        />
        {suffix && (
          <InputGroup.Suffix className="flex items-center shrink-0 pr-2.5 pl-1 text-zinc-400 select-none">
            {suffix}
          </InputGroup.Suffix>
        )}
      </InputGroup>
    </TextField>
  );
}

export function TextArea({
  label,
  className = "",
  isDisabled,
  placeholder,
  value,
  onChange,
  rows = 5,
  required,
  prefix,
  suffix,
  variant,
  "aria-label": ariaLabel,
  ...props
}: any) {
  const accessibleLabel = ariaLabel || label || placeholder || "多行文本框";
  return (
    <TextField
      isDisabled={isDisabled}
      isRequired={required}
      aria-label={accessibleLabel}
      fullWidth
    >
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
          value={value ?? ""}
          onChange={onChange}
          rows={rows}
          aria-label={accessibleLabel}
          className={`w-full p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 bg-transparent outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 border-0 ${className}`}
          {...props}
        />
        {suffix && <InputGroup.Suffix>{suffix}</InputGroup.Suffix>}
      </InputGroup>
    </TextField>
  );
}

export function Card({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <HeroCard
      className={`border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl shadow-2xs ${className}`}
      {...props}
    >
      {children}
    </HeroCard>
  );
}

export function Chip({
  children,
  color = "default",
  size = "sm",
  className = "",
}: {
  children: React.ReactNode;
  color?:
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "secondary"
    | "accent";
  variant?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <HeroChip
      color={color === "primary" || color === "secondary" ? "accent" : color}
      size={size}
      className={className}
    >
      {children}
    </HeroChip>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <HeroCard.Content>
      <div className={`p-4 ${className}`}>{children}</div>
    </HeroCard.Content>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <HeroCard.Header
      className={`px-4 pt-3.5 pb-2.5 font-bold text-xs border-b border-zinc-100 dark:border-zinc-800/60 flex items-center gap-2 ${className}`}
    >
      {children}
    </HeroCard.Header>
  );
}

export function CardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <HeroCard.Footer className={className}>{children}</HeroCard.Footer>;
}

export function Modal({
  isOpen,
  onClose,
  children,
  size = "md",
}: {
  isOpen: boolean;
  onClose: () => void;
  children:
    | React.ReactNode
    | ((args: { onClose: () => void }) => React.ReactNode);
  size?: "sm" | "md" | "lg" | "2xl";
}) {
  const content =
    typeof children === "function" ? children({ onClose }) : children;
  const modalSize = size === "2xl" ? "lg" : size === "lg" ? "md" : "sm";
  return (
    <HeroModal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <HeroModal.Backdrop variant="blur">
        <HeroModal.Container size={modalSize}>
          <HeroModal.Dialog>{content}</HeroModal.Dialog>
        </HeroModal.Container>
      </HeroModal.Backdrop>
    </HeroModal>
  );
}

export function ModalHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <HeroModal.Header className={className}>{children}</HeroModal.Header>;
}

export function ModalBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <HeroModal.Body className={className}>{children}</HeroModal.Body>;
}

export function ModalFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <HeroModal.Footer className={className}>{children}</HeroModal.Footer>;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "确认删除？",
  description = "此操作无法撤销，请确认是否继续。",
  confirmText = "确认删除",
  confirmVariant = "danger",
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  confirmVariant?: "danger" | "primary";
  isLoading?: boolean;
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
  );
}

export function Select({
  value,
  onChange,
  options = [],
  className = "",
  placeholder,
  "aria-label": ariaLabel,
  ...props
}: {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options?: { value: string; label: string }[];
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
  [key: string]: any;
}) {
  const items = options.length ? options : [];
  const selectedLabel = options.find((opt) => opt.value === value)?.label;
  const accessibleLabel = ariaLabel || placeholder || "下拉选择框";

  return (
    <HeroSelect
      {...props}
      aria-label={accessibleLabel}
      selectedKey={value || undefined}
      onSelectionChange={(key) =>
        onChange?.({
          target: { value: String(key ?? "") },
        } as React.ChangeEvent<HTMLSelectElement>)
      }
      className={`min-w-[130px] ${className}`}
    >
      <HeroSelect.Trigger className="flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 shadow-2xs transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
        <HeroSelect.Value>
          {() => (
            <span className={selectedLabel ? "font-medium" : "text-zinc-400"}>
              {selectedLabel || placeholder || "选择项目"}
            </span>
          )}
        </HeroSelect.Value>
        <HeroSelect.Indicator />
      </HeroSelect.Trigger>
      <HeroSelect.Popover
        placement="bottom start"
        offset={4}
        className="z-[99] min-w-[var(--trigger-width)] w-max max-w-[220px] overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 p-1 text-zinc-900 dark:text-zinc-100 shadow-lg backdrop-blur-md animate-in fade-in-50 zoom-in-95 duration-100"
      >
        <ListBox items={items}>
          {(item: { value: string; label: string }) => (
            <ListBox.Item
              id={item.value}
              textValue={item.label}
              className="relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/80 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-600 dark:data-[selected=true]:bg-blue-950/60 dark:data-[selected=true]:text-blue-400"
            >
              {item.label}
            </ListBox.Item>
          )}
        </ListBox>
      </HeroSelect.Popover>
    </HeroSelect>
  );
}

export function DatePicker({
  label,
  value,
  onChange,
  className = "",
  placeholder = "选择日期与时间...",
  "aria-label": ariaLabel,
}: {
  label?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 解析初始时间
  const parseDate = (val?: string) => {
    if (!val) return new Date();
    const normalized = val.includes("T") ? val : val.replace(" ", "T");
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const initialDate = parseDate(value);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? initialDate : null,
  );
  const [hours, setHours] = useState(initialDate.getHours());
  const [minutes, setMinutes] = useState(initialDate.getMinutes());

  useEffect(() => {
    if (value) {
      const d = parseDate(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setSelectedDate(d);
      setHours(d.getHours());
      setMinutes(d.getMinutes());
    }
  }, [value]);

  // 点击外部自动关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // 计算当月天数与首日是星期几
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((v) => v - 1);
    } else {
      setViewMonth((v) => v - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((v) => v + 1);
    } else {
      setViewMonth((v) => v + 1);
    }
  };

  const emitChange = (d: Date | null, h = hours, m = minutes) => {
    if (!d) {
      if (onChange) onChange({ target: { value: "" } });
      return;
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(h).padStart(2, "0");
    const min = String(m).padStart(2, "0");
    const formatted = `${yyyy}-${mm}-${dd} ${hh}:${min}:00`;
    if (onChange) onChange({ target: { value: formatted } });
  };

  const handleSelectDay = (day: number) => {
    const newD = new Date(viewYear, viewMonth, day);
    setSelectedDate(newD);
    emitChange(newD, hours, minutes);
  };

  const handleToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(now);
    setHours(now.getHours());
    setMinutes(now.getMinutes());
    emitChange(now, now.getHours(), now.getMinutes());
  };

  const handleClear = () => {
    setSelectedDate(null);
    emitChange(null);
  };

  const displayString = value ? value : "";

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5 block">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex flex-row items-center h-8 px-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xs transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none cursor-pointer select-none text-left"
        aria-label={ariaLabel || label || placeholder}
      >
        <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mr-2 shrink-0" />
        <span
          className={`flex-1 text-xs font-mono min-w-0 truncate ${
            displayString
              ? "text-zinc-900 dark:text-zinc-100 font-medium"
              : "text-zinc-400"
          }`}
        >
          {displayString || placeholder}
        </span>
        {displayString && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors mr-1"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* HeroUI 浮动 Popover 卡片 */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-72 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 p-3.5 shadow-xl backdrop-blur-md animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header 导航 */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
              {viewYear}年 {viewMonth + 1}月
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors border-0 outline-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors border-0 outline-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 星期表头 */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-semibold text-zinc-400">
            <span>日</span>
            <span>一</span>
            <span>二</span>
            <span>三</span>
            <span>四</span>
            <span>五</span>
            <span>六</span>
          </div>

          {/* 日历天数网格 */}
          <div className="grid grid-cols-7 gap-1 text-center mb-3">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                selectedDate &&
                selectedDate.getFullYear() === viewYear &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getDate() === day;

              const isToday =
                new Date().getFullYear() === viewYear &&
                new Date().getMonth() === viewMonth &&
                new Date().getDate() === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 mx-auto flex items-center justify-center rounded-lg text-xs font-medium transition-all border-0 outline-none cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white font-bold shadow-2xs"
                      : isToday
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* 时间调节栏 */}
          <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-2.5 mb-3 px-1">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>时间:</span>
            </div>
            <div className="flex items-center gap-1">
              <select
                value={hours}
                onChange={(e) => {
                  const h = Number(e.target.value);
                  setHours(h);
                  if (selectedDate) emitChange(selectedDate, h, minutes);
                }}
                className="bg-zinc-100 dark:bg-zinc-800 border-0 rounded px-1.5 py-0.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span className="text-zinc-400 font-bold">:</span>
              <select
                value={minutes}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  setMinutes(m);
                  if (selectedDate) emitChange(selectedDate, hours, m);
                }}
                className="bg-zinc-100 dark:bg-zinc-800 border-0 rounded px-1.5 py-0.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer"
              >
                {Array.from({ length: 60 }).map((_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-2 px-1">
            <button
              type="button"
              onClick={handleToday}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline border-0 outline-none bg-transparent cursor-pointer"
            >
              今天
            </button>
            <div className="flex items-center gap-2">
              {selectedDate && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 border-0 outline-none bg-transparent cursor-pointer"
                >
                  清空
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors border-0 outline-none cursor-pointer"
              >
                <Check className="w-3 h-3" />
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
