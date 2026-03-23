# SOC Shift Manager - Installation & Getting Started

## System Requirements

- **Python 3.8+** (for backend)
- **Node.js 14+** (for frontend)
- **npm or yarn** (package manager)
- 200MB disk space for dependencies

## Quick Start Guide

### 1. Backend Setup (Python/Flask)

Navigate to backend folder:
```bash
cd backend
```

Create Python virtual environment:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Initialize database with sample data:
```bash
python init_db.py
```

Start the backend server:
```bash
python app.py
```

✅ Backend running on: `http://localhost:5000`

### 2. Frontend Setup (React)

In a **new terminal**, navigate to frontend folder:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm start
```

✅ Frontend running on: `http://localhost:3000`

Browser will open automatically. If not, go to `http://localhost:3000`

## First-Time Usage

### 1. Initialize System
When you first load the app, the backend automatically initializes the database with default pay rules.

### 2. Create Analysts
- Go to **Analysts** page
- Click **Add Analyst**
- Fill in:
  - Employee ID (e.g., SOC001)
  - First Name & Last Name
  - Email address
  - Base hourly rate (in €, e.g., 18.50)
- Click **Create**

### 3. Check Pay Rules
- Go to **Pay Rules** page
- You'll see pre-configured rules:
  - Sunday: 1.75x (75% bonus)
  - Saturday: 1.5x (50% bonus)
  - Weekdays: 1.0x (regular)

### 4. Assign Your First Shift
- Go to **Shifts** page
- Click **Assign Shift**
- Select analyst, date, start/end times
- Click **Create**
- System automatically calculates:
  - Hours worked
  - Pay multiplier based on day
  - Total pay (base × multiplier)

### 5. View Reports
- Go to **Analytics** page
- Choose **Team Summary** or **Individual Analyst**
- See total hours and earnings

## Project Structure

```
soc-shift-manager/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── init_db.py            # Database initialization script
│   ├── requirements.txt        # Python dependencies
│   ├── README.md             # Backend documentation
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── api.js            # API client
│   │   ├── App.jsx           # Main app
│   │   ├── index.js          # Entry point
│   │   └── index.css         # Styles
│   ├── public/
│   │   └── index.html        # HTML template
│   ├── package.json          # NPM dependencies
│   ├── tailwind.config.js    # Tailwind configuration
│   ├── README.md             # Frontend documentation
│   └── .gitignore
├── README.md                 # This file
└── .github/                  # GitHub files
```

## Common Tasks

### Add a New Analyst
Analysts page → Add Analyst button → Fill form → Create

### Assign a Shift
Shifts page → Assign Shift button → Fill details → Create

### Edit a Shift
Shifts page → Click edit icon on shift card → Update → Save

### View Earnings Report
Analytics page → Select analyst or view team summary

### Configure Pay Rules
Pay Rules page → Add Pay Rule → Set multiplier for specific day

## Database

### Default Location
- SQLite database: `backend/soc_shift_manager.db`
- Auto-created on first run

### Sample Data
The `init_db.py` script creates:
- 4 sample analysts
- 60 sample shifts
- Default pay rules

To reload sample data:
```bash
cd backend
python init_db.py
```

## Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.8+

# Clear and reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Frontend won't connect to backend
- Ensure backend is running: `python app.py`
- Check backend is on port 5000
- Verify frontend `.env` has correct API URL

### Port already in use
- Backend: Change port in `app.py`: `app.run(port=5001)`
- Frontend: Change port: `PORT=3001 npm start`

### Database errors
```bash
# Delete database and restart (loses all data)
cd backend
rm soc_shift_manager.db
python app.py
```

## Deployment

### For Testing/Demo
Current setup is ready for local testing.

### For Production
See deployment sections in:
- `backend/README.md` - Gunicorn, Docker
- `frontend/README.md` - Build & hosting options

## Support & Next Steps

1. **Read the full README** for detailed feature documentation
2. **Check component pages** (Analytics, Shifts, etc.) for detailed guides
3. **Explore the API** at `http://localhost:5000/api` endpoints

## Key Features Summary

✅ **Manage Analysts** - Register SOC Level 1 analysts with base rates
✅ **Assign Shifts** - Create shifts with automatic time tracking
✅ **Premium Pay** - Automatic 75% bonus on Sundays, 50% on Saturdays
✅ **Historical Data** - Complete shift history and records
✅ **Analytics** - Detailed reports on hours and earnings
✅ **Custom Rules** - Configure pay multipliers for any day

---

**Happy Shift Managing! 🔐**
