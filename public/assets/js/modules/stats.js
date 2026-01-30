import { authFetch } from './api.js';
import { store, setTagFilter } from './store.js';
import { renderFeed } from './talks.js'; // Circular dependency risk? better separate render
import { $ } from './utils.js';

export async function fetchStats() {
    const res = await authFetch('/stats');
    if (res && res.ok) {
        const stats = await res.json();
        renderStats(stats);
    }
}

function renderStats(stats) {
    const div = document.getElementById('stats-content');
    if (!div) return;

    // Calculate todo completion stats from store
    const totalTodos = store.todos.length;
    const completedTodos = store.todos.filter(t => t.completed).length;
    const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    const todayCompleted = store.todos.filter(t => {
        if (!t.completed) return false;
        // Use completedAt if available, otherwise fallback to endTime if it looks like a completion time (legacy)
        // Actually for new logic, we just check completedAt. 
        // For compatibility with just-migrated data where endTime WAS completed time:
        const timeStr = t.completedAt || t.endTime;
        if (!timeStr) return false;

        const completedDate = new Date(timeStr);
        const today = new Date();
        return completedDate.toDateString() === today.toDateString();
    }).length;

    const totalAnniversaries = store.anniversaries.length;

    // Count unique tags
    const allTags = store.talks.flatMap(t => t.tags || []);
    const uniqueTags = new Set(allTags);
    const tagCount = uniqueTags.size;

    div.innerHTML = `
        <div class="stats-grid">
            <div class="stat-box" id="stat-talks">
                <div class="stat-icon-wrapper stat-icon-blue">
                    <i class="fas fa-comment-dots"></i>
                </div>
                <div class="stat-val-wrapper">
                     <div class="stat-val" data-target="${stats.talkCount}">0</div>
                     <div class="stat-sub">条说说</div>
                </div>
            </div>
            
            <div class="stat-box" id="stat-days">
                <div class="stat-icon-wrapper stat-icon-purple">
                    <i class="fas fa-hourglass-half"></i>
                </div>
                <div class="stat-val-wrapper">
                    <div class="stat-val" data-target="${stats.runningDays}">0</div>
                    <div class="stat-sub">运行天数</div>
                </div>
            </div>

            <div class="stat-box" id="stat-rate">
                <div class="stat-icon-wrapper stat-icon-green">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-val-wrapper">
                    <div class="stat-val" data-target="${completionRate}" data-suffix="%">0%</div>
                    <div class="stat-sub">完成率</div>
                </div>
                <div class="stat-progress">
                    <div class="stat-progress-bar" style="width: 0%" data-target="${completionRate}%"></div>
                </div>
            </div>

            <div class="stat-box" id="stat-today">
                <div class="stat-icon-wrapper stat-icon-orange">
                    <i class="fas fa-calendar-check"></i>
                </div>
                <div class="stat-val-wrapper">
                    <div class="stat-val" data-target="${todayCompleted}">0</div>
                    <div class="stat-sub">今日完成</div>
                </div>
            </div>
            
            <div class="stat-box" id="stat-ann">
                <div class="stat-icon-wrapper stat-icon-red">
                    <i class="fas fa-heart"></i>
                </div>
                <div class="stat-val-wrapper">
                    <div class="stat-val" data-target="${totalAnniversaries}">0</div>
                    <div class="stat-sub">纪念日</div>
                </div>
            </div>

            <div class="stat-box" id="stat-tags">
                <div class="stat-icon-wrapper stat-icon-teal">
                    <i class="fas fa-tags"></i>
                </div>
                <div class="stat-val-wrapper">
                    <div class="stat-val" data-target="${tagCount}">0</div>
                    <div class="stat-sub">标签</div>
                </div>
            </div>
        </div>
    `;

    // Click handlers
    $('#stat-talks')?.addEventListener('click', () => document.getElementById('feed').scrollTo({ top: 0, behavior: 'smooth' }));
    $('#stat-days')?.addEventListener('click', () => showToast(`已稳定运行 ${stats.runningDays} 天`, 'info')); // Just a fun interaction
    $('#stat-rate')?.addEventListener('click', focusTodos);
    $('#stat-today')?.addEventListener('click', focusTodos);
    $('#stat-ann')?.addEventListener('click', focusAnniversaries);
    $('#stat-tags')?.addEventListener('click', () => {
        fetchTags();
    });

    animateStatsNumbers();
}

function focusTodos() {
    const el = document.getElementById('todo-list');
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.animation = 'highlightPulse 0.6s ease';
        setTimeout(() => el.style.animation = '', 600);
    }
}

function focusAnniversaries() {
    const el = document.getElementById('anniversary-list');
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.animation = 'highlightPulse 0.6s ease';
        setTimeout(() => el.style.animation = '', 600);
    }
}

function animateStatsNumbers() {
    const statValues = document.querySelectorAll('.stat-val[data-target]');
    const progressBars = document.querySelectorAll('.stat-progress-bar[data-target]');

    statValues.forEach(el => {
        const target = parseInt(el.dataset.target) || 0;
        const suffix = el.dataset.suffix || '';
        const duration = 1000;
        const startTime = performance.now();

        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(target * easeOut);

            el.textContent = current + suffix;

            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                el.textContent = target + suffix;
            }
        }
        requestAnimationFrame(updateNumber);
    });

    progressBars.forEach(bar => {
        setTimeout(() => {
            bar.style.transition = 'width 0.8s ease-out';
            bar.style.width = bar.dataset.target;
        }, 100);
    });
}

export async function fetchTags() {
    const res = await authFetch('/tags');
    if (res && res.ok) {
        const tags = await res.json();
        renderTags(tags);
    }
}

function renderTags(tags) {
    const container = document.getElementById('tags-cloud');
    if (!container) return;
    container.innerHTML = '';

    if (tags.length === 0) {
        container.innerHTML = `
            <div class="tag-cloud-empty">
                <i class="fas fa-tags"></i>
                <span>暂无标签</span>
            </div>
        `;
        return;
    }

    const maxCount = Math.max(...tags.map(t => t.count));
    const colorThemes = ['theme-blue', 'theme-purple', 'theme-pink', 'theme-red', 'theme-orange', 'theme-yellow', 'theme-green', 'theme-teal'];
    const sortedTags = [...tags].sort((a, b) => b.count - a.count);

    sortedTags.forEach((tag, index) => {
        let sizeClass = 'size-small';
        const ratio = tag.count / maxCount;
        if (ratio > 0.6) sizeClass = 'size-large';
        else if (ratio > 0.3) sizeClass = 'size-medium';

        const themeClass = colorThemes[index % colorThemes.length];
        const isActive = store.currentTagFilter === tag.name ? 'active' : '';

        const tagEl = document.createElement('span');
        tagEl.className = `tag-cloud-badge ${sizeClass} ${themeClass} ${isActive}`;
        // Import circular dependency work-around? 
        // We need filterByTag from talks.js usually.
        // Let's attach a global event listener or passing callback?
        // Refactoring: We can export filterByTag from a shared controller or make renderFeed exportable and import here.
        // importing renderFeed is set at top.

        tagEl.onclick = () => {
            // We need to import filterByTag logic. 
            // To avoid circular dep, filterByTag logic can be in store or separate controller.
            // For now, let's dispatch a custom event.
            document.dispatchEvent(new CustomEvent('filter-tag', { detail: tag.name }));
        };

        tagEl.innerHTML = `
            <span class="tag-name">#${tag.name}</span>
            <span class="tag-count">${tag.count}</span>
        `;
        container.appendChild(tagEl);
    });
}
