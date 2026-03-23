# 🚀 SOC Shift Manager - Quick Start Guide

Get up and running in **3 minutes** with the SOC Shift Manager!

## Prerequisites

- Docker Desktop installed ([Get Docker](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)
- Internet connection (for first-time image building)

## ⚡ Quick Start (3 Steps)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Doomakos/soc-shift-manager-production.git
cd soc-shift-manager-production
```

### Step 2: Start the Application

```bash
docker-compose up --build
```

**That's it!** The application will:
- Build the Docker containers
- Initialize the database with sample data
- Create a default admin account
- Start both frontend and backend services

### Step 3: Access & Login

Open your browser and go to:
```
http://localhost:3000
```

**Default Login Credentials:**
```
Username: admin
Password: Admin123!
```

---

## 📊 What You Get Out of the Box

After starting, your application comes with:

✅ **Admin account** ready to use  
✅ **12 sample analysts** with varying hourly rates  
✅ **8 pay rules** configured for Greek labor law  
✅ **60 sample shifts** spanning 90 days  
✅ **Full analytics** and reporting ready to view

## 🎯 Try These Features

1. **View Dashboard** - See overview of shifts and analysts
2. **Manage Analysts** - Add, edit, or view analyst profiles
3. **Assign Shifts** - Create new shifts with automatic pay calculation
4. **View Analytics** - See individual and team summaries
5. **Configure Pay Rules** - Customize premium pay multipliers

## 🔐 Security - IMPORTANT!

⚠️ **Change the admin password immediately after first login!**

1. Log in with default credentials
2. Go to Profile → Change Password
3. Set a strong, unique password

## 🎨 Customization (Optional)

Want to customize admin credentials before starting? Create a `.env` file:

```bash
# Create .env file in the project root
cat > .env << 'ENVFILE'
ADMIN_USERNAME=your-username
ADMIN_PASSWORD=YourStrongPassword123!
ADMIN_EMAIL=your.email@company.com
ENVFILE
```

Then start normally with `docker-compose up --build`

## 📱 Application URLs

- **Frontend (React)**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api/

## 🛑 Stopping the Application

```bash
# Stop containers (data persists)
docker-compose down

# Stop and remove volumes (fresh start next time)
docker-compose down -v
```

## 🔄 Restarting

```bash
# Start existing containers
docker-compose up

# Rebuild if you made changes
docker-compose up --build
```

## 📦 Data Persistence

Your data is stored in a Docker volume and persists between restarts:
- Database: `backend-data` volume
- Contains: all analysts, shifts, pay rules, and user accounts

## 🐛 Troubleshooting

### Port Already in Use

If ports 3000 or 5000 are already taken:

```bash
# Check what's using the ports
lsof -i :3000
lsof -i :5000

# Kill the process or change ports in docker-compose.yml
```

### Can't Access the Application

1. Ensure Docker containers are running:
   ```bash
   docker ps
   ```

2. Check logs for errors:
   ```bash
   docker-compose logs
   docker-compose logs backend
   docker-compose logs frontend
   ```

### Database Issues

To start fresh:
```bash
docker-compose down -v
docker-compose up --build
```

### Build Errors

Clear Docker cache and rebuild:
```bash
docker-compose down
docker system prune -a
docker-compose up --build
```

## 📖 Sample Data Overview

### Analysts (12)
- John Smith (SOC001) - €15.00/hr
- Maria Garcia (SOC002) - €16.50/hr
- Ahmed Hassan (SOC003) - €15.75/hr
- Sophie Laurent (SOC004) - €17.00/hr
- David Chen (SOC005) - €16.00/hr
- Emma Wilson (SOC006) - €15.50/hr
- Raj Patel (SOC007) - €16.75/hr
- Anna Kowalski (SOC008) - €15.25/hr
- Carlos Rodriguez (SOC009) - €17.50/hr
- Yuki Tanaka (SOC010) - €16.25/hr
- Fatima Al-Rashid (SOC011) - €15.80/hr
- Michael O'Brien (SOC012) - €16.90/hr

### Pay Rules (Greek Labor Law)
- **Weekday Normal**: 1.0x (standard pay)
- **Weekday Night** (22:00-06:00): 1.25x
- **Saturday Day** (06:00-22:00): 1.5x (+50%)
- **Saturday Night** (22:00-06:00): 1.75x (+75%)
- **Sunday Day** (06:00-22:00): 1.75x (+75%)
- **Sunday Night** (22:00-06:00): 2.0x (+100%)
- **Public Holiday Day**: 2.0x (+100%)
- **Public Holiday Night**: 2.25x (+125%)

### Shift Types
- **Morning**: 06:00 - 14:00 (8 hours)
- **Afternoon**: 14:00 - 22:00 (8 hours)
- **Night**: 22:00 - 06:00 (8 hours)
- **Standard**: 09:00 - 17:00 (8 hours)

## 💡 Next Steps

After exploring the sample data:

1. **Add your own analysts** - Replace sample data with real team members
2. **Configure pay rules** - Adjust multipliers to match your requirements
3. **Start assigning real shifts** - Begin tracking actual work hours
4. **Generate reports** - Use analytics to monitor hours and costs
5. **Manage users** - Add more admin users or analysts with login access

## 🔗 Additional Resources

- **Full README**: See [README.md](README.md) for detailed documentation
- **API Documentation**: See [backend/README.md](backend/README.md) for API reference
- **Docker Setup**: See [DOCKER_SETUP.md](DOCKER_SETUP.md) for advanced Docker configuration

## 📞 Need Help?

- Check the logs: `docker-compose logs`
- Review the full documentation in [README.md](README.md)
- Report issues on GitHub

---

## 🎉 You're Ready!

The SOC Shift Manager is now running with sample data. Log in and start exploring!

**Default Login:**
- URL: http://localhost:3000
- Username: `admin`
- Password: `Admin123!`

**Remember to change the password after first login!**
