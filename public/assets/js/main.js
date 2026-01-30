/**
 * Main Entry Point (Refactored)
 * Imports and orchestrates modules.
 */
import { checkAuth } from './modules/auth.js';
import { fetchSettings, applySettings, saveSettings, updateSettingsPreview, selectBadge } from './modules/settings.js';
import { fetchTalks, publishTalk, deleteTalk, togglePin, toggleFavorite, clearFilter, initPublisher, initMarkdownToggle } from './modules/talks.js';
import { fetchTodos, submitTodo, toggleTodo, deleteTodo } from './modules/todos.js';
import { fetchAnniversaries, submitAnniversary, deleteAnniversary, togglePinAnn } from './modules/anniversaries.js';
import { fetchStats, fetchTags } from './modules/stats.js';
import { renderCalendar } from './modules/calendar.js';
import { toggleModal, closeAllModals, showToast, $ } from './modules/utils.js';
import { logout } from './modules/auth.js';
import { backupData, importData } from './modules/backup.js';

// Expose necessary functions to global window for HTML onclick attributes
// This is a temporary bridge until we fully move to event listeners
window.toggleModal = toggleModal;
window.closeAllModals = closeAllModals;
window.logout = logout;
window.backupData = backupData;
window.importData = importData;
window.publishTalk = publishTalk;
window.submitTodo = submitTodo;
window.submitAnniversary = submitAnniversary;
window.toggleBackupDropdown = () => {
    const el = document.getElementById('backupMenu');
    if (el) el.classList.toggle('show');
};
window.toggleDarkMode = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
};
window.openSettings = () => toggleModal('settings-modal');
window.saveSettings = saveSettings;
window.updateSettingsPreview = updateSettingsPreview;
window.selectBadge = selectBadge;

// Init
document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();

    // Theme Init
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

    // Toggle Tools
    const toggleBtn = document.getElementById('toggleToolsBtn');
    const toolsPanel = document.getElementById('publisherTools');
    if (toggleBtn && toolsPanel) {
        toggleBtn.addEventListener('click', () => {
            toolsPanel.classList.toggle('show');
            toggleBtn.classList.toggle('active');
        });
    }

    // Load Data
    await Promise.all([
        fetchSettings(),
        fetchTalks(),
        fetchTodos(),
        fetchAnniversaries(),
        fetchStats(),
        fetchTags()
    ]);

    // Init Tools
    initPublisher();
    initMarkdownToggle();

    // Calendar needs talks data to be ready
    renderCalendar();

    // Global Event Listeners for some interactive elements
    document.addEventListener('filter-tag', (e) => {
        if (e.detail) {
            import('./modules/talks.js').then(module => {
                module.filterByTag(e.detail);
                document.getElementById('feed').scrollIntoView({ behavior: 'smooth' });
            });
        }
    });

    document.addEventListener('filter-date', (e) => {
        if (e.detail) {
            import('./modules/talks.js').then(module => {
                module.filterByDate(e.detail);
                document.getElementById('feed').scrollIntoView({ behavior: 'smooth' });
            });
        }
    });

    // Set up Update Time Interval for Nav
    updateNavDate();
});

// We need to re-implement updateNavDate here or in a view module
function updateNavDate() {
    const box = document.getElementById('navDate');
    if (!box) return;

    // Cache DOM elements and state
    let cachedElements = null;
    let lastSeconds = -1;
    let lastMinutes = -1;
    let lastHour = -1;
    let lastGreeting = '';
    let lastDateStr = '';
    let lastLunarStr = '';
    let lunarCache = { date: null, lunar: null, festivals: null };

    // Initialize DOM structure with separate updateable elements
    const initDOM = () => {
        box.innerHTML = `
            <div class="nav-time-wrapper">
                <span class="nav-time-hm"></span>
                <span class="nav-time-s"></span>
            </div>
            <div class="nav-date-wrapper">
                <span class="nav-date-row">
                    <span class="nav-greeting"></span>
                    <span class="sep"></span>
                    <span class="nav-date-main"></span>
                    <span class="sep sep-lunar"></span>
                    <span class="nav-lunar"></span>
                </span>
            </div>
        `;

        // Cache element references
        cachedElements = {
            timeHm: box.querySelector('.nav-time-hm'),
            timeS: box.querySelector('.nav-time-s'),
            greeting: box.querySelector('.nav-greeting'),
            dateMain: box.querySelector('.nav-date-main'),
            lunar: box.querySelector('.nav-lunar'),
            dateWrapper: box.querySelector('.nav-date-wrapper'),
            sepLunar: box.querySelector('.sep-lunar')
        };
    };

    // Get greeting based on hour
    const getGreeting = (hours) => {
        if (hours >= 5 && hours < 11) return '早上好';
        if (hours >= 11 && hours < 13) return '中午好';
        if (hours >= 13 && hours < 18) return '下午好';
        if (hours >= 18 && hours < 23) return '晚上好';
        return '深夜好';
    };

    // Get lunar date with caching (cache expires daily)
    const getLunarDate = (now) => {
        const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

        if (lunarCache.date === todayKey) {
            return lunarCache;
        }

        let lunarStr = '';
        let isHoliday = false;

        if (typeof Lunar !== 'undefined') {
            const lunar = Lunar.fromDate(now);
            lunarStr = `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
            const festivals = lunar.getFestivals();
            if (festivals.length > 0) {
                lunarStr = festivals[0];
                isHoliday = true;
            }

            lunarCache = {
                date: todayKey,
                lunar,
                lunarStr,
                isHoliday
            };
        }

        return lunarCache;
    };

    // Update with visual feedback class
    const updateWithPulse = (element, newValue, className = 'pulse') => {
        if (element.textContent !== newValue) {
            element.textContent = newValue;
            element.classList.remove(className);
            void element.offsetWidth; // Trigger reflow for animation restart
            element.classList.add(className);
        }
    };

    const tick = () => {
        if (!cachedElements) {
            initDOM();
        }

        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // Update seconds - every second with smooth transition
        const secondsStr = seconds.toString().padStart(2, '0');
        if (seconds !== lastSeconds) {
            updateWithPulse(cachedElements.timeS, `:${secondsStr}`, 'time-pulse');
            lastSeconds = seconds;
        }

        // Update time (HH:MM) - only when minutes change
        if (minutes !== lastMinutes) {
            const hmStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            cachedElements.timeHm.textContent = hmStr;
            lastMinutes = minutes;
        }

        // Update greeting - only when hour changes
        const greeting = getGreeting(hours);
        if (greeting !== lastGreeting) {
            updateWithPulse(cachedElements.greeting, greeting, 'greeting-fade');
            lastGreeting = greeting;
        }

        // Update date - only when day changes
        const dateStr = now.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short' });
        if (dateStr !== lastDateStr) {
            cachedElements.dateMain.textContent = dateStr;
            lastDateStr = dateStr;

            // Update weekend indicator
            const isWeekend = (now.getDay() === 0 || now.getDay() === 6);
            cachedElements.dateWrapper.classList.toggle('is-weekend', isWeekend);
        }

        // Update lunar date - only when day changes (cached)
        const lunarData = getLunarDate(now);
        if (lunarData.lunarStr && lunarData.lunarStr !== lastLunarStr) {
            cachedElements.lunar.textContent = lunarData.lunarStr;
            cachedElements.lunar.classList.toggle('is-holiday', lunarData.isHoliday || false);
            cachedElements.sepLunar.style.display = lunarData.lunarStr ? 'inline' : 'none';
            cachedElements.lunar.style.display = lunarData.lunarStr ? 'inline' : 'none';
            lastLunarStr = lunarData.lunarStr;
        }
    };

    // Add CSS animations for smooth transitions
    const style = document.createElement('style');
    style.textContent = `
        .nav-time-s.time-pulse {
            animation: timePulse 0.3s ease-out;
        }
        @keyframes timePulse {
            0% { opacity: 0.6; transform: scale(0.95); }
            50% { opacity: 1; transform: scale(1.05); }
            100% { opacity: 1; transform: scale(1); }
        }
        .nav-greeting.greeting-fade {
            animation: greetingFade 0.5s ease-out;
        }
        @keyframes greetingFade {
            0% { opacity: 0; transform: translateY(-5px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .nav-lunar.is-holiday {
            color: #e74c3c;
            font-weight: 600;
        }
        .nav-date-wrapper.is-weekend .nav-date-main {
            color: #3498db;
        }
    `;
    document.head.appendChild(style);

    tick(); // Initial call
    setInterval(tick, 1000);
}
