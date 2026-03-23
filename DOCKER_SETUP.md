# 🐳 Docker Setup for SOC Shift Manager

This guide will help you run the SOC Shift Manager application using Docker with sample data.

## 📋 Prerequisites

- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Doomakos/soc-shift-manager-docker.git
cd soc-shift-manager-docker
```

### 2. Start the Application
```bash
docker-compose up --build
```

This single command will:
- Build both backend and frontend Docker images
- Initialize a fresh database with sample data
- Start both services

### 3. Access the Application
- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:5000

### 4. Stop the Application
Press `Ctrl+C` in the terminal, then run:
```bash
docker-compose down
```

## 📊 Sample Data

The application automatically initializes with:
- **12 SOC Level 1 Analysts** with varying hourly rates
- **Greek Labor Law Pay Rules**:
  - Normal weekday: 1.0x
  - Night hours (22:00-06:00): 1.25x
  - Saturday day: 1.5x
  - Saturday night: 1.75x
  - Sunday day: 1.75x
  - Sunday night: 2.0x
  - Holiday day: 2.0x
  - Holiday night: 2.5x
- **90 days of historical shift data** (randomly distributed)

## 🔧 Advanced Usage

### Run in Detached Mode (Background)
```bash
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Restart Services
```bash
docker-compose restart
```

### Clean Everything (including database)
```bash
docker-compose down -v
```
This removes containers, networks, and volumes (including the database).

### Rebuild After Code Changes
```bash
docker-compose up --build
```

## 🗄️ Database Management

### Reset Database to Sample Data
```bash
docker-compose down -v
docker-compose up --build
```

### Access the Backend Container
```bash
docker exec -it soc-backend /bin/bash
```

Once inside, you can run:
```bash
python init_db.py  # Reinitialize with sample data
python export_data.py  # Export data to JSON
```

## 🛠️ Troubleshooting

### Port Already in Use
If ports 3000 or 5000 are already in use, edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change frontend port
  - "5001:5000"  # Change backend port
```

### Frontend Not Loading
1. Wait 30-60 seconds for the React app to compile
2. Check logs: `docker-compose logs frontend`
3. Try refreshing the browser

### Backend API Not Responding
1. Check if backend is healthy: `docker ps`
2. View logs: `docker-compose logs backend`
3. Verify database initialization completed

### Reset Everything
```bash
docker-compose down -v --rmi all
docker-compose up --build
```

## 📁 Data Persistence

- Database is stored in a Docker volume named `soc-shift-manager_backend-data`
- Data persists between container restarts
- To reset data, remove the volume: `docker-compose down -v`

## 🔐 Security Notes

- This setup is for **development/demo purposes only**
- No authentication is enabled by default
- Do not use in production without proper security configurations
- Never commit sensitive data or production databases

## 🤝 Contributing

For development without Docker, see [GETTING_STARTED.md](GETTING_STARTED.md)

## 📞 Support

For issues or questions, please check the main [README.md](README.md) or open an issue on GitHub.

---

**Note**: Your actual production database and data files are excluded from the Docker build. The Docker setup uses only sample data from `init_db.py`.
