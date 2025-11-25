# Budget Tracker - Deployment Guide

## Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier)
- Netlify account (free)
- Railway or Heroku account (for backend)

---

## Step 1: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Add IP `0.0.0.0/0` to Network Access
4. Create a database user
5. Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/budget-tracker?retryWrites=true&w=majority`

---

## Step 2: Deploy Backend to Railway

### Option A: Using Railway (Recommended - Easiest)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub"
4. Connect your GitHub repo
5. Add environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A strong random string
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
6. Railway will auto-deploy and give you a URL like: `https://your-app.railway.app`

### Option B: Using Heroku

1. Go to https://www.heroku.com
2. Create a new app
3. Connect to GitHub
4. Add environment variables in Settings → Config Vars
5. Deploy

---

## Step 3: Deploy Frontend to Netlify

1. Go to https://www.netlify.com
2. Click "Add new site" → "Deploy manually"
3. Drag and drop the `public` folder
4. Netlify will give you a URL like: `https://your-app.netlify.app`

---

## Step 4: Update API URL

After deploying backend, update `public/app.js`:

```javascript
const API_URL = 'https://your-app.railway.app/api';  // Replace with your backend URL
```

---

## Step 5: Update CORS in server.js

Update the CORS origins in `server.js` with your actual Netlify URL:

```javascript
origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-app.netlify.app'] 
    : '*',
```

---

## For Monetization

### Add Payment Processing (Stripe)

1. Install Stripe: `npm install stripe`
2. Add payment endpoints to `server.js`
3. Create subscription plans
4. Add payment UI to frontend

### Add User Subscription Tiers

- Free: Basic budget tracking
- Pro: Advanced analytics, unlimited budgets
- Premium: Priority support, API access

---

## Production Checklist

- [ ] MongoDB Atlas configured with strong password
- [ ] JWT_SECRET is a strong random string
- [ ] CORS origins updated to production domains
- [ ] Environment variables set in Railway/Heroku
- [ ] Backend deployed and tested
- [ ] Frontend deployed and API URL updated
- [ ] SSL/HTTPS enabled (automatic on Railway/Netlify)
- [ ] Error logging configured
- [ ] Database backups enabled

---

## Local Testing Before Deployment

```bash
# Install dependencies
npm install

# Set environment variables
export MONGODB_URI="your-mongodb-url"
export JWT_SECRET="your-secret"
export NODE_ENV="production"

# Start server
npm start
```

Visit `http://localhost:3000` to test.

---

## Support & Troubleshooting

- MongoDB connection issues: Check IP whitelist in Atlas
- CORS errors: Update origins in server.js
- Deployment fails: Check environment variables
- API not responding: Check backend logs in Railway/Heroku dashboard
