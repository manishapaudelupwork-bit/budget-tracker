const API_URL = 'https://budget-tracker-production-6e09.up.railway.app/api';
let currentUser = null;
let currentMonth = new Date();
let allData = {};
let spendingChart, budgetChart;
let currentSavingIdx = null;
let currentDebtIdx = null;

// Auth Functions
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
}

// App Tab Switching
function switchApp(app) {
    document.querySelectorAll('.app-tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.app-tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(app + 'App').style.display = 'block';
    event.target.classList.add('active');
}

async function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    
    if (!name || !email || !password || !confirm) {
        document.getElementById('registerMessage').textContent = 'All fields required';
        return;
    }
    
    if (password !== confirm) {
        document.getElementById('registerMessage').textContent = 'Passwords do not match';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            currentUser = data.user;
            showApp();
        } else {
            document.getElementById('registerMessage').textContent = data.error;
        }
    } catch (error) {
        document.getElementById('registerMessage').textContent = 'Registration failed';
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        document.getElementById('loginMessage').textContent = 'Email and password required';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            currentUser = data.user;
            showApp();
        } else {
            document.getElementById('loginMessage').textContent = data.error;
        }
    } catch (error) {
        document.getElementById('loginMessage').textContent = 'Login failed';
    }
}

// Check if user is already logged in on page load
window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('currentUser');
    
    if (token && userStr) {
        try {
            currentUser = JSON.parse(userStr);
            showApp();
        } catch (e) {
            console.error('Error parsing user:', e);
        }
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    currentUser = null;
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
}

function showApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('incomeDate').valueAsDate = new Date();
    updateMonthDisplay();
    loadData();
}

// Check if user is logged in
window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    if (token) {
        // Verify token is still valid
        fetch(`${API_URL}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => {
            if (res.ok) {
                currentUser = JSON.parse(localStorage.getItem('user'));
                showApp();
            }
        }).catch(() => {
            localStorage.removeItem('token');
        });
    }
});

// Budget Functions
function getMonthKey() {
    return currentMonth.toISOString().slice(0, 7);
}

function getCurrentData() {
    const key = getMonthKey();
    if (!allData[key]) {
        allData[key] = { income: [], expenses: [] };
    }
    return allData[key];
}

function getGlobalSavings() {
    if (!allData.globalSavings) allData.globalSavings = [];
    return allData.globalSavings;
}

function getGlobalDebt() {
    if (!allData.globalDebt) allData.globalDebt = [];
    return allData.globalDebt;
}

function updateMonthDisplay() {
    const options = { month: 'long', year: 'numeric' };
    document.getElementById('monthDisplay').textContent = currentMonth.toLocaleDateString('en-US', options);
}

function previousMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    updateMonthDisplay();
    loadData();
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    updateMonthDisplay();
    loadData();
}

async function loadData() {
    const token = localStorage.getItem('token');
    const month = getMonthKey();
    
    try {
        const response = await fetch(`${API_URL}/budget/${month}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const budget = await response.json();
            const data = getCurrentData();
            data.income = budget.income || [];
            data.expenses = budget.expenses || [];
        }
        
        // Load global data
        const globalResponse = await fetch(`${API_URL}/global-data`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (globalResponse.ok) {
            const globalData = await globalResponse.json();
            allData.globalSavings = globalData.savings || [];
            allData.globalDebt = globalData.debt || [];
        }
        
        update();
    } catch (error) {
        console.error('Load error:', error);
    }
}

async function saveData() {
    const token = localStorage.getItem('token');
    const month = getMonthKey();
    const data = getCurrentData();
    
    try {
        await fetch(`${API_URL}/budget/${month}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                income: data.income,
                expenses: data.expenses
            })
        });
        
        // Save global data
        await fetch(`${API_URL}/global-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                savings: getGlobalSavings(),
                debt: getGlobalDebt()
            })
        });
    } catch (error) {
        console.error('Save error:', error);
    }
}

function addIncome() {
    const source = document.getElementById('incomeSource').value.trim();
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    const date = document.getElementById('incomeDate').value;
    const category = document.getElementById('incomeCategory').value;
    
    if (!source || !amount || amount <= 0 || !date || !category) {
        alert('Fill all fields');
        return;
    }
    
    getCurrentData().income.push({ source, amount, date, category });
    document.getElementById('incomeSource').value = '';
    document.getElementById('incomeAmount').value = '';
    document.getElementById('incomeDate').valueAsDate = new Date();
    document.getElementById('incomeCategory').value = '';
    saveData();
    update();
}

function addExpense() {
    const name = document.getElementById('expenseName').value.trim();
    const category = document.getElementById('expenseCategory').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const budget = parseFloat(document.getElementById('expenseBudget').value) || 0;
    
    if (!name || !category || !amount || amount <= 0) {
        alert('Fill required fields');
        return;
    }
    
    getCurrentData().expenses.push({ name, category, amount, budget });
    document.getElementById('expenseName').value = '';
    document.getElementById('expenseCategory').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseBudget').value = '';
    saveData();
    update();
}

function deleteIncome(idx) {
    getCurrentData().income.splice(idx, 1);
    saveData();
    update();
}

function deleteExpense(idx) {
    getCurrentData().expenses.splice(idx, 1);
    saveData();
    update();
}

function addSaving() {
    const name = document.getElementById('savingName').value.trim();
    const target = parseFloat(document.getElementById('savingTarget').value);
    const targetDate = document.getElementById('savingTargetDate').value;
    const initial = parseFloat(document.getElementById('savingInitial').value) || 0;
    
    if (!name || !target || target <= 0 || !targetDate) {
        alert('Fill all fields');
        return;
    }
    
    getGlobalSavings().push({ name, target, targetDate, current: initial, contributions: initial > 0 ? [{ amount: initial, date: new Date().toISOString().split('T')[0] }] : [] });
    document.getElementById('savingName').value = '';
    document.getElementById('savingTarget').value = '';
    document.getElementById('savingTargetDate').value = '';
    document.getElementById('savingInitial').value = '';
    saveData();
    update();
}

function openContributionModal(idx) {
    currentSavingIdx = idx;
    document.getElementById('contributionAmount').value = '';
    document.getElementById('contributionDate').valueAsDate = new Date();
    document.getElementById('addContributionModal').style.display = 'block';
}

function closeContributionModal() {
    document.getElementById('addContributionModal').style.display = 'none';
    currentSavingIdx = null;
}

function saveContribution() {
    if (currentSavingIdx === null) return;
    const amount = parseFloat(document.getElementById('contributionAmount').value);
    const date = document.getElementById('contributionDate').value;
    
    if (!amount || amount <= 0) {
        alert('Enter valid amount');
        return;
    }
    
    const savings = getGlobalSavings();
    const saving = savings[currentSavingIdx];
    if (!saving.contributions) saving.contributions = [];
    saving.contributions.push({ amount, date });
    saving.current = saving.contributions.reduce((sum, c) => sum + c.amount, 0);
    saveData();
    closeContributionModal();
    update();
}

function deleteSaving(idx) {
    getGlobalSavings().splice(idx, 1);
    saveData();
    update();
}

function addDebt() {
    const name = document.getElementById('debtName').value.trim();
    const amount = parseFloat(document.getElementById('debtAmount').value);
    const rate = parseFloat(document.getElementById('debtRate').value) || 0;
    
    if (!name || !amount || amount <= 0) {
        alert('Fill all fields');
        return;
    }
    
    getGlobalDebt().push({ name, amount, rate, paid: 0, payments: [] });
    document.getElementById('debtName').value = '';
    document.getElementById('debtAmount').value = '';
    document.getElementById('debtRate').value = '';
    saveData();
    update();
}

function openPaymentModal(idx) {
    currentDebtIdx = idx;
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentDate').valueAsDate = new Date();
    document.getElementById('addPaymentModal').style.display = 'block';
}

function closePaymentModal() {
    document.getElementById('addPaymentModal').style.display = 'none';
    currentDebtIdx = null;
}

function savePayment() {
    if (currentDebtIdx === null) return;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const date = document.getElementById('paymentDate').value;
    
    if (!amount || amount <= 0) {
        alert('Enter valid amount');
        return;
    }
    
    const debts = getGlobalDebt();
    const debt = debts[currentDebtIdx];
    if (!debt.payments) debt.payments = [];
    debt.payments.push({ amount, date });
    debt.paid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
    saveData();
    closePaymentModal();
    update();
}

function deleteDebt(idx) {
    getGlobalDebt().splice(idx, 1);
    saveData();
    update();
}

function updateStats() {
    const data = getCurrentData();
    const totalIncome = data.income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = data.expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalDebt = getGlobalDebt().reduce((sum, item) => sum + item.amount, 0);
    const balance = totalIncome - totalExpense;
    
    document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('totalExpense').textContent = `$${totalExpense.toFixed(2)}`;
    document.getElementById('balance').textContent = `$${balance.toFixed(2)}`;
    document.getElementById('totalDebt').textContent = `$${totalDebt.toFixed(2)}`;
}

function updateIncomeTable() {
    const data = getCurrentData();
    const tbody = document.getElementById('incomeTable');
    
    if (data.income.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No income</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.income.map((item, idx) => `
        <tr>
            <td>${item.source}</td>
            <td>${item.category}</td>
            <td style="color: #ff9ec3; font-weight: 600;">+$${item.amount.toFixed(2)}</td>
            <td>${item.date}</td>
            <td><button class="delete-btn" onclick="deleteIncome(${idx})">Delete</button></td>
        </tr>
    `).join('');
}

function updateExpenseTable() {
    const data = getCurrentData();
    const tbody = document.getElementById('expenseTable');
    
    if (data.expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No expenses</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.expenses.map((item, idx) => {
        const pct = item.budget > 0 ? (item.amount / item.budget * 100) : 0;
        return `
            <tr>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td style="color: #7fdbca; font-weight: 600;">-$${item.amount.toFixed(2)}</td>
                <td>$${item.budget.toFixed(2)}</td>
                <td><div class="progress-bar"><div class="progress-fill" style="width: ${Math.min(pct, 100)}%"></div></div>${pct.toFixed(0)}%</td>
                <td><button class="delete-btn" onclick="deleteExpense(${idx})">Delete</button></td>
            </tr>
        `;
    }).join('');
}

function updateSavingsList() {
    const savings = getGlobalSavings();
    const container = document.getElementById('savingsList');
    
    if (savings.length === 0) {
        container.innerHTML = '<div class="empty-state">No savings goals</div>';
        return;
    }
    
    container.innerHTML = savings.map((item, idx) => {
        const pct = (item.current / item.target * 100).toFixed(1);
        const daysLeft = Math.ceil((new Date(item.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
        const remaining = (item.target - item.current).toFixed(2);
        
        let warningIcon = '', warningColor = '#c7ceea', warningMsg = '';
        const extraSaved = item.current - item.target;
        
        if (pct >= 100) {
            warningIcon = '🎉';
            warningColor = '#7fdbca';
            warningMsg = extraSaved > 0 ? `Goal Reached! You saved $${extraSaved.toFixed(2)} more!` : 'Goal Reached!';
        } else if (pct >= 90) {
            warningIcon = '🚀';
            warningColor = '#d4f1d4';
            warningMsg = 'Almost there! Just 10% to go!';
        } else if (pct >= 75) {
            warningIcon = '⭐';
            warningColor = '#ffe8d6';
            warningMsg = '75% complete - Great progress!';
        } else if (pct >= 50) {
            warningIcon = '💪';
            warningColor = '#ffdab9';
            warningMsg = 'Halfway there!';
        }
        
        return `
            <div style="margin-bottom: 15px; padding: 15px; background: #f9f9ff; border-radius: 8px; border-left: 5px solid ${warningColor};">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <strong style="color: #6b5b95;">${item.name}</strong>
                    <div style="display: flex; gap: 8px;">
                        <button class="edit-btn" onclick="openContributionModal(${idx})">+ Add</button>
                        <button class="delete-btn" onclick="deleteSaving(${idx})">Delete</button>
                    </div>
                </div>
                ${warningMsg ? `<div style="font-size: 0.9em; color: ${warningColor}; margin-bottom: 8px; font-weight: 600;">${warningIcon} ${warningMsg}</div>` : ''}
                <div style="font-size: 0.9em; color: #999; margin-bottom: 8px;">
                    <strong>Saved:</strong> $${item.current.toFixed(2)} / $${item.target.toFixed(2)} | <strong>Remaining:</strong> $${remaining}
                </div>
                <div style="font-size: 0.85em; color: #999; margin-bottom: 10px;">
                    <strong>Target Date:</strong> ${item.targetDate} (${daysLeft > 0 ? daysLeft + ' days left' : daysLeft === 0 ? 'Today!' : 'Deadline passed'})
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(pct, 100)}%; background: linear-gradient(90deg, ${warningColor} 0%, ${warningColor} 100%);"></div>
                </div>
                <div style="font-size: 0.85em; color: #999; margin-top: 8px; text-align: right;">${pct}% complete</div>
            </div>
        `;
    }).join('');
}

function updateDebtList() {
    const debts = getGlobalDebt();
    const container = document.getElementById('debtList');
    
    if (debts.length === 0) {
        container.innerHTML = '<div class="empty-state">No debts</div>';
        return;
    }
    
    container.innerHTML = debts.map((item, idx) => {
        const interest = (item.amount * item.rate / 100).toFixed(2);
        const paid = item.paid || 0;
        const remaining = (item.amount - paid).toFixed(2);
        const pct = (paid / item.amount * 100).toFixed(1);
        
        return `
            <div style="margin-bottom: 15px; padding: 15px; background: #f9f9ff; border-radius: 8px; border-left: 4px solid #ffdab9;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <strong style="color: #6b5b95;">${item.name}</strong>
                    <div style="display: flex; gap: 8px;">
                        <button class="edit-btn" onclick="openPaymentModal(${idx})">+ Pay</button>
                        <button class="delete-btn" onclick="deleteDebt(${idx})">Delete</button>
                    </div>
                </div>
                <div style="font-size: 0.9em; color: #999; margin-bottom: 8px;">
                    <strong>Total Debt:</strong> $${item.amount.toFixed(2)} | <strong>Paid:</strong> $${paid.toFixed(2)} | <strong>Remaining:</strong> $${remaining}
                </div>
                <div style="font-size: 0.85em; color: #999; margin-bottom: 10px;">
                    <strong>Interest Rate:</strong> ${item.rate}% ($${interest})
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(pct, 100)}%; background: linear-gradient(90deg, #ffdab9 0%, #ffb3c1 100%);"></div>
                </div>
                <div style="font-size: 0.85em; color: #999; margin-top: 8px; text-align: right;">${pct}% paid off</div>
            </div>
        `;
    }).join('');
}

function updateCharts() {
    const data = getCurrentData();
    const categoryBreakdown = {};
    data.expenses.forEach(item => {
        categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + item.amount;
    });
    
    const ctx1 = document.getElementById('spendingChart').getContext('2d');
    if (spendingChart) spendingChart.destroy();
    
    const total = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0);
    const labels = Object.keys(categoryBreakdown).map((cat, idx) => {
        const pct = ((Object.values(categoryBreakdown)[idx] / total) * 100).toFixed(1);
        return `${cat} (${pct}%)`;
    });
    
    spendingChart = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: Object.values(categoryBreakdown),
                backgroundColor: ['#ffc0d9', '#b5ead7', '#c7ceea', '#ffdab9', '#d4f1d4'],
                borderColor: 'white',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 12, weight: '600' }, padding: 15 }
                }
            }
        }
    });
    
    const categories = [...new Set(data.expenses.map(e => e.category))];
    const budgets = categories.map(cat => data.expenses.filter(e => e.category === cat).reduce((sum, item) => sum + item.budget, 0));
    const actuals = categories.map(cat => data.expenses.filter(e => e.category === cat).reduce((sum, item) => sum + item.amount, 0));
    
    const ctx2 = document.getElementById('budgetChart').getContext('2d');
    if (budgetChart) budgetChart.destroy();
    
    budgetChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
                { label: 'Budget', data: budgets, backgroundColor: '#c7ceea', borderRadius: 5 },
                { label: 'Actual', data: actuals, backgroundColor: '#ffc0d9', borderRadius: 5 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
        }
    });
}

function update() {
    updateStats();
    updateIncomeTable();
    updateExpenseTable();
    updateSavingsList();
    updateDebtList();
    updateCharts();
}

function updateCharts() {
    // Spending Breakdown - Pie Chart
    const expenses = allData.expenses || [];
    const categoryTotals = {};
    
    expenses.forEach(exp => {
        const cat = exp.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(exp.amount || 0);
    });
    
    const ctx1 = document.getElementById('spendingChart');
    if (ctx1 && Object.keys(categoryTotals).length > 0) {
        if (spendingChart) spendingChart.destroy();
        spendingChart = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [{
                    data: Object.values(categoryTotals),
                    backgroundColor: ['#ffc0d9', '#b5ead7', '#c7ceea', '#ffdab9', '#ffb3d0', '#a8d8ea', '#f7dc6f', '#bb8fce', '#85c1e2', '#f8b88b']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    
    // Budget vs Actual - Bar Chart (only if budget is provided)
    const expensesWithBudget = expenses.filter(exp => exp.budget && parseFloat(exp.budget) > 0);
    
    if (expensesWithBudget.length > 0) {
        const ctx2 = document.getElementById('budgetChart');
        if (ctx2) {
            if (budgetChart) budgetChart.destroy();
            budgetChart = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: expensesWithBudget.map(exp => exp.category),
                    datasets: [
                        {
                            label: 'Budget',
                            data: expensesWithBudget.map(exp => parseFloat(exp.budget || 0)),
                            backgroundColor: '#c7ceea',
                            borderRadius: 5
                        },
                        {
                            label: 'Actual',
                            data: expensesWithBudget.map(exp => parseFloat(exp.amount || 0)),
                            backgroundColor: '#ffc0d9',
                            borderRadius: 5
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }
    }
}

window.onclick = function(event) {
    const contributionModal = document.getElementById('addContributionModal');
    const paymentModal = document.getElementById('addPaymentModal');
    if (event.target === contributionModal) closeContributionModal();
    if (event.target === paymentModal) closePaymentModal();
};

// Savings and Debt Functions
function addSaving() {
    const name = document.getElementById('savingName').value;
    const target = document.getElementById('savingTarget').value;
    
    if (!name || !target) return;
    
    alert('Saving goal added: ' + name);
    document.getElementById('savingName').value = '';
    document.getElementById('savingTarget').value = '';
    document.getElementById('savingTargetDate').value = '';
    document.getElementById('savingInitial').value = '';
}

function addDebt() {
    const name = document.getElementById('debtName').value;
    const amount = document.getElementById('debtAmount').value;
    
    if (!name || !amount) return;
    
    alert('Debt added: ' + name);
    document.getElementById('debtName').value = '';
    document.getElementById('debtAmount').value = '';
}

// Grocery Functions
function addGroceryItem() {
    const name = document.getElementById('groceryName').value;
    const quantity = document.getElementById('groceryQuantity').value;
    const price = document.getElementById('groceryPrice').value;
    
    if (!name || !quantity || !price) return;
    
    alert('Grocery item added: ' + name);
    document.getElementById('groceryName').value = '';
    document.getElementById('groceryQuantity').value = '';
    document.getElementById('groceryPrice').value = '';
}
