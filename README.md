# 🛡️ SOC Shift Manager

> **Production-Ready** shift management system for SOC Level 1 analysts with automated premium pay calculation according to Greek labor law.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)]()
[![React](https://img.shields.io/badge/React-18-blue.svg)]()
[![Flask](https://img.shields.io/badge/Flask-2.3-green.svg)]()

---

## 🚀 Quick Start

**Get running in 3 minutes!** See [QUICKSTART.md](QUICKSTART.md) for step-by-step instructions.

```bash
git clone https://github.com/Doomakos/soc-shift-manager-production.git
cd soc-shift-manager-production
docker-compose up --build
```

Then open http://localhost:3000 and login with:
- **Username:** `admin`
- **Password:** `Admin123!`

---

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Tech Stack](#-tech-stack)
- [Security](#-security)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## ✨ Features

### Core Functionality
- ✅ **Analyst Management** - Register, edit, and manage SOC Level 1 analyst profiles
- ✅ **Shift Assignment** - Create and assign shifts with automatic time tracking
- ✅ **Premium Pay Calculation** - Automatic calculation based on Greek labor law:
  - Sundays: **+75%** (1.75x)
  - Saturdays: **+50%** (1.50x)
  - Night shifts: **+25%** (1.25x)
  - Public holidays: **up to +125%** (2.25x)
- ✅ **Historical Data** - Complete audit trail of all shifts and payments
- ✅ **Analytics & Reports** - Individual and team-wide summaries
- ✅ **Customizable Pay Rules** - Configure multipliers for any day or shift type

### Security & Access
- 🔐 JWT-based authentication
- 👥 Role-based access control (Admin/User)
- 🔑 Secure password management
- 📝 Activity logging

### User Experience
- 📱 Responsive design (works on desktop, tablet, mobile)
- 🌙 Clean, modern UI with Tailwind CSS
- ⚡ Fast performance with React 18
- 📊 Real-time dashboard updates

---

## 📦 Prerequisites

### Required
- **Docker Desktop** (recommended) OR:
- Python 3.8+ and Node.js 14+ (for manual setup)

### Optional
- PostgreSQL (for production deployments)
- Git (for version control)

---

## 🔧 Installation

### Method 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/Doomakos/soc-shift-manager-production.git
cd soc-shift-manager-production

# Start the application
docker-compose up --build
```

**That's it!** The application will:
- Build Docker containers
- Initialize the database
- Create an admin account
- Load sample data (4 analysts, 12 shifts)
- Start on http://localhost:3000

### Method 1B: Single-Image Beta Deployment

Use this for beta environments where frontend and backend run from one image:

```bash
# Clone the repository
git clone https://github.com/Doomakos/soc-shift-manager-production.git
cd soc-shift-manager-production

# Start single-container beta stack
docker compose -f docker-compose.beta.yml up --build -d
```

Beta UI/API endpoint:
- http://localhost:4443

### Method 2: Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python init_db.py  # Initialize database with sample data
python app.py
```

Backend runs on **http://localhost:5000**

#### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on **http://localhost:3000**

</details>

---

## ⚙️ Configuration

### Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Key variables to configure:

```env
# Admin Account (change these!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_EMAIL=admin@yourcompany.com

# Security Keys (generate unique values!)
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here

# Database (optional - defaults to SQLite)
# DATABASE_URL=postgresql://user:pass@localhost/dbname
```

**⚠️ Important:** Generate secure secret keys:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

For complete configuration options, see [.env.example](.env.example).

---

## 📖 Usage

### First Login

1. Navigate to **http://localhost:3000**
2. Login with default credentials:
   - Username: `admin`
   - Password: `Admin123!`
3. **Change your password immediately!**
   - Go to Profile → Change Password

### Common Tasks

#### Add an Analyst

1. Navigate to **Analysts** → **Add Analyst**
2. Enter:
   - Employee ID (e.g., SOC013)
   - Name and email
   - Base hourly rate (in EUR)
3. Click **Save**

#### Assign a Shift

1. Navigate to **Shifts** → **Assign Shift**
2. Select:
   - Analyst
   - Date and times
   - Shift type (morning/afternoon/night/standard)
3. System automatically calculates:
   - Hours worked
   - Premium multiplier
   - Total pay

#### View Analytics

1. **Individual**: Analytics → Select Analyst
2. **Team Summary**: Analytics → Team Summary
3. Filter by date range to see specific periods

### Sample Data

The application initializes with:
- **12 sample analysts** (SOC001-SOC012)
- **8 pay rules** (Greek labor law compliant)
- **60 sample shifts** (last 90 days)

You can delete sample data and add your own, or continue using it for testing.

---

## 🔌 API Reference

### Authentication

```bash
# Login
POST /api/auth/login
Content-Type: application/json
{
  "username": "admin",
  "password": "Admin123!"
}

# Returns:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": { ... }
}
```

### Analysts

```bash
# Get all analysts
GET /api/analysts
Authorization: Bearer <token>

# Create analyst
POST /api/analysts
Authorization: Bearer <token>
Content-Type: application/json
{
  "employee_id": "SOC013",
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane.doe@soc.local",
  "base_hourly_rate": 16.00
}
```

### Shifts

```bash
# Get shifts (with filters)
GET /api/shifts?analyst_id=1&start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <token>

# Create shift
POST /api/shifts
Authorization: Bearer <token>
Content-Type: application/json
{
  "analyst_id": 1,
  "shift_date": "2024-03-23",
  "start_time": "09:00:00",
  "end_time": "17:00:00",
  "shift_type": "standard"
}
```

### Analytics

```bash
# Analyst summary
GET /api/analytics/analyst-summary/1?start_date=2024-01-01&end_date=2024-12-31
Authorization: Bearer <token>

# Team summary
GET /api/analytics/team-summary?start_date=2024-01-01
Authorization: Bearer <token>
```

For complete API documentation, see [backend/README.md](backend/README.md).

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Flask 2.3
- **ORM:** SQLAlchemy
- **Database:** SQLite (default) / PostgreSQL (production)
- **Authentication:** Flask-JWT-Extended
- **CORS:** Flask-CORS

### Frontend
- **Framework:** React 18.2
- **Router:** React Router v6
- **Styling:** Tailwind CSS 3
- **HTTP Client:** Axios
- **Icons:** Lucide React

### DevOps
- **Containerization:** Docker & Docker Compose
- **Web Server:** Flask dev server (development) / Gunicorn (production)
- **Database:** Named Docker volumes for persistence

---

## 🔒 Security

### Authentication
- JWT tokens with refresh mechanism
- Secure password hashing (bcrypt)
- Token expiration (1 hour access, 30 days refresh)

### Best Practices
- ✅ CORS configured for specific origins
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ XSS protection (React escaping)
- ✅ Secrets via environment variables
- ⚠️ Change default credentials on first login
- ⚠️ Generate unique SECRET_KEY and JWT_SECRET_KEY

### Production Recommendations
1. Use HTTPS/SSL certificates
2. Configure firewall rules
3. Enable rate limiting
4. Regular security audits
5. Database backups
6. Monitor logs for suspicious activity

---

## 🚀 Deployment

### Docker Deployment (Production)

1. Clone and configure:
```bash
git clone https://github.com/Doomakos/soc-shift-manager-production.git
cd soc-shift-manager-production
cp .env.example .env
# Edit .env with your production values
```

2. Choose your deployment model:
  - Two-container mode: use `docker-compose.yml`
  - Single-image beta direct mode (internal only): use `docker-compose.beta.yml`
  - Single-image beta reverse proxy mode (user testing): use `docker-compose.beta.proxy.yml`

3. Set production values:
  - Generate secure `SECRET_KEY` and `JWT_SECRET_KEY`
  - Change admin defaults (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`)
  - Set `CORS_ORIGINS` to approved UI origins only
  - For reverse proxy mode, also set `DOMAIN` and `ACME_EMAIL`

4. Deploy:

Two-container mode:
```bash
docker-compose up -d
```

Single-image beta mode:
```bash
docker compose -f docker-compose.beta.yml up -d
```

Single-image beta reverse proxy mode (recommended for user testing):
```bash
export DOMAIN=beta.your-domain.com
export ACME_EMAIL=ops@your-domain.com
export CORS_ORIGINS=https://beta.your-domain.com
docker compose -f docker-compose.beta.proxy.yml up -d
```

User entrypoint for reverse proxy mode:
- https://<your-domain>

### PostgreSQL Setup

For production, use PostgreSQL instead of SQLite:

```bash
# Add to .env
DATABASE_URL=postgresql://user:password@postgres:5432/soc_db
```

Update docker-compose.yml to include PostgreSQL service.

### Cloud Deployment

Compatible with:
- **Docker:** Any cloud provider (AWS ECS, Google Cloud Run, Azure Container Instances)
- **Platform:** Render, Railway, Heroku
- **Self-hosted:** VPS with Docker installed

---

## 💾 Data Persistence

Data is stored in Docker volumes and persists between container restarts:

```bash
# View volumes
docker volume ls

# Backup database
docker run --rm -v soc-shift-manager-production_backend-data:/data \
  -v $(pwd):/backup alpine tar czf /backup/database-backup.tar.gz -C /data .

# Restore database
docker run --rm -v soc-shift-manager-production_backend-data:/data \
  -v $(pwd):/backup alpine tar xzf /backup/database-backup.tar.gz -C /data
```

---

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Check what's using the port
lsof -i :3000
lsof -i :5000
lsof -i :4443

# Change ports in docker-compose.yml if needed
```

**Can't connect to backend:**
- Check backend container logs: `docker-compose logs backend`
- Verify network: `docker network ls`
- Ensure both containers are running: `docker ps`

**Database errors:**
```bash
# Start fresh
docker-compose down -v
docker-compose up --build
```

**Build fails:**
```bash
# Clear Docker cache
docker system prune -a
docker-compose build --no-cache
```

For more troubleshooting, see [QUICKSTART.md#troubleshooting](QUICKSTART.md#troubleshooting).

---

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Get started in 3 minutes
- [.env.example](.env.example) - All configuration options
- [backend/README.md](backend/README.md) - API documentation
- [BETA_MILESTONE.md](BETA_MILESTONE.md) - Beta release checklist
- [DEPLOYMENT_STRATEGIES.md](DEPLOYMENT_STRATEGIES.md) - 4443 direct vs 443 reverse proxy strategy

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📝 License

This project is licensed under the MIT License.

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/Doomakos/soc-shift-manager-production/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Doomakos/soc-shift-manager-production/discussions)

---

## 🙏 Acknowledgments

Built for SOC teams worldwide to simplify shift management and ensure fair compensation according to labor laws.

---

**Made with ❤️ for SOC teams**
