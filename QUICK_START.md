# 🚀 SOC Shift Manager - Quick Reference for New Users

## One-Command Setup

```bash
git clone https://github.com/Doomakos/soc-shift-manager-docker.git
cd soc-shift-manager-docker
./docker-start.sh
```

**Or manually:**
```bash
docker-compose up --build
```

## Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## What's Included
- ✅ 12 Sample SOC Analysts
- ✅ 90 Days of Shift History  
- ✅ Greek Labor Law Pay Rules
- ✅ Complete Analytics Dashboard

## Common Commands

### Start
```bash
docker-compose up
```

### Start in Background
```bash
docker-compose up -d
```

### Stop
```bash
docker-compose down
```

### Reset Everything (Fresh Start)
```bash
docker-compose down -v
docker-compose up --build
```

### View Logs
```bash
docker-compose logs -f          # All services
docker-compose logs -f backend  # Backend only
docker-compose logs -f frontend # Frontend only
```

### Restart
```bash
docker-compose restart
```

## Features to Try

### 1. View Sample Data
- Go to **Analysts** to see 12 pre-configured analysts
- Check **Shifts** to see historical shift assignments
- Review **Analytics** for pay calculations

### 2. Add Your Own Analyst
1. Click **Analysts** → **Add Analyst**
2. Fill in: Employee ID, Name, Email, Base Rate
3. Click **Save**

### 3. Assign a Shift
1. Go to **Shifts** → **Assign Shift**
2. Select analyst, date, and times
3. Watch automatic pay calculation!

### 4. View Reports
- **Individual**: Analytics → Select analyst
- **Team**: Analytics → Team Summary
- Filter by date range

## Pay Calculation Rules

The system automatically applies premium pay:
- **Sunday Day**: +75% (1.75x)
- **Sunday Night**: +100% (2.0x)
- **Saturday Day**: +50% (1.5x)
- **Saturday Night**: +75% (1.75x)
- **Night Hours** (22:00-06:00): +25% (1.25x)
- **Holidays**: +100% to +150%

## Troubleshooting

### Port Already in Use?
Edit `docker-compose.yml` and change ports:
```yaml
ports:
  - "3001:3000"  # Instead of 3000:3000
```

### Frontend Not Loading?
Wait 30-60 seconds for React to compile, then refresh browser.

### Want Clean Database?
```bash
docker-compose down -v  # Removes all data
docker-compose up       # Creates fresh database
```

## Data Persistence
- Database is stored in a Docker volume
- Data survives restarts
- Use `docker-compose down -v` to reset

## Need Help?
- Read [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed docs
- Check [README.md](README.md) for feature documentation
- View logs: `docker-compose logs -f`

---

**Enjoy managing your SOC shifts! 🎉**
