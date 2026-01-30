export function $(s) { return document.querySelector(s); }
export function $$(s) { return document.querySelectorAll(s); }

export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function toggleModal(id) {
    const el = document.getElementById(id);
    const overlay = document.getElementById('modalOverlay');

    if (!el) return;

    if (el.classList.contains('show')) {
        el.classList.remove('show');
        overlay?.classList.remove('show');
    } else {
        // Close others
        document.querySelectorAll('.modal-box.show').forEach(m => m.classList.remove('show'));
        el.classList.add('show');
        overlay?.classList.add('show');
    }
}

export function closeAllModals() {
    document.querySelectorAll('.modal-box.show').forEach(m => m.classList.remove('show'));
    document.getElementById('modalOverlay')?.classList.remove('show');
}

/**
 * Toast Notification System
 */
export function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container'; // Ensures class matches CSS
        document.body.appendChild(container);
    } else {
        // Ensure class is correct if element already exists (e.g. from old JS)
        if (container.className !== 'toast-container') {
            container.className = 'toast-container';
        }
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const typeConfig = {
        success: { icon: 'fa-check-circle' },
        error: { icon: 'fa-times-circle' },
        warning: { icon: 'fa-exclamation-circle' },
        info: { icon: 'fa-info-circle' }
    };

    const config = typeConfig[type] || typeConfig.info;

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${config.icon}"></i>
        </div>
        <span class="toast-message">${escapeHtml(message)}</span>
    `;

    // const closeBtn = toast.querySelector('.toast-close');
    // closeBtn.addEventListener('click', () => removeToast(toast));

    container.appendChild(toast);

    if (duration > 0) {
        setTimeout(() => removeToast(toast), duration);
    }

    return toast;
}

function removeToast(toast) {
    if (!toast || !toast.parentElement) return;
    toast.classList.add('removing');
    setTimeout(() => {
        toast.remove();
        const container = document.getElementById('toast-container');
        if (container && container.children.length === 0) {
            container.remove();
        }
    }, 300);
}

/**
 * Confirm Dialog Component
 */
export function showConfirm(options) {
    const {
        title = '确认',
        message = '确定要执行此操作吗？',
        confirmText = '确定',
        cancelText = '取消',
        type = 'primary'
    } = options || {};

    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';

        const dialog = document.createElement('div');
        dialog.className = `confirm-dialog ${type === 'danger' ? 'confirm-danger' : ''}`;

        dialog.innerHTML = `
            <div class="confirm-header">
                <div class="confirm-icon">
                    <i class="fas ${type === 'danger' ? 'fa-exclamation-triangle' : 'fa-question-circle'}"></i>
                </div>
                <h3 class="confirm-title">${escapeHtml(title)}</h3>
            </div>
            <div class="confirm-body">
                <p class="confirm-message">${escapeHtml(message)}</p>
            </div>
            <div class="confirm-footer">
                <button class="confirm-btn-cancel">${escapeHtml(cancelText)}</button>
                <button class="confirm-btn-confirm">${escapeHtml(confirmText)}</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Animation
        setTimeout(() => overlay.classList.add('show'), 10);

        const close = (result) => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                resolve(result);
            }, 300);
        };

        const confirmBtn = dialog.querySelector('.confirm-btn-confirm');
        const cancelBtn = dialog.querySelector('.confirm-btn-cancel');

        confirmBtn.addEventListener('click', () => close(true));
        cancelBtn.addEventListener('click', () => close(false));
        dialog.addEventListener('click', (e) => e.stopPropagation());
        overlay.addEventListener('click', () => close(false));

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                close(false);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}
