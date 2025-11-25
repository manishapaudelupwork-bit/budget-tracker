const API_URL = 'https://budget-tracker-production-6e09.up.railway.app/api';
let currentUser = null;
let currentMonth = new Date();
let allData = { income: [], expenses: [], savings: [], debt: [] };
let groceryData = [];
let spendingChart = null;
let budgetChart = null;

// Auth Functions
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    document.getElementById(tab + 'Tab').classList.add('active');
}

function switchPage(page) {
    document.querySelectorAll('.page-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
    document.getElementById(page + 'Page').style.display = 'block';
    document.getElementById(page + 'Tab').classList.add('active');
    
    if (page === 'groceries') {
        loadGroceryData();
    } else {
        loadBudgetData();
    }
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
            currentUser = data.user;
            showApp();
        } else {
            document.getElementById('registerMessage').textContent = data.error || 'Registration failed';
        }
    } catch (error) {
        console.error('Registration error:', error);
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
            currentUser = data.user;
            showApp();
        } else {
            document.getElementById('loginMessage').textContent = data.error || 'Login failed';
        }
    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('loginMessage').textContent = 'Login failed';
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

function showApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('userEmail').textContent = currentUser.email;
    loadBudgetData();
}

window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    if (token) {
        fetch(`${API_URL}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : null)
          .then(data => {
              if (data) {
                  currentUser = data.user;
                  showApp();
              }
          });
    }
});

// Budget Functions
function getMonthKey() {
    return currentMonth.toISOString().slice(0, 7);
}

async function loadBudgetData() {
    const token = localStorage.getItem('token');
    const month = getMonthKey();
    
    try {
        const response = await fetch(`${API_URL}/budget/${month}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            allData = await response.json();
        }
        updateBudgetUI();
    } catch (error) {
        console.error('Error loading budget:', error);
    }
}

function updateBudgetUI() {
    const income = allData.income || [];
    const expenses = allData.expenses || [];
    
    const totalIncome = income.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const totalExpense = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    
    document.getElementById('totalIncome').textContent = '$' + totalIncome.toFixed(2);
    document.getElementById('totalExpense').textContent = '$' + totalExpense.toFixed(2);
    document.getElementById('balance').textContent = '$' + (totalIncome - totalExpense).toFixed(2);
    
    updateIncomeTable();
    updateExpenseTable();
    updateCharts();
}

function updateIncomeTable() {
    const tbody = document.querySelector('#incomeTable');
    tbody.innerHTML = '';
    
    if (!allData.income || allData.income.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No income</td></tr>';
        return;
    }
    
    allData.income.forEach((item, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.source}</td>
            <td>${item.category || '-'}</td>
            <td class="amount-positive">$${parseFloat(item.amount).toFixed(2)}</td>
            <td>${item.date}</td>
            <td><button class="delete-btn" onclick="deleteIncome(${index})">Delete</button></td>
        `;
    });
}

function updateExpenseTable() {
    const tbody = document.querySelector('#expenseTable');
    tbody.innerHTML = '';
    
    if (!allData.expenses || allData.expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No expenses</td></tr>';
        return;
    }
    
    allData.expenses.forEach((item, index) => {
        const budget = parseFloat(item.budget || 0);
        const amount = parseFloat(item.amount || 0);
        const percentage = budget > 0 ? (amount / budget * 100) : 0;
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td class="amount-negative">$${amount.toFixed(2)}</td>
            <td>$${budget.toFixed(2)}</td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                ${percentage.toFixed(0)}%
            </td>
            <td><button class="delete-btn" onclick="deleteExpense(${index})">Delete</button></td>
        `;
    });
}

function updateCharts() {
    // Spending Breakdown
    const expenses = allData.expenses || [];
    const categoryTotals = {};
    
    expenses.forEach(exp => {
        const cat = exp.category || 'Other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(exp.amount || 0);
    });
    
    const ctx1 = document.getElementById('spendingChart');
    if (ctx1) {
        if (spendingChart) spendingChart.destroy();
        spendingChart = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [{
                    data: Object.values(categoryTotals),
                    backgroundColor: ['#ffc0d9', '#b5ead7', '#c7ceea', '#ffdab9', '#ffb3d0', '#a8d8ea']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    
    // Budget vs Actual
    const ctx2 = document.getElementById('budgetChart');
    if (ctx2) {
        if (budgetChart) budgetChart.destroy();
        budgetChart = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [
                    {
                        label: 'Actual',
                        data: Object.values(categoryTotals),
                        backgroundColor: '#ffc0d9'
                    },
                    {
                        label: 'Budget',
                        data: expenses.map(e => parseFloat(e.budget || 0)),
                        backgroundColor: '#c7ceea'
                    }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

async function addIncome() {
    const source = document.getElementById('incomeSource').value;
    const amount = document.getElementById('incomeAmount').value;
    const date = document.getElementById('incomeDate').value;
    const category = document.getElementById('incomeCategory').value;
    
    if (!source || !amount || !date) return;
    
    if (!allData.income) allData.income = [];
    allData.income.push({ source, amount, date, category });
    
    await saveBudgetData();
    document.getElementById('incomeSource').value = '';
    document.getElementById('incomeAmount').value = '';
    document.getElementById('incomeDate').value = '';
}

async function addExpense() {
    const name = document.getElementById('expenseName').value;
    const amount = document.getElementById('expenseAmount').value;
    const budget = document.getElementById('expenseBudget').value;
    const category = document.getElementById('expenseCategory').value;
    
    if (!name || !amount || !category) return;
    
    if (!allData.expenses) allData.expenses = [];
    allData.expenses.push({ name, amount, budget: budget || amount, category });
    
    await saveBudgetData();
    document.getElementById('expenseName').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseBudget').value = '';
    document.getElementById('expenseCategory').value = '';
}

async function addSaving() {
    const name = document.getElementById('savingName').value;
    const target = document.getElementById('savingTarget').value;
    const targetDate = document.getElementById('savingTargetDate').value;
    const initial = document.getElementById('savingInitial').value;
    
    if (!name || !target) return;
    
    if (!allData.savings) allData.savings = [];
    allData.savings.push({ name, target, targetDate, initial: initial || 0, current: initial || 0 });
    
    await saveBudgetData();
    document.getElementById('savingName').value = '';
    document.getElementById('savingTarget').value = '';
    document.getElementById('savingTargetDate').value = '';
    document.getElementById('savingInitial').value = '';
}

function deleteIncome(index) {
    allData.income.splice(index, 1);
    saveBudgetData();
}

function deleteExpense(index) {
    allData.expenses.splice(index, 1);
    saveBudgetData();
}

async function saveBudgetData() {
    const token = localStorage.getItem('token');
    const month = getMonthKey();
    
    try {
        await fetch(`${API_URL}/budget/${month}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(allData)
        });
        
        updateBudgetUI();
    } catch (error) {
        console.error('Error saving budget:', error);
    }
}

function previousMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    updateMonthDisplay();
    loadBudgetData();
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    updateMonthDisplay();
    loadBudgetData();
}

function updateMonthDisplay() {
    const options = { year: 'numeric', month: 'long' };
    document.getElementById('monthDisplay').textContent = currentMonth.toLocaleDateString('en-US', options);
}

// Grocery Functions
async function loadGroceryData() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_URL}/global-data`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            groceryData = data.savings || [];
            updateGroceryUI();
        }
    } catch (error) {
        console.error('Error loading grocery data:', error);
    }
}

function updateGroceryUI() {
    const items = groceryData || [];
    const totalItems = items.length;
    const totalCost = items.reduce((sum, item) => sum + (parseFloat(item.amount || 0) * parseFloat(item.quantity || 1)), 0);
    const purchased = items.filter(item => item.status === 'purchased').length;
    const pending = totalItems - purchased;
    
    document.getElementById('totalGroceryItems').textContent = totalItems;
    document.getElementById('totalGroceryCost').textContent = '$' + totalCost.toFixed(2);
    document.getElementById('purchasedItems').textContent = purchased;
    document.getElementById('pendingItems').textContent = pending;
    
    updateGroceryTable();
}

function updateGroceryTable() {
    const tbody = document.querySelector('#groceryTable tbody');
    tbody.innerHTML = '';
    
    (groceryData || []).forEach((item, index) => {
        const total = (parseFloat(item.amount || 0) * parseFloat(item.quantity || 1)).toFixed(2);
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity}</td>
            <td>$${parseFloat(item.amount).toFixed(2)}</td>
            <td>$${total}</td>
            <td>
                <select onchange="updateGroceryStatus(${index}, this.value)">
                    <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="purchased" ${item.status === 'purchased' ? 'selected' : ''}>Purchased</option>
                </select>
            </td>
            <td><button class="delete-btn" onclick="deleteGroceryItem(${index})">Delete</button></td>
        `;
    });
}

async function addGroceryItem() {
    const name = document.getElementById('groceryName').value;
    const quantity = document.getElementById('groceryQuantity').value;
    const price = document.getElementById('groceryPrice').value;
    const category = document.getElementById('groceryCategory').value;
    
    if (!name || !quantity || !price || !category) return;
    
    if (!groceryData) groceryData = [];
    groceryData.push({
        name,
        quantity,
        amount: price,
        category,
        status: 'pending'
    });
    
    await saveGroceryData();
    document.getElementById('groceryName').value = '';
    document.getElementById('groceryQuantity').value = '';
    document.getElementById('groceryPrice').value = '';
    document.getElementById('groceryCategory').value = '';
}

function updateGroceryStatus(index, status) {
    groceryData[index].status = status;
    saveGroceryData();
}

function deleteGroceryItem(index) {
    groceryData.splice(index, 1);
    saveGroceryData();
}

async function saveGroceryData() {
    const token = localStorage.getItem('token');
    
    try {
        await fetch(`${API_URL}/global-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ savings: groceryData, debt: [] })
        });
        
        updateGroceryUI();
    } catch (error) {
        console.error('Error saving grocery data:', error);
    }
}

updateMonthDisplay();
