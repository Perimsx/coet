/**
 * Backup Module
 * Handles data export and import functionality
 */

// Token helper - get from localStorage
const getToken = () => localStorage.getItem('token');

// Authenticated fetch wrapper
const authFetch = async (url, options = {}) => {
    const token = getToken();
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        throw new Error('Unauthorized');
    }

    return response;
};

/**
 * Export/Backup data
 */
export async function backupData() {
    try {
        // Show loading toast
        showToast('正在导出数据...', 'info');

        const response = await authFetch('/api/backup/export');

        if (!response.ok) {
            throw new Error(`导出失败: HTTP ${response.status}`);
        }

        // Get the blob
        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Generate filename with timestamp
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .slice(0, 19);
        a.download = `coet-backup-${timestamp}.json`;

        document.body.appendChild(a);
        a.click();

        // Cleanup
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showToast('备份导出成功！', 'success');
    } catch (error) {
        console.error('Backup error:', error);
        showToast('导出失败: ' + error.message, 'error');
    }
}

/**
 * Import/Restore data
 */
export async function importData(input) {
    const file = input.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
        showToast('请选择 JSON 格式的备份文件', 'error');
        input.value = '';
        return;
    }

    // Validate file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        showToast(`文件过大 (${sizeMB}MB)，最大支持 10MB`, 'error');
        input.value = '';
        return;
    }

    // Confirm before importing
    const confirmed = confirm(
        '⚠️ 重要提示：\n\n' +
        '导入操作将覆盖当前所有数据（包括动态、待办、纪念日、设置等）。\n\n' +
        '建议先导出当前数据作为备份。\n\n' +
        '是否继续导入？'
    );

    if (!confirmed) {
        input.value = '';
        return;
    }

    try {
        showToast('正在导入数据，请稍候...', 'info');

        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        const response = await authFetch('/api/backup/import', {
            method: 'POST',
            body: formData
        });

        const contentType = response.headers.get('content-type');
        let result = {};
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        }

        if (!response.ok) {
            throw new Error(result.message || `HTTP ${response.status}`);
        }

        showToast('✅ 导入成功！页面即将刷新...', 'success');

        // Reload page after delay
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    } catch (error) {
        console.error('Import error:', error);
        showToast('导入失败: ' + error.message, 'error');
    } finally {
        input.value = '';
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Add styles
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        background: type === 'success' ? '#10b981' :
                    type === 'error' ? '#ef4444' :
                    type === 'info' ? '#3b82f6' : '#6b7280',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: '10000',
        opacity: '0',
        transform: 'translateY(-20px)',
        transition: 'all 0.3s ease'
    });

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
