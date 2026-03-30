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
    
    # Ensure baseline DB data exists (idempotent bootstrap)
    db_path = os.path.join(instance_dir, "soc_shift_manager.db")
    if os.path.exists(db_path):
        print(f"✓ Database found: {db_path}")
    else:
        print(f"✓ Database will be created at: {db_path}")

    print("Ensuring baseline database data...")
    subprocess.run([sys.executable, "init_db.py"], check=True)
    print("✓ Baseline database ready")
    
    # Start the application (configurable for production/development runtimes)
    start_command = os.getenv("START_COMMAND", f"{sys.executable} app.py")
    print(f"Starting application with command: {start_command}")
    args = shlex.split(start_command)
    os.execvp(args[0], args)

if __name__ == "__main__":
    main()
