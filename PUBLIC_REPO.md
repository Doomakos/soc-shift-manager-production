# 📢 Public Docker Repository

This is the **public Docker version** of SOC Shift Manager, designed for easy sharing and deployment.

## 🔒 What's Different from Development Repo

This repository contains:
- ✅ Full application source code
- ✅ Docker configuration for easy deployment
- ✅ Sample data initialization script (`init_db.py`)
- ✅ Complete documentation

This repository **excludes**:
- ❌ Production databases
- ❌ Real shift data
- ❌ Data backups
- ❌ Private credentials
- ❌ Development-specific files

## 🚀 Quick Start

```bash
git clone <your-public-repo-url>
cd soc-shift-manager-docker
./docker-start.sh
```

Or:
```bash
docker-compose up --build
```

Then access:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📊 Sample Data

The application initializes with:
- 12 SOC Level 1 Analysts
- 90 days of historical shifts
- Greek labor law pay rules
- Complete analytics dashboard

## 📖 Documentation

- [README.md](README.md) - Full feature documentation
- [DOCKER_SETUP.md](DOCKER_SETUP.md) - Detailed Docker guide
- [QUICK_START.md](QUICK_START.md) - Quick reference

## 🤝 Contributing

This is a demo/starter version. For the full development repository, please contact the maintainers.

---

**Enjoy exploring SOC Shift Manager! 🎉**
