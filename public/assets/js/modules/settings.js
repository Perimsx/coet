import { authFetch } from './api.js';
import { store, setSettings } from './store.js';
import { $, toggleModal, showToast } from './utils.js';
import { renderFeed } from './talks.js';

export async function fetchSettings() {
    try {
        const res = await fetch('/api/settings'); // Public read
        if (res && res.ok) {
            const data = await res.json();
            setSettings(data);
            applySettings();
            initSettings(); // Initialize form values
        }
    } catch (e) { console.error(e); }
}

export function initSettings() {
    const s = store.settings;
    const form = document.querySelector('#settings-form');
    if (!form || !s) return;

    if (form.siteTitle) form.siteTitle.value = s.siteTitle || '';
    if (form.siteFavicon) form.siteFavicon.value = s.siteFavicon || '';
    if (form.siteIcon) form.siteIcon.value = s.siteIcon || '';
    if (form.userNickname) form.userNickname.value = s.userNickname || '';
    if (form.userAvatar) form.userAvatar.value = s.userAvatar || '';
    if (form.userBio) form.userBio.value = s.userBio || '';
    if (form.badgeIcon) form.badgeIcon.value = s.badgeIcon || '';
    if (form.badgeColor) form.badgeColor.value = s.badgeColor || '#000000';

    updateSettingsPreview();
}

export async function saveSettings(e) {
    if (e) e.preventDefault();
    const form = document.querySelector('#settings-form');
    if (!form) return;

    const newSettings = {
        siteTitle: form.siteTitle.value,
        siteFavicon: form.siteFavicon.value,
        siteIcon: form.siteIcon.value,
        userNickname: form.userNickname.value,
        userAvatar: form.userAvatar.value,
        userBio: form.userBio.value,
        badgeIcon: form.badgeIcon.value,
        badgeColor: form.badgeColor.value
    };

    const res = await authFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify(newSettings)
    });

    if (res && res.ok) {
        setSettings(newSettings);
        applySettings();
        toggleModal('settings-modal');
        showToast('设置已保存', 'success');
    } else {
        showToast('保存失败', 'error');
    }
}

export function updateSettingsPreview() {
    const form = document.querySelector('#settings-form');
    if (!form) return;

    const prevAvatar = document.getElementById('prevAvatar');
    const prevName = document.getElementById('prevName');
    const prevBadge = document.getElementById('prevBadge');

    if (prevAvatar) prevAvatar.src = form.userAvatar.value || 'https://via.placeholder.com/150';
    if (prevName) prevName.textContent = form.userNickname.value || 'User';

    if (prevBadge) {
        prevBadge.className = '';
        const iconClass = form.badgeIcon.value || 'fas fa-check-circle';
        // Handle if user puts full class or just icon name
        prevBadge.className = iconClass.includes('fa') || iconClass.includes('ri-') ? iconClass : `fas ${iconClass}`;
        prevBadge.style.color = form.badgeColor.value || '#0984e3';
    }
}

export function selectBadge(icon, color, el) {
    const form = document.querySelector('#settings-form');
    if (!form) return;

    form.badgeIcon.value = icon;
    form.badgeColor.value = color;
    updateSettingsPreview();

    // Highlight selected
    document.querySelectorAll('.badge-preset').forEach(b => b.classList.remove('selected'));
    if (el) el.classList.add('selected');
}

export function applySettings() {
    const s = store.settings;
    if (!s) return;

    document.title = s.siteTitle || "我的空间";
    const logoEl = document.querySelector('.logo');
    if (logoEl) logoEl.innerHTML = `<i class="${s.siteIcon || 'fas fa-meteor'}"></i> ${s.siteTitle || '我的空间'}`;

    // Apply Favicon
    if (s.siteFavicon) {
        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
            link = document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            document.head.appendChild(link);
        }
        link.href = s.siteFavicon;
    }

    store.userProfile.name = s.userNickname || "Chen";
    store.userProfile.avatar = s.userAvatar || store.userProfile.avatar;
    store.userProfile.badgeIcon = s.badgeIcon || "fas fa-check-circle";
    store.userProfile.badgeColor = s.badgeColor || "#0984e3";

    // Update navbar user profile widget
    updateNavUserProfile();

    // Refresh feed to update user info on cards
    renderFeed();
}

function updateNavUserProfile() {
    const navAvatar = document.getElementById('navUserAvatar');
    const navName = document.getElementById('navUserName');
    const navBadge = document.getElementById('navUserBadge');

    if (navAvatar) navAvatar.src = store.userProfile.avatar;
    if (navName) navName.textContent = store.userProfile.name;
    if (navBadge) {
        navBadge.innerHTML = `<i class="${store.userProfile.badgeIcon}"></i>`;
        navBadge.style.color = store.userProfile.badgeColor;
    }
}
