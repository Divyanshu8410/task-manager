// ============================================
// TASKFLOW PRO - ADVANCED APPLICATION
// Competition-Winning Features
// ============================================

// ============================================
// 1. STATE & CONFIGURATION
// ============================================

let currentUser = null;
let allTasks = [];
let currentView = 'dashboard';
let currentFilter = 'all';
let editingTaskId = null;
let notificationCount = 0;

// Enhanced User Model with Streak Tracking
const USER_SCHEMA = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    avatar: '',
    createdAt: '',
    lastLogin: '',
    streakDays: 0,
    totalCompleted: 0,
    theme: 'light'
};

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const authSection = document.getElementById('authSection');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const toastNotification = document.getElementById('toastNotification');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');
const logoutBtn = document.getElementById('logoutBtn');
const sidebarToggle = document.getElementById('sidebarToggle');
const appSidebar = document.querySelector('.app-sidebar');
const userAvatar = document.getElementById('userAvatar');
const profileDropdown = document.querySelector('.profile-dropdown');

// Demo user for testing
const DEMO_USER = {
    id: 'demo_user_001',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@taskflow.com',
    password: 'password123',
    createdAt: new Date().toISOString(),
    streakDays: 5,
    totalCompleted: 15,
    theme: 'light'
};

// ============================================
// 2. INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    simulateLoading();
    initializeEventListeners();
    checkAuthStatus();
    loadThemePreference();
    updateGreeting();
    
    setInterval(updateGreeting, 60000);
});

function simulateLoading() {
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
    }, 2000);
}

// ============================================
// 3. AUTHENTICATION SYSTEM
// ============================================

function checkAuthStatus() {
    const savedUser = localStorage.getItem('taskFlowCurrentUser');
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
        displayUserInfo();
        loadUserTasks();
    } else {
        showAuthSection();
    }
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        errorDiv.textContent = '';

        if (!isValidEmail(email)) {
            throw new Error('Invalid email format');
        }

        if (!password) {
            throw new Error('Password is required');
        }

        const user = findUserByCredentials(email, password);

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        saveUser(user);

        currentUser = user;
        localStorage.setItem('taskFlowCurrentUser', JSON.stringify(user));

        showMainApp();
        displayUserInfo();
        loadUserTasks();
        showToast('Welcome back! 👋', 'success');
    } catch (error) {
        errorDiv.classList.add('show');
        errorDiv.textContent = error.message;
        showToast(error.message, 'error');
    }
});

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const firstName = document.getElementById('signupFirstName').value.trim();
    const lastName = document.getElementById('signupLastName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    const errorDiv = document.getElementById('signupError');

    try {
        errorDiv.textContent = '';

        if (!firstName || !lastName) throw new Error('Full name is required');
        if (!isValidEmail(email)) throw new Error('Invalid email format');
        if (password.length < 8) throw new Error('Password must be 8+ characters');
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        if (!agreeTerms) throw new Error('Please agree to terms');

        const users = getAllUsers();
        if (users.find(u => u.email === email)) {
            throw new Error('Email already registered');
        }

        const newUser = {
            id: 'user_' + Date.now(),
            firstName,
            lastName,
            email,
            password,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            streakDays: 0,
            totalCompleted: 0,
            theme: 'light'
        };

        saveUser(newUser);
        currentUser = newUser;
        localStorage.setItem('taskFlowCurrentUser', JSON.stringify(newUser));

        showMainApp();
        displayUserInfo();
        loadUserTasks();
        showToast('Account created! Welcome to TaskFlow! 🚀', 'success');
    } catch (error) {
        errorDiv.classList.add('show');
        errorDiv.textContent = error.message;
        showToast(error.message, 'error');
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('taskFlowCurrentUser');
    currentUser = null;
    allTasks = [];
    showAuthSection();
    resetForms();
    showToast('Logged out successfully', 'info');
});

// ============================================
// 4. USER MANAGEMENT
// ============================================

function getAllUsers() {
    const users = localStorage.getItem('taskFlowUsers');
    const initialUsers = [DEMO_USER];
    
    if (!users) {
        localStorage.setItem('taskFlowUsers', JSON.stringify(initialUsers));
        return initialUsers;
    }
    
    return JSON.parse(users);
}

function saveUser(user) {
    const users = getAllUsers();
    const index = users.findIndex(u => u.email === user.email);
    
    if (index > -1) {
        users[index] = user;
    } else {
        users.push(user);
    }
    
    localStorage.setItem('taskFlowUsers', JSON.stringify(users));
}

function findUserByCredentials(email, password) {
    const users = getAllUsers();
    return users.find(u => u.email === email && u.password === password);
}

function displayUserInfo() {
    userAvatar.textContent = currentUser.firstName.charAt(0).toUpperCase();
    document.getElementById('dropdownName').textContent = 
        `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById('dropdownEmail').textContent = currentUser.email;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================
// 5. TASK MANAGEMENT
// ============================================

function getUserTasks() {
    if (!currentUser) return [];
    const tasksData = localStorage.getItem('taskFlowTasks');
    const tasks = tasksData ? JSON.parse(tasksData) : [];
    return tasks.filter(t => t.createdBy === currentUser.id);
}

function saveTaskToStorage(task) {
    const tasksData = localStorage.getItem('taskFlowTasks');
    let tasks = tasksData ? JSON.parse(tasksData) : [];

    if (task.id) {
        const index = tasks.findIndex(t => t.id === task.id);
        if (index > -1) {
            tasks[index] = task;
        }
    } else {
        task.id = 'task_' + Date.now();
        task.createdBy = currentUser.id;
        task.createdAt = new Date().toISOString();
        tasks.push(task);
    }

    localStorage.setItem('taskFlowTasks', JSON.stringify(tasks));
    return task;
}

function deleteTaskFromStorage(taskId) {
    const tasksData = localStorage.getItem('taskFlowTasks');
    let tasks = tasksData ? JSON.parse(tasksData) : [];
    tasks = tasks.filter(t => t.id !== taskId);
    localStorage.setItem('taskFlowTasks', JSON.stringify(tasks));
}

function loadUserTasks() {
    allTasks = getUserTasks();
    updateAllCounts();
    refreshTaskDisplay();
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;
    const deadline = document.getElementById('taskDeadline').value;
    const category = document.getElementById('taskCategory').value.trim();

    try {
        if (!title) throw new Error('Task title is required');
        if (!priority) throw new Error('Priority is required');
        if (!status) throw new Error('Status is required');
        if (!deadline) throw new Error('Deadline is required');

        const taskData = {
            title,
            description,
            priority,
            status,
            deadline: new Date(deadline).toISOString(),
            category: category || 'General',
            updatedAt: new Date().toISOString()
        };

        if (editingTaskId) {
            taskData.id = editingTaskId;
            saveTaskToStorage(taskData);
            showToast('Task updated! ✨', 'success');
        } else {
            saveTaskToStorage(taskData);
            showToast('Task created! 🎯', 'success');
        }

        loadUserTasks();
        closeTaskModal();
    } catch (error) {
        showToast(error.message, 'error');
    }
});

function openTaskModal(task = null) {
    const title = document.getElementById('modalTitle');
    const deleteBtn = document.getElementById('deleteTaskBtn');

    if (task) {
        title.textContent = 'Edit Task';
        deleteBtn.style.display = 'inline-block';

        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskStatus').value = task.status;
        document.getElementById('taskCategory').value = task.category || '';

        const deadlineDate = new Date(task.deadline);
        document.getElementById('taskDeadline').value = formatDateTimeLocal(deadlineDate);

        editingTaskId = task.id;
        deleteBtn.onclick = () => deleteTask(task.id);
    } else {
        title.textContent = 'Create New Task';
        deleteBtn.style.display = 'none';
        editingTaskId = null;
        taskForm.reset();
    }

    taskModal.classList.add('active');
}

function closeTaskModal() {
    taskModal.classList.remove('active');
    taskForm.reset();
    editingTaskId = null;
}

function deleteTask(taskId) {
    if (!confirm('Delete this task permanently?')) return;

    try {
        deleteTaskFromStorage(taskId);
        showToast('Task deleted! 🗑️', 'success');
        loadUserTasks();
        closeTaskModal();
    } catch (error) {
        showToast('Error deleting task', 'error');
    }
}

function markTaskComplete(taskId) {
    const tasksData = localStorage.getItem('taskFlowTasks');
    let tasks = tasksData ? JSON.parse(tasksData) : [];

    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = 'Completed';
        task.completedAt = new Date().toISOString();
        task.updatedAt = new Date().toISOString();
        localStorage.setItem('taskFlowTasks', JSON.stringify(tasks));
        
        // Update user streak
        updateUserStreak();
        
        loadUserTasks();
        showToast('Task completed! 🎉', 'success');
    }
}

// ============================================
// 6. TASK FILTERING & DISPLAY
// ============================================

function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDisplayDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(task) {
    if (task.status === 'Completed') return false;
    return new Date(task.deadline) < new Date();
}

function isToday(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function getFilteredTasks() {
    let filtered = [...allTasks];

    // Filter by view
    if (currentView === 'pending') {
        filtered = filtered.filter(t => t.status === 'Pending');
    } else if (currentView === 'in-progress') {
        filtered = filtered.filter(t => t.status === 'In Progress');
    } else if (currentView === 'completed') {
        filtered = filtered.filter(t => t.status === 'Completed');
    } else if (currentView === 'overdue') {
        filtered = filtered.filter(t => isOverdue(t));
    } else if (currentView === 'today') {
        filtered = filtered.filter(t => isToday(t.deadline));
    } else if (currentView === 'high-priority') {
        filtered = filtered.filter(t => t.priority === 'High');
    } else if (currentView === 'medium-priority') {
        filtered = filtered.filter(t => t.priority === 'Medium');
    } else if (currentView === 'low-priority') {
        filtered = filtered.filter(t => t.priority === 'Low');
    }

    // Filter by priority filter (dashboard and My Tasks)
    if (currentFilter !== 'all') {
        filtered = filtered.filter(t => t.priority === currentFilter);
    }

    // Filter by search
    if (searchInput.value.trim()) {
        const search = searchInput.value.toLowerCase();
        filtered = filtered.filter(t =>
            t.title.toLowerCase().includes(search) ||
            t.description.toLowerCase().includes(search) ||
            t.category.toLowerCase().includes(search)
        );
    }

    // Sort by priority in My Tasks, otherwise sort by deadline
    if (currentView === 'my-tasks') {
        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        filtered.sort((a, b) => {
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            return priorityDiff !== 0 ? priorityDiff : new Date(a.deadline) - new Date(b.deadline);
        });
    } else {
        filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    }

    return filtered;
}

function createTaskCard(task) {
    const taskCard = document.createElement('div');
    taskCard.className = `task-card priority-${task.priority.toLowerCase()}`;

    if (isOverdue(task)) {
        taskCard.classList.add('task-overdue');
    }

    const isOverdueTask = isOverdue(task);

    taskCard.innerHTML = `
        <div class="task-header">
            <h3 class="task-title">${escapeHtml(task.title)}</h3>
            <span class="task-priority-badge ${task.priority.toLowerCase()}">${task.priority}</span>
        </div>

        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}

        <span class="task-status-badge ${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span>

        <div class="task-meta">
            <div class="task-meta-item">
                <span class="task-meta-icon">📅</span>
                <span>${formatDisplayDate(task.deadline)}</span>
            </div>
            ${task.category ? `
                <div class="task-meta-item">
                    <span class="task-meta-icon">🏷️</span>
                    <span>${escapeHtml(task.category)}</span>
                </div>
            ` : ''}
        </div>

        ${isOverdueTask ? `<div class="task-overdue-label">🚨 OVERDUE - Act Now!</div>` : ''}

        <div class="task-actions">
            <button class="task-action-btn" onclick="openTaskModal(allTasks.find(t => t.id === '${task.id}'))">Edit</button>
            <button class="task-action-btn" onclick="markTaskComplete('${task.id}')">Done</button>
        </div>
    `;

    taskCard.addEventListener('click', (e) => {
        if (!e.target.classList.contains('task-action-btn')) {
            openTaskModal(task);
        }
    });

    return taskCard;
}

function renderTasks(container, tasks) {
    container.innerHTML = '';

    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📭</span>
                <h3>No tasks found</h3>
                <p>Create a new task or adjust your filters</p>
            </div>
        `;
        return;
    }

    tasks.forEach(task => {
        container.appendChild(createTaskCard(task));
    });
}

function refreshTaskDisplay() {
    const filtered = getFilteredTasks();

    // Dashboard
    renderTasks(document.getElementById('dashboardTasks'), filtered);

    // My Tasks
    renderTasks(document.getElementById('myTasks'), getFilteredTasks());

    // Today
    renderTasks(document.getElementById('todayTasks'),
        allTasks.filter(t => isToday(t.deadline)));

    // Pending
    renderTasks(document.getElementById('pendingTasks'),
        allTasks.filter(t => t.status === 'Pending'));

    // In Progress
    renderTasks(document.getElementById('inProgressTasks'),
        allTasks.filter(t => t.status === 'In Progress'));

    // Completed
    renderTasks(document.getElementById('completedTasks'),
        allTasks.filter(t => t.status === 'Completed'));

    // Overdue
    renderTasks(document.getElementById('overdueTasks'),
        allTasks.filter(t => isOverdue(t)));

    // Priority Views
    renderTasks(document.getElementById('highPriorityTasks'),
        allTasks.filter(t => t.priority === 'High'));

    renderTasks(document.getElementById('mediumPriorityTasks'),
        allTasks.filter(t => t.priority === 'Medium'));

    renderTasks(document.getElementById('lowPriorityTasks'),
        allTasks.filter(t => t.priority === 'Low'));
}

// ============================================
// 7. STATISTICS & COUNTS
// ============================================

function updateAllCounts() {
    const total = allTasks.length;
    const pending = allTasks.filter(t => t.status === 'Pending').length;
    const inProgress = allTasks.filter(t => t.status === 'In Progress').length;
    const completed = allTasks.filter(t => t.status === 'Completed').length;
    const overdue = allTasks.filter(t => isOverdue(t)).length;
    const today = allTasks.filter(t => isToday(t.deadline)).length;
    const high = allTasks.filter(t => t.priority === 'High').length;
    const medium = allTasks.filter(t => t.priority === 'Medium').length;
    const low = allTasks.filter(t => t.priority === 'Low').length;

    // Update counts in sidebar
    document.getElementById('dashCount').textContent = total;
    document.getElementById('myTasksCount').textContent = total;
    document.getElementById('todayCount').textContent = today;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('inProgressCount').textContent = inProgress;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('overdueCount').textContent = overdue;
    document.getElementById('highCount').textContent = high;
    document.getElementById('mediumCount').textContent = medium;
    document.getElementById('lowCount').textContent = low;

    // Update dashboard stats
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('inProgressTasks').textContent = inProgress;
    document.getElementById('completedTasks').textContent = completed;

    // Update completion rate
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
    document.getElementById('completionRate').textContent = completionRate + '%';

    // Update today count
    document.getElementById('todayTaskCount').textContent = today;

    // Update overdue count
    document.getElementById('overdueTaskCount').textContent = overdue;

    // Update streak
    document.getElementById('streakDays').textContent = currentUser.streakDays + ' days 🔥';

    // Update notification badge
    notificationCount = overdue;
    document.getElementById('notificationBadge').textContent = notificationCount;

    // Update progress bars with animation
    if (total > 0) {
        const percentages = {
            'pendingTasks': (pending / total) * 100,
            'inProgressTasks': (inProgress / total) * 100,
            'completedTasks': (completed / total) * 100,
            'totalTasks': (completed / total) * 100
        };

        document.querySelectorAll('.progress-bar').forEach(bar => {
            bar.style.width = (completed / total) * 100 + '%';
        });
    }
}

function updateUserStreak() {
    const lastLogin = new Date(currentUser.lastLogin);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastLogin.toDateString() !== today.toDateString()) {
        if (lastLogin.toDateString() === yesterday.toDateString()) {
            currentUser.streakDays++;
        } else {
            currentUser.streakDays = 1;
        }
        currentUser.lastLogin = today.toISOString();
        currentUser.totalCompleted = allTasks.filter(t => t.status === 'Completed').length;
        saveUser(currentUser);
    }
}

// ============================================
// 8. GREETING & DATE DISPLAY
// ============================================

function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = '👋 Welcome back';

    if (hour < 12) {
        greeting = '🌅 Good morning';
    } else if (hour < 18) {
        greeting = '🌤️ Good afternoon';
    } else {
        greeting = '🌙 Good evening';
    }

    document.getElementById('headerGreeting').textContent = greeting + '! Let\'s crush your goals';

    // Update today's date
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('en-US', options);
    document.getElementById('todayDate').textContent = `Tasks for ${dateStr}`;
}

// ============================================
// 9. EVENT LISTENERS
// ============================================

function initializeEventListeners() {
    // Auth Tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            switchAuthTab(e.target.closest('.auth-tab').dataset.tab);
        });
    });

    // Navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            switchView(e.currentTarget.dataset.view);
        });
    });

    // Filter buttons
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            refreshTaskDisplay();
        });
    });

    // Add task buttons
    document.querySelectorAll('[id^="addTaskBtn"]').forEach(btn => {
        btn.addEventListener('click', () => openTaskModal());
    });

    // Modal close
    document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
        btn.addEventListener('click', closeTaskModal);
    });

    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) closeTaskModal();
    });

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Search
    searchInput.addEventListener('input', refreshTaskDisplay);

    // Sidebar toggle
    sidebarToggle.addEventListener('click', () => {
        appSidebar.classList.toggle('open');
    });

    // Close sidebar on navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                appSidebar.classList.remove('open');
            }
        });
    });

    // User profile dropdown
    userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-profile')) {
            profileDropdown.classList.remove('active');
        }
    });

    // Password strength indicator
    const passwordInput = document.getElementById('signupPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', updatePasswordStrength);
    }
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

    event.target.closest('.auth-tab').classList.add('active');
    document.getElementById(tab === 'login' ? 'loginForm' : 'signupForm').classList.add('active');
}

function switchView(view) {
    currentView = view;
    currentFilter = 'all';

    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.menu-item').classList.add('active');

    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));

    const viewMap = {
        'dashboard': 'dashboardView',
        'my-tasks': 'myTasksView',
        'today': 'todayView',
        'pending': 'pendingView',
        'in-progress': 'inProgressView',
        'completed': 'completedView',
        'overdue': 'overdueView',
        'high-priority': 'highPriorityView',
        'medium-priority': 'mediumPriorityView',
        'low-priority': 'lowPriorityView'
    };

    if (document.getElementById(viewMap[view])) {
        document.getElementById(viewMap[view]).classList.add('active');
    }

    document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
    document.querySelector('[data-filter="all"]')?.classList.add('active');

    refreshTaskDisplay();
}

// ============================================
// 10. UTILITIES
// ============================================

function showAuthSection() {
    authSection.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

function showMainApp() {
    authSection.classList.add('hidden');
    mainApp.classList.remove('hidden');
}

function showToast(message, type = 'success') {
    toastNotification.textContent = message;
    toastNotification.className = `toast-notification show ${type}`;

    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('taskFlowTheme', isDark ? 'dark' : 'light');
    document.getElementById('themeIcon').textContent = isDark ? '☀️' : '🌙';

    if (currentUser) {
        currentUser.theme = isDark ? 'dark' : 'light';
        saveUser(currentUser);
    }
}

function loadThemePreference() {
    const theme = localStorage.getItem('taskFlowTheme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeIcon').textContent = '☀️';
    }
}

function resetForms() {
    loginForm.reset();
    signupForm.reset();
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('signupError').classList.remove('show');
}

function updatePasswordStrength() {
    const password = document.getElementById('signupPassword').value;
    const strengthBar = document.querySelector('.strength-bar::after');
    const strengthText = document.getElementById('strengthText');

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 25;

    const strengthBar_el = document.querySelector('.strength-bar');
    strengthBar_el.style.setProperty('--strength', strength + '%');

    let text = 'Weak';
    let color = '#ef4444';

    if (strength >= 75) {
        text = 'Strong';
        color = '#10b981';
    } else if (strength >= 50) {
        text = 'Fair';
        color = '#f59e0b';
    }

    strengthText.textContent = text;
    strengthBar_el.style.setProperty('--color', color);
}

// Initialize app
window.addEventListener('load', () => {
    const users = getAllUsers();
    if (users.length === 0 || !users.find(u => u.email === DEMO_USER.email)) {
        saveUser(DEMO_USER);
    }
});