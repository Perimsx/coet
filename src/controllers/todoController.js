const db = require('../models/db');

exports.getTodos = (req, res) => {
    let todos = db.get('todos');
    // Sort by Priority (High > Med > Low), then Pending > Done, then Date
    const priorityMap = { 'high': 3, 'normal': 2, 'low': 1 };
    todos.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed - b.completed; // Pending first
        if (!a.completed) {
            // Pending: Priority then Date
            if (priorityMap[b.priority] !== priorityMap[a.priority])
                return priorityMap[b.priority] - priorityMap[a.priority];
            return new Date(b.createdAt) - new Date(a.createdAt);
        } else {
            // Completed: Sort by completion time (DESC)
            const timeA = a.completedAt || a.endTime || a.createdAt;
            const timeB = b.completedAt || b.endTime || b.createdAt;
            return new Date(timeB) - new Date(timeA);
        }
    });
    res.json(todos);
};

exports.addTodo = (req, res) => {
    const { content, priority, startTime, endTime } = req.body;

    // 基础验证
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ message: "待办内容不能为空" });
    }

    if (content.length > 1000) {
        return res.status(400).json({ message: "待办内容过长" });
    }

    const validPriorities = ['high', 'normal', 'low'];
    if (priority && !validPriorities.includes(priority)) {
        return res.status(400).json({ message: "无效的优先级" });
    }

    const newTodo = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        content: content.trim(),
        priority: priority || 'normal',
        completed: false,
        startTime: startTime || null,
        endTime: endTime || null,
        createdAt: new Date().toISOString()
    };
    const todos = db.get('todos');
    todos.push(newTodo);
    db.set('todos', todos);
    res.json(newTodo);
};

exports.toggleTodo = (req, res) => {
    const { id } = req.params;
    let todos = db.get('todos');
    const todo = todos.find(t => t.id === id);
    if (!todo) return res.status(404).json({ message: "Not found" });

    todo.completed = !todo.completed;
    if (todo.completed) {
        todo.completedAt = new Date().toISOString();
    } else {
        todo.completedAt = null;
    }
    db.set('todos', todos);
    res.json(todo);
};

exports.deleteTodo = (req, res) => {
    const { id } = req.params;
    let todos = db.get('todos');
    todos = todos.filter(t => t.id !== id);
    db.set('todos', todos);
    res.json({ message: "Deleted" });
};

exports.clearCompleted = (req, res) => {
    let todos = db.get('todos');
    todos = todos.filter(t => !t.completed);
    db.set('todos', todos);
    res.json({ message: "Cleared completed" });
};
