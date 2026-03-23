#!/bin/sh
set -e

# Ensure instance directory exists and has proper permissions
mkdir -p /app/instance
chmod 777 /app/instance

# Initialize database if it doesn't exist
if [ ! -f /app/instance/soc_shift_manager.db ]; then
    echo "Initializing database with sample data..."
    python init_db.py
fi

# Start the Flask application
echo "Starting Flask application..."
exec python app.py
