#!/bin/bash
# Quick start script for SOC Shift Manager with Docker

echo "🐳 SOC Shift Manager - Docker Quick Start"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first:"
    echo "   https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""
echo "🚀 Starting SOC Shift Manager..."
echo "   This will:"
echo "   - Build Docker images (first time may take a few minutes)"
echo "   - Initialize database with sample data"
echo "   - Start backend on http://localhost:5000"
echo "   - Start frontend on http://localhost:3000"
echo ""

# Build and start containers
docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Application is starting!"
    echo ""
    echo "📊 Waiting for services to be ready..."
    sleep 10
    
    echo ""
    echo "🎉 SOC Shift Manager is running!"
    echo ""
    echo "Access the application:"
    echo "  🌐 Frontend: http://localhost:3000"
    echo "  🔌 Backend API: http://localhost:5000"
    echo ""
    echo "Sample data includes:"
    echo "  👥 12 SOC Level 1 Analysts"
    echo "  📅 90 days of shift history"
    echo "  💰 Greek labor law pay rules"
    echo ""
    echo "View logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "Stop the application:"
    echo "  docker-compose down"
    echo ""
    echo "Reset database (removes all data):"
    echo "  docker-compose down -v"
    echo ""
else
    echo "❌ Failed to start application. Check the error messages above."
    exit 1
fi
