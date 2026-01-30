import { store } from './store.js';
import { showToast, $ } from './utils.js';

let state = {
    year: new Date().getFullYear(),
    month: new Date().getMonth(), // 0-11
    selectedDate: null
};

export function renderCalendar() {
    const container = document.getElementById('calendar-widget');
    if (!container) return;

    // Initial render wrapper if needed, but we will re-render content
    updateCalendarView();
}

function updateCalendarView() {
    const container = document.getElementById('calendar-widget');
    if (!container) return; // Should not happen

    const { year, month } = state;
    const now = new Date();

    // Days in Month logic
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)

    // Month Names
    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

    // Lunar Date Helper (if available)
    const getLunar = (d) => {
        if (window.Lunar) {
            try {
                const lunar = window.Lunar.fromDate(d);
                // Return Festival > Term > DayName
                const festivals = lunar.getFestivals();
                if (festivals.length > 0) return festivals[0];
                const jieQi = lunar.getJieQi();
                if (jieQi) return jieQi;
                return lunar.getDayInChinese();
            } catch (e) { return ''; }
        }
        return '';
    };

    // Calculate Talks Data for this month
    const talksMap = new Map(); // day -> count
    store.talks.forEach(t => {
        const d = new Date(t.createdAt);
        if (d.getFullYear() === year && d.getMonth() === month) {
            const day = d.getDate();
            talksMap.set(day, (talksMap.get(day) || 0) + 1);
        }
    });

    // Calculate Todos Data for this month (by endTime)
    const todosMap = new Map(); // day -> count
    store.todos.forEach(t => {
        if (t.endTime) {
            const d = new Date(t.endTime);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate();
                todosMap.set(day, (todosMap.get(day) || 0) + 1);
            }
        }
    });

    // Calculate Anniversaries Data for this month
    const annMap = new Map(); // day -> count
    store.anniversaries.forEach(a => {
        const d = new Date(a.date);
        // Check if this anniversary occurs in the current month/year
        const annThisYear = new Date(year, d.getMonth(), d.getDate());
        if (d.getMonth() === month) {
            const day = d.getDate();
            annMap.set(day, (annMap.get(day) || 0) + 1);
        }
    });

    let html = `
        <div class="calendar-header">
            <div class="calendar-title-wrapper">
                <span class="calendar-month-year">${year}年 ${monthNames[month]}</span>
                <span class="calendar-lunar-date">${window.Lunar ? getLunar(new Date()) : ''}</span>
            </div>
            <div class="calendar-nav">
                <button class="calendar-nav-btn" id="cal-prev" title="上个月"><i class="fas fa-chevron-left"></i></button>
                <button class="calendar-nav-btn" id="cal-today" title="回到今天"><i class="fas fa-calendar-day"></i></button>
                <button class="calendar-nav-btn" id="cal-next" title="下个月"><i class="fas fa-chevron-right"></i></button>
            </div>
        </div>
        <div class="calendar-legend">
            <span class="legend-item"><span class="legend-dot talk"></span>说说</span>
            <span class="legend-item"><span class="legend-dot todo"></span>待办</span>
            <span class="legend-item"><span class="legend-dot ann"></span>纪念日</span>
        </div>
        <div class="calendar-grid">
            <div class="calendar-day-name">日</div>
            <div class="calendar-day-name">一</div>
            <div class="calendar-day-name">二</div>
            <div class="calendar-day-name">三</div>
            <div class="calendar-day-name">四</div>
            <div class="calendar-day-name">五</div>
            <div class="calendar-day-name">六</div>
    `;

    // Empty slots
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

        const talkCount = talksMap.get(day) || 0;
        const todoCount = todosMap.get(day) || 0;
        const annCount = annMap.get(day) || 0;
        const hasData = talkCount > 0 || todoCount > 0 || annCount > 0;

        // Build tooltip
        let tooltip = '';
        if (talkCount > 0) tooltip += `${talkCount}条说说\n`;
        if (todoCount > 0) tooltip += `${todoCount}个待办\n`;
        if (annCount > 0) tooltip += `${annCount}个纪念日`;
        if (tooltip) tooltip = tooltip.trim();

        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}"
                 data-day="${day}"
                 ${hasData ? `data-tooltip="${escapeHtml(tooltip)}"` : ''}>
                <span>${day}</span>
                <div class="day-indicators">
                    ${talkCount > 0 ? `<span class="dot talk" title="${talkCount}条说说"></span>` : ''}
                    ${todoCount > 0 ? `<span class="dot todo" title="${todoCount}个待办"></span>` : ''}
                    ${annCount > 0 ? `<span class="dot ann" title="${annCount}个纪念日"></span>` : ''}
                </div>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;

    // Bind Events
    $('#cal-prev').onclick = () => changeMonth(-1);
    $('#cal-next').onclick = () => changeMonth(1);
    $('#cal-today').onclick = () => resetToToday();

    // Day Click Events
    container.querySelectorAll('.calendar-day:not(.empty)').forEach(el => {
        el.onclick = () => {
            const day = parseInt(el.getAttribute('data-day'));
            handleDayClick(day);
        };
    });
}

// Simple escape for tooltip
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '&#10;');
}

function changeMonth(delta) {
    state.month += delta;
    if (state.month > 11) {
        state.month = 0;
        state.year++;
    } else if (state.month < 0) {
        state.month = 11;
        state.year--;
    }
    updateCalendarView();
}

function resetToToday() {
    const now = new Date();
    state.year = now.getFullYear();
    state.month = now.getMonth();
    updateCalendarView();
}

function handleDayClick(day) {
    // For now, simple visual highlight + toast
    // Ideally this would filter the feed like filterByTag
    const { year, month } = state;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Highlight Logic & Toggle
    const isActive = document.querySelector(`.calendar-day[data-day="${day}"]`)?.classList.contains('active');

    if (isActive) {
        // Toggle Off
        document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('active'));
        document.dispatchEvent(new CustomEvent('filter-date', { detail: null }));
        return;
    }

    // Highlight
    const days = document.querySelectorAll('.calendar-day');
    days.forEach(d => d.classList.remove('active'));

    // Find the clicked element again (simple way)
    const clicked = Array.from(days).find(d => d.getAttribute('data-day') == day);
    if (clicked) clicked.classList.add('active');

    // Dispatch Filter Logic
    document.dispatchEvent(new CustomEvent('filter-date', { detail: dateStr }));
}

