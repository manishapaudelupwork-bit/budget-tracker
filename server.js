const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://peppy-pothos-b4803c.netlify.app', 'https://budget-tracker-production-6e09.up.railway.app'] 
        : '*',
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection (with fallback to in-memory)
let mongoConnected = false;
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected successfully');
    mongoConnected = true;
}).catch(err => {
    console.warn('MongoDB connection failed. Running in memory mode:', err.message);
    mongoConnected = false;
});

// In-memory storage fallback
const inMemoryUsers = {};
const inMemoryBudgets = {};
const inMemoryGlobalData = {};

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Budget Data Schema
const budgetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: String,
    income: [{ source: String, amount: Number, date: String, category: String }],
    expenses: [{ name: String, category: String, amount: Number, budget: Number }],
    createdAt: { type: Date, default: Date.now }
});

// Global Data Schema (Savings & Debt)
const globalDataSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    savings: [{
        name: String,
        target: Number,
        targetDate: String,
        current: Number,
        contributions: [{ amount: Number, date: String }]
    }],
    debt: [{
        name: String,
        amount: Number,
        rate: Number,
        paid: Number,
        payments: [{ amount: Number, date: String }]
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Budget = mongoose.model('Budget', budgetSchema);
const GlobalData = mongoose.model('GlobalData', globalDataSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Routes

// Home route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/advanced-dashboard.html');
});

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }
        
        if (mongoConnected) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({ name, email, password: hashedPassword });
            await user.save();
            
            const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
            res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
        } else {
            if (inMemoryUsers[email]) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            
            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = Date.now().toString();
            inMemoryUsers[email] = { id: userId, name, email, password: hashedPassword };
            
            const token = jwt.sign({ id: userId, email }, JWT_SECRET);
            res.json({ token, user: { id: userId, name, email } });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (mongoConnected) {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ error: 'User not found' });
            }
            
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(400).json({ error: 'Invalid password' });
            }
            
            const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
            res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
        } else {
            const user = inMemoryUsers[email];
            if (!user) {
                return res.status(400).json({ error: 'User not found' });
            }
            
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(400).json({ error: 'Invalid password' });
            }
            
            const token = jwt.sign({ id: user.id, email }, JWT_SECRET);
            res.json({ token, user: { id: user.id, name: user.name, email } });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Budget Data
app.get('/api/budget/:month', authenticateToken, async (req, res) => {
    try {
        const { month } = req.params;
        
        if (mongoConnected) {
            let budget = await Budget.findOne({ userId: req.user.id, month });
            if (!budget) {
                budget = new Budget({ userId: req.user.id, month, income: [], expenses: [] });
                await budget.save();
            }
            res.json(budget);
        } else {
            const key = `${req.user.id}-${month}`;
            if (!inMemoryBudgets[key]) {
                inMemoryBudgets[key] = { userId: req.user.id, month, income: [], expenses: [] };
            }
            res.json(inMemoryBudgets[key]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save Budget Data
app.post('/api/budget/:month', authenticateToken, async (req, res) => {
    try {
        const { month } = req.params;
        const { income, expenses } = req.body;
        
        if (mongoConnected) {
            let budget = await Budget.findOne({ userId: req.user.id, month });
            if (!budget) {
                budget = new Budget({ userId: req.user.id, month, income, expenses });
            } else {
                budget.income = income;
                budget.expenses = expenses;
            }
            await budget.save();
            res.json(budget);
        } else {
            const key = `${req.user.id}-${month}`;
            inMemoryBudgets[key] = { userId: req.user.id, month, income, expenses };
            res.json(inMemoryBudgets[key]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Global Data (Savings & Debt)
app.get('/api/global-data', authenticateToken, async (req, res) => {
    try {
        if (mongoConnected) {
            let data = await GlobalData.findOne({ userId: req.user.id });
            if (!data) {
                data = new GlobalData({ userId: req.user.id, savings: [], debt: [] });
                await data.save();
            }
            res.json(data);
        } else {
            if (!inMemoryGlobalData[req.user.id]) {
                inMemoryGlobalData[req.user.id] = { userId: req.user.id, savings: [], debt: [] };
            }
            res.json(inMemoryGlobalData[req.user.id]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save Global Data
app.post('/api/global-data', authenticateToken, async (req, res) => {
    try {
        const { savings, debt } = req.body;
        
        if (mongoConnected) {
            let data = await GlobalData.findOne({ userId: req.user.id });
            if (!data) {
                data = new GlobalData({ userId: req.user.id, savings, debt });
            } else {
                data.savings = savings;
                data.debt = debt;
                data.updatedAt = new Date();
            }
            await data.save();
            res.json(data);
        } else {
            inMemoryGlobalData[req.user.id] = {
                userId: req.user.id,
                savings,
                debt,
                updatedAt: new Date()
            };
            res.json(inMemoryGlobalData[req.user.id]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
