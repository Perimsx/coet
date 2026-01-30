import { authFetch } from './api.js';
import { store, setAnniversaries } from './store.js';
import { toggleModal, showConfirm, showToast, escapeHtml } from './utils.js';

export async function fetchAnniversaries() {
    const res = await authFetch('/anniversaries');
    if (res && res.ok) {
        const data = await res.json();
        setAnniversaries(data);
        renderAnniversaries();
    }
}

// Enable category selection for anniversary modal
export function initAnniversaryForm() {
    const parent = document.querySelector('#add-ann-form .category-selector');
    if (!parent) return;

    // Delegate click
    parent.addEventListener('click', (e) => {
        // Find closest label
        const label = e.target.closest('.category-option');
        if (!label) return;

        // Check input
        const input = label.querySelector('input[type="radio"]');
        if (input) {
            input.checked = true;

            // Update UI
            document.querySelectorAll('.category-option').forEach(opt => opt.classList.remove('selected'));
            label.classList.add('selected');
        }
    });
}

// Auto init
document.addEventListener('DOMContentLoaded', () => {
    initAnniversaryForm();
    // Pre-select first
    const first = document.querySelector('.category-option');
    if (first && first.querySelector('input').checked) first.classList.add('selected');
});

function calculateDays(dateStr) {
    const target = new Date(dateStr);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = target - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function calculateYears(dateStr) {
    const start = new Date(dateStr);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    const m = now.getMonth() - start.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < start.getDate())) {
        return years - 1;
    }
    return years;
}

export function renderAnniversaries() {
    const container = document.getElementById('anniversary-list');
    if (!container) return;
    container.innerHTML = '';

    const sorted = [...store.anniversaries].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return calculateDays(a.date) - calculateDays(b.date);
    });

    if (sorted.length === 0) {
        container.innerHTML = '<div style="color:#bdc3c7; text-align:center; padding:10px;">暂无倒计时</div>';
        return;
    }

    const pinned = sorted.filter(a => a.pinned);
    const unpinned = sorted.filter(a => !a.pinned);

    pinned.forEach(ann => container.appendChild(createAnnItem(ann)));

    const unpinnedLimit = 3;
    const hasMoreUnpinned = unpinned.length > unpinnedLimit;

    const unpinnedListWrapper = document.createElement('div');
    unpinnedListWrapper.className = 'widget-foldable';

    unpinned.slice(0, unpinnedLimit).forEach(ann => {
        unpinnedListWrapper.appendChild(createAnnItem(ann));
    });
    container.appendChild(unpinnedListWrapper);

    if (hasMoreUnpinned) {
        const remainingListWrapper = document.createElement('div');
        remainingListWrapper.className = 'widget-foldable collapsed-hidden';
        remainingListWrapper.style.marginTop = '4px';

        unpinned.slice(unpinnedLimit).forEach(ann => {
            remainingListWrapper.appendChild(createAnnItem(ann));
        });

        const btn = document.createElement('button');
        btn.className = 'widget-toggle-btn';
        btn.innerHTML = `更多 (${unpinned.length - unpinnedLimit}) <i class="fas fa-chevron-down"></i>`;
        btn.style.display = 'flex';
        btn.style.marginTop = '4px';
        btn.onclick = () => {
            const isCollapsed = remainingListWrapper.classList.contains('collapsed-hidden');
            if (isCollapsed) {
                remainingListWrapper.classList.remove('collapsed-hidden');
                btn.innerHTML = `收起 <i class="fas fa-chevron-up"></i>`;
            } else {
                remainingListWrapper.classList.add('collapsed-hidden');
                btn.innerHTML = `更多 (${unpinned.length - unpinnedLimit}) <i class="fas fa-chevron-down"></i>`;
            }
        };
        container.appendChild(btn);
        container.appendChild(remainingListWrapper);
    }
}

function createAnnItem(ann) {
    const days = calculateDays(ann.date);
    const years = calculateYears(ann.date);
    const isToday = days === 0;

    // Category config
    const icons = { birthday: 'fa-birthday-cake', love: 'fa-heart', work: 'fa-briefcase', study: 'fa-graduation-cap', festival: 'fa-glass-cheers', other: 'fa-bookmark' };
    const colors = { birthday: '#FF6B9D', love: '#FF5757', work: '#5B8CFF', study: '#4ADE80', festival: '#FF9F43', other: '#94A3B8' };

    const category = ann.category || 'other';
    const iconClass = icons[category] || 'fa-bookmark';
    const iconColor = colors[category] || '#747d8c';

    const div = document.createElement('div');
    div.className = `ann-item ${ann.pinned ? 'pinned' : ''}`;
    div.innerHTML = `
        <div class="ann-icon" style="color:${iconColor}"><i class="fas ${iconClass}"></i></div>
        <div class="ann-content">
            <div class="ann-title">${escapeHtml(ann.title)}${isToday ? '<span class="ann-badge today">今天</span>' : ''}</div>
            <div class="ann-date">${ann.date}${years > 0 ? ` · 第${years}年` : ''}</div>
        </div>
        <div class="ann-days">
            <div class="ann-days-num">${Math.abs(days)}</div>
            <div class="ann-days-label">${days >= 0 ? '天后' : '天前'}</div>
        </div>
        <div class="ann-actions">
            <i class="fas fa-thumbtack ann-action-btn ${ann.pinned ? 'pinned' : ''}" data-id="${ann.id}" data-action="pin" title="${ann.pinned ? '取消置顶' : '置顶'}"></i>
            <i class="fas fa-trash ann-action-btn" data-id="${ann.id}" data-action="delete" title="删除"></i>
        </div>
    `;

    // Use delegation or individual listeners
    const pinBtn = div.querySelector('[data-action="pin"]');
    const delBtn = div.querySelector('[data-action="delete"]');

    pinBtn.addEventListener('click', () => togglePinAnn(ann.id));
    delBtn.addEventListener('click', () => deleteAnniversary(ann.id));

    return div;
}

export async function togglePinAnn(id) {
    await authFetch(`/anniversaries/${id}/pin`, { method: 'PUT' });
    fetchAnniversaries();
}

export async function deleteAnniversary(id) {
    if (!(await showConfirm({ message: '确定删除?', type: 'danger' }))) return;
    const res = await authFetch(`/anniversaries/${id}`, { method: 'DELETE' });
    if (res && res.ok) {
        showToast('删除成功', 'success');
        fetchAnniversaries();
    } else {
        showToast('删除失败', 'error');
    }
}

export async function submitAnniversary(e) {
    e.preventDefault();
    const form = e.target;
    if (!form.date.value) return;

    const selectedCategory = document.querySelector('input[name="category"]:checked')?.value || 'other';

    const postData = {
        title: form.title.value,
        date: form.date.value,
        category: selectedCategory
    };

    const res = await authFetch('/anniversaries', {
        method: 'POST',
        body: JSON.stringify(postData)
    });
    if (res && res.ok) {
        toggleModal('add-ann-modal');
        form.reset();
        document.querySelectorAll('.category-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector('input[name="category"][value="birthday"]').parentElement.classList.add('selected');
        fetchAnniversaries();
    }
}
