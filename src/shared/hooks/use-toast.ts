'use client'

type ToastType = 'info' | 'success' | 'warning' | 'error' | 'welcome'

let toastTimer: ReturnType<typeof setTimeout> | null = null

const toastIcons: Record<ToastType, string> = {
  success: '<svg viewBox="0 0 24 24" fill="none" class="animated-icon"><defs><linearGradient id="ct-grad-success" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#059669"/></linearGradient></defs><path d="M4 12.5l5.5 5.5L20 7" stroke="url(#ct-grad-success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="check-draw"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" class="animated-icon"><defs><linearGradient id="ct-grad-error" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fb7185"/><stop offset="100%" stop-color="#e11d48"/></linearGradient></defs><path d="M6 6l12 12M18 6L6 18" stroke="url(#ct-grad-error)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="cross-draw"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" class="animated-icon warning-shake"><defs><linearGradient id="ct-grad-warning" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#ea580c"/></linearGradient></defs><path d="M12 3L2 21h20L12 3z" stroke="url(#ct-grad-warning)" stroke-width="2.5" stroke-linejoin="round" fill="url(#ct-grad-warning)" fill-opacity="0.15"/><path d="M12 10v4" stroke="url(#ct-grad-warning)" stroke-width="2.5" stroke-linecap="round"/><circle cx="12" cy="17.5" r="1.2" fill="url(#ct-grad-warning)"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" class="animated-icon info-bounce"><defs><linearGradient id="ct-grad-info" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#2563eb"/></linearGradient></defs><path d="M12 11v6" stroke="url(#ct-grad-info)" stroke-width="2.5" stroke-linecap="round"/><circle cx="12" cy="7" r="1.2" fill="url(#ct-grad-info)"/></svg>',
  welcome: `<svg viewBox="0 0 24 24" fill="none" class="animated-icon waving-hand"><path d="M18.5 11c-.6 0-1.1.2-1.5.5V11c0-.8-.7-1.5-1.5-1.5-.2 0-.4.1-.6.1-.3-.6-.9-1.1-1.6-1.1-.3 0-.5.1-.7.2V5.5c0-.8-.7-1.5-1.5-1.5s-1.5.7-1.5 1.5V15l-1.6-1.5c-.7-.7-1.8-.7-2.5 0-.4.4-.6.9-.6 1.4s.2 1 .5 1.3l2.8 3c.7.8 1.8 1.3 2.9 1.3h5.3c1.9 0 3.5-1.5 3.5-3.5v-2.1c.1-.8-.5-1.4-1.1-1.4z" fill="#f59e0b" stroke="#d97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
}

const TOAST_CSS = `
/* 高级 Apple 玻璃质感 Toast（含纹理） */
:root {
  --toast-ring: rgba(0, 0, 0, 0.05);
}
.dark :root, [data-theme="dark"] :root {
  --toast-ring: rgba(255, 255, 255, 0.1);
}

.custom-toast {
  position: fixed;
  top: 64px;
  left: 50%;
  transform: translateX(-50%) translateY(-15px) scale(0.96);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 8px 10px;
  border-radius: 16px;
  
  /* 高级纹理 + 玻璃拟态（浅色版本） */
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 
    0 8px 24px -6px rgba(0, 0, 0, 0.08),
    0 2px 8px -2px rgba(0, 0, 0, 0.04);
  
  color: #1d1d1f;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  z-index: 999999;
  overflow: hidden;
  
  /* 保持单行显示 */
  white-space: nowrap;
  
  transition: 
    opacity 0.4s cubic-bezier(0.19, 1, 0.22, 1),
    transform 0.4s cubic-bezier(0.23, 1, 0.32, 1),
    visibility 0.4s;
}

/* 纹理叠层 */
.custom-toast::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.03;
  mix-blend-mode: overlay;
  pointer-events: none;
}

.custom-toast.show {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0) scale(1);
}

.dark .custom-toast, [data-theme="dark"] .custom-toast {
  background: rgba(32, 32, 35, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 12px 32px -8px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.95);
}

/* 图标与进度条 */
.custom-toast-icon-wrapper {
  position: relative;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.custom-toast-icon {
  width: 17px;
  height: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

/* 底部进度线 */
.custom-toast-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: rgba(0, 0, 0, 0.05);
  width: 100%;
  transform-origin: left;
}

.custom-toast.show .custom-toast-progress-bar {
  animation: ct-progress linear forwards;
}

@keyframes ct-progress {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

/* 渐变配色 */
.custom-toast-success .custom-toast-progress-bar { background: #34c759; }
.custom-toast-error .custom-toast-progress-bar { background: #ff3b30; }
.custom-toast-warning .custom-toast-progress-bar { background: #ff9500; }
.custom-toast-info .custom-toast-progress-bar { background: #007aff; }

/* 图标动画 */
.custom-toast.show .animated-icon {
  animation: ct-icon-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes ct-icon-in {
  0% { transform: scale(0) rotate(-45deg); opacity: 0; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

.waving-hand {
  transform-origin: 70% 70%;
  animation: ct-wave 1.5s infinite ease-in-out;
}

@keyframes ct-wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(15deg); }
  50% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.custom-toast-content {
  flex: 1;
  line-height: 1;
}

.custom-toast:active {
  transform: translateX(-50%) scale(0.98);
  opacity: 0.9;
}

@media(max-width:768px){
  .custom-toast {
    top: 56px;
    padding: 7px 14px 7px 9px;
    font-size: 13px;
    border-radius: 14px;
    max-width: 90vw;
  }
  .custom-toast-icon-wrapper {
    width: 22px;
    height: 22px;
  }
}
`

function injectToastCSS() {
  if (typeof document === 'undefined') return
  const existing = document.querySelector<HTMLStyleElement>('style[data-custom-toast]')
  if (existing) {
    if (existing.textContent !== TOAST_CSS) existing.textContent = TOAST_CSS
    return
  }

  const style = document.createElement('style')
  style.setAttribute('data-custom-toast', '')
  style.textContent = TOAST_CSS
  document.head.appendChild(style)
}

function ensureToastEl(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  injectToastCSS()
  let toast = document.getElementById('custom-toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'custom-toast'
    toast.className = 'custom-toast'
    document.body.appendChild(toast)
  }
  return toast
}

interface ToastFn {
  (message: string, type?: ToastType, duration?: number | null): HTMLElement | null
  success: (msg: string, duration?: number) => HTMLElement | null
  error: (msg: string, duration?: number) => HTMLElement | null
  warning: (msg: string, duration?: number) => HTMLElement | null
  info: (msg: string, duration?: number) => HTMLElement | null
  welcome: (msg: string, duration?: number) => HTMLElement | null
}

export const toast = ((message: string, type: ToastType = 'info', duration: number | null = null) => {
  const el = ensureToastEl()
  if (!el) return null

  el.className = `custom-toast custom-toast-${type}`
  const icon = toastIcons[type] || toastIcons.info
  const actual = duration !== null ? duration : 3000

  el.innerHTML = `
    <div class="custom-toast-icon-wrapper">
      <div class="custom-toast-icon">${icon}</div>
    </div>
    <div class="custom-toast-content">${message}</div>
    ${actual > 0 && type === 'welcome' ? '<div class="custom-toast-progress-bar"></div>' : ''}
  `

  const progressBar = el.querySelector<HTMLElement>('.custom-toast-progress-bar')
  if (progressBar && actual > 0) {
    progressBar.style.animationDuration = `${actual}ms`
  }

  if (toastTimer) clearTimeout(toastTimer)
  
  // 强制重排
  el.classList.remove('show')
  void el.offsetWidth 

  requestAnimationFrame(() => el.classList.add('show'))

  if (actual > 0) {
    toastTimer = setTimeout(() => el.classList.remove('show'), actual)
  }

  return el
}) as ToastFn

// 挂载便捷方法以兼容 sonner 等库的调用习惯
toast.success = (msg: string, duration?: number) => toast(msg, 'success', duration)
toast.error = (msg: string, duration?: number) => toast(msg, 'error', duration)
toast.warning = (msg: string, duration?: number) => toast(msg, 'warning', duration)
toast.info = (msg: string, duration?: number) => toast(msg, 'info', duration)
toast.welcome = (msg: string, duration?: number) => toast(msg, 'welcome', duration)

export const useToast = () => {
  return { 
    toast,
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
    welcome: toast.welcome
  }
}

