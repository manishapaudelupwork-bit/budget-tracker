# 💰 Budget Tracker - Full Stack Application

A comprehensive budget tracking web application with user authentication, cloud storage, and advanced financial management features.

## Features

✨ **User Authentication**
- Secure registration and login
- JWT token-based authentication
- Password hashing with bcryptjs

📊 **Budget Management**
- Track income and expenses
- Monthly budget planning
- Budget vs Actual comparison charts
- Spending breakdown by category

🎯 **Savings Goals**
- Create multiple savings goals
- Track contributions over time
- Progress indicators with motivational messages
- Target date tracking

💳 **Debt Tracking**
- Monitor multiple debts
- Track payments and interest rates
- Payoff progress visualization
- Payment history

📈 **Analytics**
- Interactive charts (pie charts, bar charts)
- Visual spending breakdown
- Budget analysis with savings/overspend indicators

☁️ **Cloud Storage**
- All data stored in MongoDB
- Secure user data isolation
- Automatic data sync across devices

## Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB
- JWT Authentication
- bcryptjs for password hashing

**Frontend:**
- HTML5, CSS3, JavaScript
- Chart.js for visualizations
- Responsive design

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone/Download the project**
```bash
cd /path/to/Tracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the root directory:
```
MONGODB_URI=mongodb://localhost:27017/budget-tracker
JWT_SECRET=your-super-secret-key-change-this-in-production
PORT=5000
```

For MongoDB Atlas (cloud):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/budget-tracker
```

4. **Start MongoDB** (if using local)
```bash
mongod
```

5. **Start the server**
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

6. **Open the app**
Navigate to: `http://localhost:5000`

## Deployment

### Deploy to Heroku

1. **Install Heroku CLI**
```bash
npm install -g heroku
```

2. **Login to Heroku**
```bash
heroku login
```

3. **Create Heroku app**
```bash
heroku create your-app-name
```

4. **Set environment variables**
```bash
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-secret-key
```

5. **Deploy**
```bash
git push heroku main
```

### Deploy to Netlify (Frontend Only)

If you want to host the frontend separately:

1. Build the frontend files
2. Deploy the `public` folder to Netlify
3. Update `API_URL` in `public/app.js` to your backend URL

## Usage

### Register/Login
- Create a new account or login with existing credentials
- Your data is securely stored and synced

### Add Income
- Click "Add Income" section
- Enter source, amount, date, and category
- Data is automatically saved to the cloud

### Track Expenses
- Add expenses with category and budget
- See real-time budget vs actual comparison
- Visual progress indicators

### Savings Goals
- Create goals with target amount and date
- Add contributions over time
- Get motivational messages as you progress

### Debt Management
- Track multiple debts with interest rates
- Record payments
- Monitor payoff progress

### View Analytics
- See spending breakdown by category
- Compare budget vs actual spending
- Monthly trends and patterns

## File Structure

```
Tracker/
├── server.js              # Express server
├── package.json           # Dependencies
├── .env                   # Environment variables
├── README.md              # This file
└── public/
    ├── app.html           # Main app page
    ├── app.js             # Frontend logic
    └── styles.css         # Styling
```

## Security Notes

⚠️ **Important for Production:**
1. Change `JWT_SECRET` in `.env` to a strong random string
2. Use HTTPS in production
3. Set up CORS properly for your domain
4. Use MongoDB Atlas for production databases
5. Enable rate limiting on API endpoints
6. Add input validation and sanitization

## Troubleshooting

**Port already in use:**
```bash
# Change PORT in .env or use:
PORT=3000 npm start
```

**MongoDB connection error:**
- Ensure MongoDB is running
- Check connection string in .env
- For Atlas, whitelist your IP address

**CORS errors:**
- Update `cors()` in server.js with your frontend URL
- Example: `cors({ origin: 'https://yourdomain.com' })`

## Future Enhancements

- 📱 Mobile app (React Native)
- 🔔 Notifications and reminders
- 📧 Email reports
- 💱 Multi-currency support
- 🤖 AI spending recommendations
- 📊 Advanced analytics and forecasting
- 👥 Family budget sharing

## License

MIT

## Support

For issues or questions, please create an issue in the repository.

---

**Made with ❤️ for better financial management**
