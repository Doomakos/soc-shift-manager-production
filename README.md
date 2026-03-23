# SOC Shift Manager

A comprehensive application for managing SOC Level 1 analyst shifts, tracking hours, and calculating premium pay for special days (Sundays +75%, Saturdays +50%, etc.).

## 🎯 Features

- **Analyst Management**: Register and manage SOC Level 1 analysts with base hourly rates
- **Shift Assignment**: Assign shifts to analysts with automatic time tracking
- **Historical Data**: Complete shift history with timestamps and duration
- **Premium Pay Calculation**: Automatic calculation of pay multipliers for Sundays (+75%), Saturdays (+50%), and other configurable days
- **Analytics & Reports**: Individual and team-wide summaries of hours worked and earnings
- **Customizable Pay Rules**: Configure pay multipliers for any day or special occasion

## 📋 Tech Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: SQLAlchemy ORM (SQLite by default, supports PostgreSQL)
- **API**: RESTful API with CORS support

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: Lucide React

## 🚀 Quick Start

### Option 1: Docker (Recommended for Easy Setup) 🐳

The easiest way to run the application with sample data:

```bash
# Clone and run
git clone https://github.com/Doomakos/soc-shift-manager-docker.git
cd soc-shift-manager-docker
docker-compose up --build
```

**That's it!** Access the app at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

The application will automatically initialize with sample data including 12 analysts and 90 days of shift history.

📖 **See [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed Docker instructions**

### Option 2: Manual Setup (For Development)

#### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

#### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python init_db.py  # Initialize with sample data
python app.py
```

The backend will start on `http://localhost:5000`

#### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend will start on `http://localhost:3000`

## 📚 API Endpoints

### Analysts
- `GET /api/analysts` - Get all analysts
- `POST /api/analysts` - Create new analyst
- `GET /api/analysts/<id>` - Get analyst by ID
- `PUT /api/analysts/<id>` - Update analyst
- `DELETE /api/analysts/<id>` - Delete analyst

### Shifts
- `GET /api/shifts` - Get all shifts (with filters)
- `POST /api/shifts` - Create new shift
- `GET /api/shifts/<id>` - Get shift by ID
- `PUT /api/shifts/<id>` - Update shift
- `DELETE /api/shifts/<id>` - Delete shift

Query parameters for shifts:
- `analyst_id` - Filter by analyst
- `start_date` - Filter by start date (YYYY-MM-DD)
- `end_date` - Filter by end date (YYYY-MM-DD)

### Pay Rules
- `GET /api/pay-rules` - Get all active pay rules
- `POST /api/pay-rules` - Create new pay rule
- `PUT /api/pay-rules/<id>` - Update pay rule

### Analytics
- `GET /api/analytics/analyst-summary/<id>` - Get summary for specific analyst
- `GET /api/analytics/team-summary` - Get summary for entire team

Query parameters:
- `start_date` - Start date filter
- `end_date` - End date filter

## 💾 Database Models

### Analyst
```
- id: Primary Key
- employee_id: Unique identifier (e.g., SOC001)
- first_name: Analyst first name
- last_name: Analyst last name
- email: Contact email
- base_hourly_rate: Base hourly rate in EUR
- status: active/inactive/on_leave
- created_at: Creation timestamp
```

### Shift
```
- id: Primary Key
- analyst_id: Foreign Key to Analyst
- shift_date: Date of the shift
- start_time: Start time
- end_time: End time
- shift_type: morning/afternoon/night/standard
- hours_worked: Calculated automatically
- pay_multiplier: Applied based on day of week
- base_pay: Hours × Base Rate
- total_pay: Base Pay × Multiplier
- notes: Optional notes
```

### PayRule
```
- id: Primary Key
- rule_name: Name of the rule
- day_of_week: 0-6 (Monday=0, Sunday=6) or NULL for default
- multiplier: Pay multiplier (e.g., 1.75 for +75%)
- description: Rule description
- active: Boolean flag
```

## 🧮 Pay Multiplier Logic

The system automatically applies pay multipliers based on the shift date:
- **Sunday (default)**: 1.75x (75% premium)
- **Saturday (default)**: 1.5x (50% premium)
- **Weekdays (default)**: 1.0x (regular pay)

You can customize these rules through the Pay Rules management interface.

### Example Calculation
- Analyst: John Smith
- Base Rate: €15/hour
- Shift: Sunday, 8 hours
- Calculation:
  - Base Pay: 8h × €15 = €120
  - Multiplier: 1.75x (Sunday)
  - **Total Pay: €120 × 1.75 = €210**

## 📊 Dashboard Features

1. **Home Dashboard**: Quick overview and navigation
2. **Analyst Management**: CRUD operations for analysts
3. **Shift Management**: Assign shifts with filters by analyst and date range
4. **Analytics**: Individual and team summaries with earnings reports
5. **Pay Rules**: Configure premium pay multipliers

## 🔧 Configuration

### Database
By default, SQLite is used. To use PostgreSQL:

Create a `.env` file in the backend directory:
```
DATABASE_URL=postgresql://user:password@localhost/soc_shift_manager
```

### API Base URL
In frontend, create `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 📝 Example Workflow

1. **Add Analysts**
   - Navigate to Analysts → Add Analyst
   - Enter: Employee ID, Name, Email, Base Hourly Rate

2. **Configure Pay Rules** (Optional)
   - Navigate to Pay Rules
   - Default rules (Sunday +75%, Saturday +50%) are pre-configured

3. **Assign Shifts**
   - Navigate to Shifts → Assign Shift
   - Select analyst, date, start/end times
   - System calculates hours and applies multipliers automatically

4. **View Reports**
   - Individual analyst: Analytics → Select Analyst
   - Team summary: Analytics → Team Summary
   - Filter by date range

## 🛠️ Development

### Backend Development
```bash
cd backend
pip install -r requirements.txt
export FLASK_ENV=development
python app.py
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

## 📦 Deployment

### Backend (Gunicorn + Flask)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend (Production Build)
```bash
npm run build
# Deploy the build/ folder to a web server
```

## 🤝 Contributing

Feel free to fork and submit pull requests!

## 📄 License

This project is provided as-is for SOC shift management purposes.

## 📞 Support

For issues or questions, please refer to the application documentation or contact your development team.

---

## 📢 Public Repository Notice

This is the **public Docker version** for easy deployment and sharing. 

- ✅ Ready to run with `docker-compose up`
- ✅ Includes sample data
- ✅ Perfect for testing and demos
- ❌ Does not include production data

See [PUBLIC_REPO.md](PUBLIC_REPO.md) for details.
