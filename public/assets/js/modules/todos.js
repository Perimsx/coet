import { authFetch } from './api.js';
import { store, setTodos } from './store.js';
import { toggleModal, showConfirm, showToast, escapeHtml } from './utils.js';

export async function fetchTodos() {
    const res = await authFetch('/todos');
    if (res && res.ok) {
        const data = await res.json();
        setTodos(data);
        renderTodos();
    }
}

function isToday(dateStr) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function isOverdue(todo) {
    if (todo.completed || !todo.endTime) return false;
    const endTime = new Date(todo.endTime);
    return endTime < new Date();
}

export function renderTodos() {
    const container = document.getElementById('todo-list');
    if (!container) return;
    container.innerHTML = '';

    const todos = store.todos;
    if (todos.length === 0) {
        container.innerHTML = '<div style="color:#bdc3c7; text-align:center; padding:10px;">暂无待办</div>';
        return;
    }

    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const sortedTodos = [...todos].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (!a.completed) {
            if (isOverdue(a) && !isOverdue(b)) return -1;
            if (!isOverdue(a) && isOverdue(b)) return 1;
        }
        if (a.completed) {
            const timeA = a.completedAt || a.endTime || a.createdAt;
            const timeB = b.completedAt || b.endTime || b.createdAt;
            return new Date(timeB) - new Date(timeA);
        }
        const pa = priorityOrder[a.priority] || 1;
        const pb = priorityOrder[b.priority] || 1;
        if (pa !== pb) return pa - pb;
        if (!a.completed && a.endTime && b.endTime) return new Date(a.endTime) - new Date(b.endTime);
        return 0;
    });

    const incompleteTodos = sortedTodos.filter(t => !t.completed);
    const completedTodos = sortedTodos.filter(t => t.completed);

    const listWrapper = document.createElement('div');
    listWrapper.className = 'widget-foldable';

    const completedListWrapper = document.createElement('div');
    completedListWrapper.className = 'widget-foldable collapsed-hidden';
    completedListWrapper.style.marginTop = '8px';

    const createTodoItem = (todo) => {
        const item = document.createElement('div');
        const overdue = isOverdue(todo);
        item.className = `todo-item ${todo.completed ? 'todo-completed' : ''} ${overdue ? 'todo-overdue' : ''}`;
        const priority = todo.priority || 'normal';

        const formatTime = (iso) => {
            if (!iso) return '';
            const d = new Date(iso);
            return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        };

        let timeHtml = '';
        let badgeHtml = '';

        if (todo.completed) {
            // Priority: completedAt > endTime (legacy fallback)
            const finishTime = todo.completedAt || todo.endTime;
            if (todo.startTime || finishTime) {
                timeHtml = `<div class="todo-time-tags">`;
                if (todo.startTime) timeHtml += `<span class="time-tag"><i class="fas fa-play"></i> ${formatTime(todo.startTime)}</span>`;
                if (finishTime) timeHtml += `<span class="time-tag done"><i class="fas fa-check"></i> ${formatTime(finishTime)}</span>`;
                timeHtml += `</div>`;
            }
        } else {
            if (todo.endTime) {
                if (isToday(todo.endTime)) badgeHtml = '<span class="todo-badge today">今日</span>';
                timeHtml = `<div class="todo-time-tags">`;
                if (todo.startTime) timeHtml += `<span class="time-tag"><i class="fas fa-plus"></i> ${formatTime(todo.startTime)}</span>`;
                timeHtml += `<span class="time-tag ${overdue ? 'overdue' : ''}"><i class="fas fa-flag"></i> ${formatTime(todo.endTime)}</span>`;
                timeHtml += `</div>`;
            } else if (todo.startTime) {
                timeHtml = `<div class="todo-time-tags"><span class="time-tag"><i class="fas fa-plus"></i> ${formatTime(todo.startTime)}</span></div>`;
            }
        }

        if (overdue && !todo.completed) badgeHtml = '<span class="todo-badge overdue">逾期</span>';

        item.innerHTML = `
            <div class="todo-inner">
                <div class="todo-priority-bar ${priority}"></div>
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <div class="todo-details">
                    <div class="todo-text" title="${escapeHtml(todo.content)}">
                        ${escapeHtml(todo.content)}
                        ${badgeHtml}
                    </div>
                    ${timeHtml}
                </div>
                <div class="todo-actions">
                     <i class="fas fa-trash delete-btn"></i>
                </div>
            </div>
        `;

        // Listeners
        const checkbox = item.querySelector('.todo-checkbox');
        checkbox.addEventListener('click', async (e) => {
            e.preventDefault(); // 阻止默认行为，等 API 成功后再改变
            const currentState = checkbox.checked;

            try {
                const res = await authFetch(`/todos/${todo.id}`, { method: 'PUT' });

                if (res && res.ok) {
                    await fetchTodos(); // 重新获取数据并重新渲染
                } else {
                    checkbox.checked = currentState; // 失败时恢复原状态
                    showToast('操作失败，请重试', 'error');
                }
            } catch (error) {
                console.error('Toggle todo error:', error);
                checkbox.checked = currentState;
                showToast('操作出错，请重试', 'error');
            }
        });

        const delBtn = item.querySelector('.delete-btn');
        delBtn.addEventListener('click', () => deleteTodo(todo.id));

        return item;
    };

    incompleteTodos.forEach(todo => listWrapper.appendChild(createTodoItem(todo)));

    if (completedTodos.length > 0) {
        const divider = document.createElement('div');
        divider.className = 'todo-divider';
        divider.innerHTML = `
            <span class="divider-text">已完成 (${completedTodos.length})</span>
            <button class="clear-completed-btn" title="清除所有已完成">
                <i class="fas fa-broom"></i>
            </button>
        `;

        const clearBtn = divider.querySelector('.clear-completed-btn');
        clearBtn.onclick = (e) => {
            e.stopPropagation();
            clearCompletedTodos();
        };

        completedListWrapper.appendChild(divider);
        completedTodos.forEach(todo => completedListWrapper.appendChild(createTodoItem(todo)));
    }

    container.appendChild(listWrapper);

    if (completedTodos.length > 0) {
        const btn = document.createElement('button');
        btn.className = 'widget-toggle-btn';
        btn.innerHTML = `展开已完成 (${completedTodos.length}) <i class="fas fa-chevron-down"></i>`;
        btn.style.display = 'flex';
        btn.style.marginTop = '4px';
        btn.onclick = () => {
            const isCollapsed = completedListWrapper.classList.contains('collapsed-hidden');
            if (isCollapsed) {
                completedListWrapper.classList.remove('collapsed-hidden');
                btn.innerHTML = `收起已完成 <i class="fas fa-chevron-up"></i>`;
            } else {
                completedListWrapper.classList.add('collapsed-hidden');
                btn.innerHTML = `展开已完成 (${completedTodos.length}) <i class="fas fa-chevron-down"></i>`;
            }
        };
        container.appendChild(btn);
        container.appendChild(completedListWrapper);
    }
}

export async function submitTodo(e) {
    e.preventDefault();
    const form = e.target;

    const content = form.content.value.trim();
    if (!content) {
        showToast('请输入待办内容', 'error');
        return;
    }

    if (content.length > 1000) {
        showToast('待办内容过长，请控制在1000字以内', 'error');
        return;
    }

    const data = {
        content: content,
        priority: form.priority.value,
        startTime: new Date().toISOString(),
        endTime: form.deadline && form.deadline.value ? new Date(form.deadline.value).toISOString() : null
    };

    const res = await authFetch('/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (res && res.ok) {
        toggleModal('add-todo-modal');
        form.reset();
        fetchTodos();
        showToast('添加成功', 'success');
    } else {
        const data = await res.json();
        showToast(data.message || '添加失败', 'error');
    }
}

export async function toggleTodo(id) {
    const res = await authFetch(`/todos/${id}`, { method: 'PUT' });
    return res && res.ok;
}

export async function deleteTodo(id) {
    if (!(await showConfirm({ message: "确定要删除这条待办吗？", type: 'danger' }))) return;
    const res = await authFetch(`/todos/${id}`, { method: 'DELETE' });
    if (res && res.ok) {
        showToast('删除成功', 'success');
        fetchTodos();
    } else {
        showToast('删除失败', 'error');
    }
}

export async function clearCompletedTodos() {
    if (!(await showConfirm({ message: "确定要清除所有已完成的待办吗？", type: 'danger' }))) return;
    const res = await authFetch('/todos/clear-completed', { method: 'DELETE' });
    if (res && res.ok) {
        showToast('清理成功', 'success');
        fetchTodos();
    } else {
        showToast('操作失败', 'error');
    }
}
