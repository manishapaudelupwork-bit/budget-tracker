const API_URL = 'https://budget-tracker-production-6e09.up.railway.app/api';
let currentUser = null;
let currentMonth = new Date();
let allData = {};
let groceryData = {};

// Auth Functions
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    document.getElementById(tab + 'Tab').classList.add('active');
}

function switchApp(app) {
    document.querySelectorAll('.app-tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.app-tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(app + 'App').style.display = 'block';
    event.target.classList.add('active');
    
    if (app === 'grocery') {
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
        console.log('Registering with:', { name, email });
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            showApp();
        } else {
            document.getElementById('registerMessage').textContent = data.error || 'Registration failed';
        }
    } catch (error) {
        console.error('Registration error:', error);
        document.getElementById('registerMessage').textContent = 'Registration failed: ' + error.message;
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
            document.getElementById('loginMessage').textContent = data.error;
        }
    } catch (error) {
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

// Check if already logged in
window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    if (token) {
        fetch(`${API_URL}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => {
            if (res.ok) {
                return res.json();
            }
        }).then(data => {
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
            const data = await response.json();
            allData = data;
            updateBudgetUI();
        }
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
}

function updateIncomeTable() {
    const tbody = document.querySelector('#incomeTable tbody');
    tbody.innerHTML = '';
    
    (allData.income || []).forEach((item, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.source}</td>
            <td>$${parseFloat(item.amount).toFixed(2)}</td>
            <td>${item.date}</td>
            <td><button class="delete-btn" onclick="deleteIncome(${index})">Delete</button></td>
        `;
    });
}

function updateExpenseTable() {
    const tbody = document.querySelector('#expenseTable tbody');
    tbody.innerHTML = '';
    
    (allData.expenses || []).forEach((item, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.description}</td>
            <td>$${parseFloat(item.amount).toFixed(2)}</td>
            <td>${item.date}</td>
            <td><button class="delete-btn" onclick="deleteExpense(${index})">Delete</button></td>
        `;
    });
}

async function addIncome() {
    const source = document.getElementById('incomeSource').value;
    const amount = document.getElementById('incomeAmount').value;
    const date = document.getElementById('incomeDate').value;
    
    if (!source || !amount || !date) return;
    
    if (!allData.income) allData.income = [];
    allData.income.push({ source, amount, date });
    
    await saveBudgetData();
    document.getElementById('incomeSource').value = '';
    document.getElementById('incomeAmount').value = '';
    document.getElementById('incomeDate').value = '';
}

async function addExpense() {
    const description = document.getElementById('expenseSource').value;
    const amount = document.getElementById('expenseAmount').value;
    const date = document.getElementById('expenseDate').value;
    
    if (!description || !amount || !date) return;
    
    if (!allData.expenses) allData.expenses = [];
    allData.expenses.push({ description, amount, date });
    
    await saveBudgetData();
    document.getElementById('expenseSource').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseDate').value = '';
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

// Initialize
updateMonthDisplay();
