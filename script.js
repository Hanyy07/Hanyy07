function loadTasks() {
    try {
        const raw = localStorage.getItem('tasks');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

let tasks = loadTasks();
let currentFilter = 'all';
let currentCategory = 'all';

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const clearCompletedBtn = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');
const categoryBtns = document.querySelectorAll('.category-btn');
const prioritySelect = document.getElementById('prioritySelect');
const categorySelect = document.getElementById('categorySelect');
const deadlineInput = document.getElementById('deadlineInput');

const categoryLabels = {
    personal: 'Osobní',
    work: 'Práce',
    shopping: 'Nákupy',
    health: 'Zdraví'
};

const priorityLabels = {
    low: 'Nízká',
    medium: 'Střední',
    high: 'Vysoká'
};

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('cs-CZ');
}

function isOverdue(dateStr) {
    if (!dateStr) return false;
    const deadline = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadline < today;
}

function renderTasks() {
    let filteredTasks = tasks.filter(task => {
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });

    if (currentCategory !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.category === currentCategory);
    }

    filteredTasks.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (a.deadline && b.deadline) {
            return new Date(a.deadline) - new Date(b.deadline);
        }
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        return 0;
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<li class="empty-message">Žádné úkoly</li>';
    } else {
        taskList.innerHTML = filteredTasks.map(task => {
            const overdueClass = !task.completed && isOverdue(task.deadline) ? 'overdue' : '';
            const deadlineText = task.deadline ? `<span class="task-deadline ${overdueClass}">${formatDate(task.deadline)}</span>` : '';

            return `
            <li class="task-item ${task.completed ? 'completed' : ''} priority-${task.priority}" data-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    <div class="task-meta">
                        <span class="task-category category-${task.category}">${categoryLabels[task.category]}</span>
                        <span class="task-priority priority-badge-${task.priority}">${priorityLabels[task.priority]}</span>
                        ${deadlineText}
                    </div>
                </div>
                <button class="delete-btn">Smazat</button>
            </li>
        `}).join('');
    }

    updateCount();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateCount() {
    const activeCount = tasks.filter(t => !t.completed).length;
    const total = tasks.length;
    const overdueCount = tasks.filter(t => !t.completed && isOverdue(t.deadline)).length;

    let countText = `${activeCount} aktivních z ${total} úkolů`;
    if (overdueCount > 0) {
        countText += ` (${overdueCount} po termínu)`;
    }
    taskCount.textContent = countText;
}

function addTask() {
    const text = taskInput.value.trim();
    if (text === '') return;

    const newTask = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: text,
        completed: false,
        priority: prioritySelect.value,
        category: categorySelect.value,
        deadline: deadlineInput.value || null
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    taskInput.value = '';
    deadlineInput.value = '';
    taskInput.focus();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
}

function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderTasks();
}

function setCategoryFilter(category) {
    currentCategory = category;
    categoryBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    renderTasks();
}

addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

taskList.addEventListener('click', (e) => {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;

    const id = taskItem.dataset.id;

    if (e.target.classList.contains('task-checkbox')) {
        toggleTask(id);
    } else if (e.target.classList.contains('delete-btn')) {
        deleteTask(id);
    }
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => setCategoryFilter(btn.dataset.category));
});

clearCompletedBtn.addEventListener('click', clearCompleted);

renderTasks();
