import { authFetch } from './api.js';
import { store, setTalks, setTagFilter, setDateFilter } from './store.js';
import { showToast, showConfirm, escapeHtml, $ } from './utils.js';
import { renderContent } from './markdown.js'; // Enhanced content renderer

export async function fetchTalks() {
    const res = await authFetch('/talks');
    if (res && res.ok) {
        const data = await res.json();
        setTalks(data);
        renderFeed();
    }
}

// Global filter function to be exported effectively
export function filterByTag(tag) {
    setTagFilter(tag);
    updateTagCloudActiveState();
    renderFeed();
}

export function filterByDate(dateStr) {
    setDateFilter(dateStr);
    renderFeed();
}

export function clearFilter() {
    setTagFilter(null);
    setDateFilter(null);
    updateTagCloudActiveState();
    renderFeed();
}

function updateTagCloudActiveState() {
    const activeTag = store.currentTagFilter;
    const tagBadges = document.querySelectorAll('.tag-cloud-badge');
    tagBadges.forEach(badge => {
        const tagName = badge.querySelector('.tag-name')?.textContent.replace('#', '');
        if (tagName === activeTag) {
            badge.classList.add('active');
        } else {
            badge.classList.remove('active');
        }
    });
}

export function renderFeed() {
    const container = document.getElementById('feed');
    if (!container) return;
    container.innerHTML = '';

    const currentTagFilter = store.currentTagFilter;
    const currentDateFilter = store.currentDateFilter;
    let displayTalks = store.talks;

    if (currentTagFilter) {
        displayTalks = displayTalks.filter(t => t.tags && t.tags.includes(currentTagFilter));
    }

    if (currentDateFilter) {
        displayTalks = displayTalks.filter(t => {
            const d = new Date(t.createdAt);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return dateStr === currentDateFilter;
        });
    }

    if (currentTagFilter || currentDateFilter) {
        const filterMsg = document.createElement('div');
        let filterHtml = '<div class="filter-indicator"><span class="filter-label">正在筛选:</span>';

        if (currentTagFilter) {
            filterHtml += `
                <span class="filter-tag" id="clearTagFilterBtn">
                    #${currentTagFilter}
                    <i class="fas fa-times"></i>
                </span>`;
        }

        if (currentDateFilter) {
            filterHtml += `
                <span class="filter-tag" id="clearDateFilterBtn" style="background:#e17055;">
                    <i class="fas fa-calendar-day" style="margin-right:4px;"></i>${currentDateFilter}
                    <i class="fas fa-times"></i>
                </span>`;
        }

        filterHtml += '</div>';
        filterMsg.innerHTML = filterHtml;
        container.appendChild(filterMsg);

        if (document.getElementById('clearTagFilterBtn')) {
            document.getElementById('clearTagFilterBtn').addEventListener('click', () => { setTagFilter(null); updateTagCloudActiveState(); renderFeed(); });
        }
        if (document.getElementById('clearDateFilterBtn')) {
            document.getElementById('clearDateFilterBtn').addEventListener('click', () => { setDateFilter(null); renderFeed(); });
        }
    }

    // Show todos and anniversaries for the selected date
    if (currentDateFilter && !currentTagFilter) {
        renderTodosForDate(container, currentDateFilter);
        renderAnniversariesForDate(container, currentDateFilter);
    }

    if (displayTalks.length === 0 && !currentDateFilter) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = 'text-align:center; padding: 60px; opacity: 0.6;';

        const filterText = [];
        if (currentTagFilter) filterText.push(`#${currentTagFilter}`);
        if (currentDateFilter) filterText.push(`${currentDateFilter}`);
        const filterStr = filterText.join(' + ');

        emptyMsg.innerHTML = (currentTagFilter || currentDateFilter)
            ? `<i class="fas fa-search" style="font-size:2rem; margin-bottom:16px; display:block;"></i>没有找到 "${filterStr}" 的内容<br><small style="margin-top:8px; display:block;"><a href="#" id="emptyClearBtn" style="color:var(--primary);">清除筛选</a></small>`
            : '<i class="fas fa-pencil-alt" style="font-size:2rem; margin-bottom:16px; display:block;"></i>暂无内容，记录下美好的瞬间吧...';
        container.appendChild(emptyMsg);
        if (currentTagFilter || currentDateFilter) document.getElementById('emptyClearBtn').addEventListener('click', (e) => { e.preventDefault(); clearFilter(); });
        return;
    }

    displayTalks.forEach(talk => {
        const card = document.createElement('div');
        card.className = 'glass talk-card';
        if (talk.isPinned) card.setAttribute('data-pinned', 'true');

        let mediaHtml = '';
        if (talk.images && talk.images.length > 0) {
            mediaHtml += `<div class="talk-media">`;
            talk.images.forEach(img => {
                mediaHtml += `<img src="${img}" loading="lazy" alt="Image" onclick="window.openLightbox && window.openLightbox(this.src)">`;
            });
            mediaHtml += `</div>`;
        }
        if (talk.video) {
            // Check for Bilibili
            const bMatch = talk.video.match(/(BV\w+)/);
            if (bMatch) {
                mediaHtml += `<div class="talk-media" style="height:350px;">
                    <iframe src="//player.bilibili.com/player.html?bvid=${bMatch[1]}&page=1&high_quality=1&danmaku=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width:100%; height:100%; border-radius:12px;"></iframe>
                </div>`;
            } else {
                mediaHtml += `<div class="talk-media"><video src="${talk.video}" controls></video></div>`;
            }
        }

        // Tags HTML - slightly complex due to event binding
        // We will bind events after insertion or use delegation
        const tagsHtml = talk.tags ? talk.tags.map(t => `<span class="tag-pill" data-tag="${t}"><i class="fas fa-tag" style="font-size:0.75em; opacity:0.7;"></i> ${t}</span>`).join('') : '';

        // Friendly Time Logic
        const dateObj = new Date(talk.createdAt);
        const now = new Date();
        const diff = now - dateObj;
        let dateStr;
        if (diff < 60000) dateStr = '刚刚';
        else if (diff < 3600000) dateStr = Math.floor(diff / 60000) + '分钟前';
        else if (diff < 86400000) dateStr = Math.floor(diff / 3600000) + '小时前';
        else if (diff < 172800000) dateStr = '昨天 ' + dateObj.getHours().toString().padStart(2, '0') + ':' + dateObj.getMinutes().toString().padStart(2, '0');
        else dateStr = dateObj.toLocaleString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        const locationBadge = talk.location ? `<span class="location-badge"><i class="ri-map-pin-2-line"></i>${talk.location}</span>` : '';
        const pinnedBadge = talk.isPinned ? `<span class="pinned-badge">置顶</span>` : '';

        // Render content with optional markdown support
        // Auto-detect markdown? Or just always try?
        // Let's use detecting common markdown chars for auto-switch or just render
        const isMarkdown = talk.content.match(/(\*\*|__|#|`|> |\[.*?\])/);
        const renderedContent = renderContent(talk.content, !!isMarkdown);

        card.innerHTML = `
            <div class="talk-header">
                <div class="user-profile">
                    <img src="${store.userProfile.avatar}" class="user-avatar" alt="Avatar">
                    <div class="user-info">
                        <div class="user-name">
                            ${store.userProfile.name}
                            ${store.userProfile.verified ? `<i class="${store.userProfile.badgeIcon || 'fas fa-check-circle'} verified-badge" style="color:${store.userProfile.badgeColor || 'var(--primary)'}" title="认证用户"></i>` : ''}
                            ${pinnedBadge}
                        </div>
                        <div class="user-meta">
                            <span class="talk-date">${dateStr}</span>
                            ${talk.location ? '<span class="meta-separator">·</span>' : ''}
                            ${locationBadge}
                        </div>
                    </div>
                </div>
            </div>

            ${talk.title ? `<div class="talk-title">${escapeHtml(talk.title)}</div>` : ''}
            <div class="talk-content ${isMarkdown ? 'markdown-body' : ''}">${renderedContent}</div>
            ${mediaHtml}

            <div class="talk-footer">
                <div class="talk-tags">${tagsHtml}</div>
                <div class="talk-actions">
                    <div class="talk-action-btn ${talk.isPinned ? 'pinned' : ''}" data-action="pin" title="${talk.isPinned ? '取消置顶' : '置顶'}"><i class="fas fa-thumbtack"></i></div>
                    <div class="talk-action-btn ${talk.isFavorite ? 'favorited' : ''}" data-action="favorite" title="收藏"><i class="fas fa-heart"></i></div>
                    <div class="talk-action-btn delete-btn" data-action="delete" title="删除"><i class="fas fa-trash"></i></div>
                </div>
            </div>
        `;

        // Bind Events
        card.querySelectorAll('.tag-pill').forEach(pill => {
            pill.addEventListener('click', () => filterByTag(pill.dataset.tag));
        });

        const pinBtn = card.querySelector('[data-action="pin"]');
        const favBtn = card.querySelector('[data-action="favorite"]');
        const delBtn = card.querySelector('[data-action="delete"]');

        pinBtn.addEventListener('click', () => togglePin(talk.id));
        favBtn.addEventListener('click', () => toggleFavorite(talk.id));
        delBtn.addEventListener('click', () => deleteTalk(talk.id));

        container.appendChild(card);
    });
}

// Markdown Switch State
let useMarkdown = false;

export async function publishTalk() {
    const publishBtn = $('#publishBtn');
    const content = $('#talkContent')?.value || '';
    const title = $('#talkTitle')?.value || '';

    // Check if element exists before mapping to avoid errors if not rendered
    const imgItems = document.querySelectorAll('#imagesList .added-item span');
    const images = imgItems ? Array.from(imgItems).map(el => el.textContent) : [];

    const vidItems = document.querySelectorAll('#videosList .added-item span');
    const videos = vidItems ? Array.from(vidItems).map(el => el.textContent) : [];

    const tagItems = document.querySelectorAll('#tagsList2 .added-item span');
    const tags = tagItems ? Array.from(tagItems).map(el => el.textContent) : [];

    const location = $('#talkLocation')?.value || '';

    if (!content.trim() && images.length === 0 && videos.length === 0) {
        showToast('内容不能为空', 'warning');
        return;
    }

    const imageUrls = images.join(',');
    const videoUrl = videos.length > 0 ? videos[0] : '';

    // Explicitly add markdown flag if toggled? 
    // Currently the content renderer auto-detects or we can prepend a metadata flag.
    // However, the user request says "support normal input OR switch to markdown".
    // We'll rely on auto-detection in render logic or we can add a simple frontmatter-like tag if needed.
    // For now, let's keep it simple: What you type is what you get, markdown syntax will be rendered if present.
    // The "Toggle" button is mainly for User Education or Preview (if we add preview later).
    // Let's make the toggle just a visual indicator or helper.

    // Actually, user wants to "Switch". Maybe we should add a visual toggle that just changes placeholder?
    // "Switch to Markdown" -> "Markdown Enabled".

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('location', location);
    formData.append('tags', JSON.stringify(tags));
    formData.append('imageUrls', imageUrls);
    formData.append('videoUrl', videoUrl);

    try {
        if (publishBtn) {
            publishBtn.disabled = true;
            publishBtn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i>';
        }

        const res = await authFetch('/talks', {
            method: 'POST',
            body: formData
        });

        if (res && res.ok) {
            // Reset UI
            if ($('#talkContent')) {
                $('#talkContent').value = '';
                $('#talkContent').style.height = 'auto';
            }
            if ($('#talkTitle')) $('#talkTitle').value = '';
            if ($('#imagesList')) $('#imagesList').innerHTML = '';
            if ($('#videosList')) $('#videosList').innerHTML = '';
            if ($('#tagsList2')) $('#tagsList2').innerHTML = '';
            if ($('#talkLocation')) $('#talkLocation').value = '';

            $('.publisher-tools')?.classList.remove('show');
            $('#toggleToolsBtn')?.classList.remove('active');

            fetchTalks(); // Refresh
            showToast('发布成功', 'success');
        } else {
            showToast('发布失败，请重试', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('发布出错', 'error');
    } finally {
        if (publishBtn) {
            publishBtn.disabled = false;
            publishBtn.innerHTML = '<i class="ri-send-plane-2-fill"></i>';
        }
    }
}

// Add Toggle Button execution
export function initMarkdownToggle() {
    const bar = document.querySelector('.publisher-bar');
    if (!bar || document.getElementById('mdToggle')) return;

    const btn = document.createElement('button');
    btn.className = 'icon-btn-large';
    btn.id = 'mdToggle';
    btn.title = 'Markdown 模式';
    btn.innerHTML = '<i class="fab fa-markdown"></i>';
    btn.style.fontSize = '1rem';
    btn.style.marginRight = '4px';

    btn.onclick = () => {
        useMarkdown = !useMarkdown;
        btn.classList.toggle('active');
        const textarea = document.getElementById('talkContent');
        if (useMarkdown) {
            textarea.placeholder = "使用 Markdown 语法编写...";
            showToast('已切换到 Markdown 模式', 'info');
        } else {
            textarea.placeholder = "此刻想说点什么...";
            showToast('已切换到普通模式', 'info');
        }
    };

    // Insert before the input wrapper
    const inputWrapper = bar.querySelector('.input-wrapper');
    bar.insertBefore(btn, inputWrapper);
}

// Initialize Publisher Tools (Image, Video, Tag, Location)
export function initPublisher() {
    // Helper to add item to list
    const addItem = (listId, value, iconClass) => {
        const list = document.getElementById(listId);
        if (!list) return;

        const item = document.createElement('div');
        item.className = 'added-item';
        item.innerHTML = `
            <i class="${iconClass}"></i>
            <span>${escapeHtml(value)}</span>
            <i class="fas fa-times remove-item"></i>
        `;

        // Bind remove
        item.querySelector('.remove-item').onclick = () => item.remove();
        list.appendChild(item);
    };

    // Helper: Bind input + button
    const bindInputBtn = (btnId, inputId, listId, iconClass) => {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        if (btn && input) {
            btn.onclick = () => {
                const val = input.value.trim();
                if (val) {
                    addItem(listId, val, iconClass);
                    input.value = '';
                } else {
                    input.focus();
                }
            };
            // Bind Enter key
            input.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    btn.click();
                }
            };
        }
    };

    bindInputBtn('addImageBtn', 'talkImageInput', 'imagesList', 'far fa-image');
    bindInputBtn('addVideoBtn', 'talkVideoInput', 'videosList', 'fas fa-video');
    bindInputBtn('addTagBtn', 'talkTagInput', 'tagsList2', 'fas fa-tag');

    // Location Logic
    // Export globally for onclick="getLocation()" in HTML
    // Location Logic
    // Export globally for onclick="getLocation()" in HTML
    window.getLocation = () => {
        const btn = document.querySelector('.location-actions button');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i>';
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;

                    try {
                        // Use OpenStreetMap Nominatim for free reverse geocoding
                        // Note: Please respect their usage policy (User-Agent, limit requests)
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&accept-language=zh-CN`);
                        let displayLoc = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

                        if (res.ok) {
                            const data = await res.json();
                            if (data.address) {
                                // Construct a friendly name: City · District or State · City
                                const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
                                const district = data.address.suburb || data.address.district || '';
                                const state = data.address.state || '';

                                if (city && district) {
                                    displayLoc = `${city} · ${district}`;
                                } else if (city) {
                                    displayLoc = city;
                                } else if (state) {
                                    displayLoc = `${state} · ${city}`;
                                }
                            }
                        }

                        const input = document.getElementById('talkLocation');
                        if (input) input.value = displayLoc;
                        showToast('定位成功', 'success');

                    } catch (e) {
                        console.error('Reverse geocode error:', e);
                        // Fallback to coords
                        const input = document.getElementById('talkLocation');
                        if (input) input.value = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
                        showToast('定位成功 (无法获取地名)', 'warning');
                    } finally {
                        if (btn) {
                            btn.disabled = false;
                            btn.innerHTML = '<i class="ri-gps-fill"></i>';
                        }
                    }
                },
                (error) => {
                    console.error("Geo error:", error);
                    let msg = '无法获取定位';
                    if (error.code === 1) msg = '您拒绝了定位请求';
                    else if (error.code === 2) msg = '位置信息不可用';
                    else if (error.code === 3) msg = '定位请求超时';

                    showToast(msg, 'warning');
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="ri-gps-fill"></i>';
                    }
                    const input = document.getElementById('talkLocation');
                    if (input) input.focus();
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        } else {
            showToast('浏览器不支持定位', 'warning');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="ri-gps-fill"></i>';
            }
        }
    };

    // Bind Main Publish Button
    const publishBtn = document.getElementById('publishBtn');
    if (publishBtn) {
        publishBtn.addEventListener('click', publishTalk);
    }

    // Bind Ctrl+Enter on Textarea
    const talkContent = document.getElementById('talkContent');
    if (talkContent) {
        talkContent.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                publishTalk();
            }
        });
    }
}

// Auto Init when loaded
setTimeout(() => {
    initMarkdownToggle();
    initPublisher();
}, 1000);


export async function deleteTalk(id) {
    if (!(await showConfirm({ message: "确定要删除这条说说吗？", type: 'danger' }))) return;
    const res = await authFetch(`/talks/${id}`, { method: 'DELETE' });
    if (res && res.ok) {
        showToast('删除成功', 'success');
        fetchTalks();
    } else {
        showToast('删除失败', 'error');
    }
}
export async function togglePin(id) {
    await authFetch(`/talks/${id}/pin`, { method: 'PUT' });
    fetchTalks();
}
export async function toggleFavorite(id) {
    await authFetch(`/talks/${id}/favorite`, { method: 'PUT' });
    fetchTalks();
}

// Render todos for a specific date in feed
function renderTodosForDate(container, dateStr) {
    const filterDate = new Date(dateStr);

    const filteredTodos = store.todos.filter(t => {
        if (!t.endTime) return false;
        const todoDate = new Date(t.endTime);
        return todoDate.toDateString() === filterDate.toDateString();
    });

    if (filteredTodos.length === 0) return;

    const section = document.createElement('div');
    section.className = 'date-section';
    section.innerHTML = `
        <div class="date-section-header">
            <i class="fas fa-check-square" style="color:var(--primary);"></i>
            <span>待办事项 (${filteredTodos.length})</span>
        </div>
    `;

    filteredTodos.forEach(todo => {
        const card = document.createElement('div');
        card.className = 'glass todo-card-feed';

        const priorityColors = {
            high: '#ff7675',
            normal: '#74b9ff',
            low: '#55efc4'
        };

        const formatTime = (iso) => {
            if (!iso) return '';
            const d = new Date(iso);
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        };

        card.innerHTML = `
            <div class="todo-feed-header">
                <div class="todo-feed-priority ${todo.priority}" style="background:${priorityColors[todo.priority] || '#74b9ff'}"></div>
                <div class="todo-feed-content">
                    <div class="todo-feed-text ${todo.completed ? 'completed' : ''}">${escapeHtml(todo.content)}</div>
                    ${todo.endTime ? `<div class="todo-feed-time"><i class="fas fa-clock"></i> ${formatTime(todo.endTime)}</div>` : ''}
                </div>
                <div class="todo-feed-status">
                    ${todo.completed ? '<i class="fas fa-check-circle" style="color:#55efc4;"></i>' : '<i class="far fa-circle" style="color:#bdc3c7;"></i>'}
                </div>
            </div>
        `;

        card.addEventListener('click', async () => {
            // Toggle todo via dynamic import
            const todoModule = await import('./todos.js');
            todoModule.toggleTodo(todo.id);
        });

        section.appendChild(card);
    });

    container.appendChild(section);
}

// Render anniversaries for a specific date in feed
function renderAnniversariesForDate(container, dateStr) {
    const filterDate = new Date(dateStr);

    const filteredAnns = store.anniversaries.filter(a => {
        const annDate = new Date(a.date);
        // Match month and day (anniversaries are recurring yearly)
        return annDate.getMonth() === filterDate.getMonth() &&
               annDate.getDate() === filterDate.getDate();
    });

    if (filteredAnns.length === 0) return;

    const section = document.createElement('div');
    section.className = 'date-section';
    section.innerHTML = `
        <div class="date-section-header">
            <i class="fas fa-calendar-day" style="color:#ff7675;"></i>
            <span>纪念日 (${filteredAnns.length})</span>
        </div>
    `;

    filteredAnns.forEach(ann => {
        const card = document.createElement('div');
        card.className = 'glass ann-card-feed';

        const icons = {
            birthday: 'fa-birthday-cake',
            love: 'fa-heart',
            work: 'fa-briefcase',
            study: 'fa-graduation-cap',
            festival: 'fa-glass-cheers',
            other: 'fa-bookmark'
        };
        const colors = {
            birthday: '#FF6B9D',
            love: '#FF5757',
            work: '#5B8CFF',
            study: '#4ADE80',
            festival: '#FF9F43',
            other: '#94A3B8'
        };

        const iconClass = icons[ann.category] || 'fa-bookmark';
        const iconColor = colors[ann.category] || '#747d8c';

        // Calculate years
        const startDate = new Date(ann.date);
        const years = filterDate.getFullYear() - startDate.getFullYear();
        const monthDiff = filterDate.getMonth() - startDate.getMonth();
        const dayDiff = filterDate.getDate() - startDate.getDate();
        const displayYears = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? years - 1 : years;

        card.innerHTML = `
            <div class="ann-feed-header">
                <div class="ann-feed-icon" style="color:${iconColor}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="ann-feed-content">
                    <div class="ann-feed-title">${escapeHtml(ann.title)}</div>
                    <div class="ann-feed-meta">${ann.date} ${displayYears > 0 ? `· 第${displayYears}年` : ''}</div>
                </div>
            </div>
        `;

        section.appendChild(card);
    });

    container.appendChild(section);
}

