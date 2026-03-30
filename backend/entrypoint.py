#!/usr/bin/env python3
"""
Entrypoint script for SOC Shift Manager backend container
Handles database initialization and starts the Flask application
"""
import os
import sys
import subprocess
import shlex

def main():
    print("Starting SOC Shift Manager Backend...")
    
    # Ensure instance directory exists with proper permissions
    instance_dir = "/app/instance"
    os.makedirs(instance_dir, exist_ok=True)
    os.chmod(instance_dir, 0o777)
    print(f"✓ Instance directory ready: {instance_dir}")
    
    # Initialize database if it doesn't exist
    db_path = os.path.join(instance_dir, "soc_shift_manager.db")
    if not os.path.exists(db_path):
        print("Initializing database with sample data...")
        subprocess.run([sys.executable, "init_db.py"], check=True)
        print("✓ Database initialized successfully")
    else:
        print(f"✓ Database already exists: {db_path}")
    
    # Start the application (configurable for production/development runtimes)
    start_command = os.getenv("START_COMMAND", f"{sys.executable} app.py")
    print(f"Starting application with command: {start_command}")
    args = shlex.split(start_command)
    os.execvp(args[0], args)

if __name__ == "__main__":
    main()
