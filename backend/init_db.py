"""
SOC Shift Manager - Database Initialization Script
This script initializes the database with minimal sample data for demonstration.
"""

import os
import random
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

from app import Analyst, PayRule, Shift, User, app, db


def init_sample_data():
    """Initialize database with minimal sample data and admin user"""

    with app.app_context():
        # Create tables
        db.create_all()

        # Check if already initialized
        existing_user = User.query.first()
        if existing_user:
            print("⚠️  Database already initialized. Skipping...")
            return

        print("🚀 Initializing database with sample data...")

        # Create admin user from environment variables
        admin_username = os.getenv('ADMIN_USERNAME', 'admin')
        admin_password = os.getenv('ADMIN_PASSWORD', 'Admin123!')
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@soc.local')

        admin_user = User(
            username=admin_username,
            email=admin_email,
            password_hash=generate_password_hash(admin_password),
            role='admin',
            status='active',
            active=True,
            force_password_change=False,
            created_at=datetime.utcnow()
        )
        db.session.add(admin_user)
        db.session.flush()  # Get the user ID

        print(f"✓ Created admin user: {admin_username}")

        # Create Greek labor law pay rules
        pay_rules = [
            PayRule(
                rule_name="Normal",
                rule_type="normal",
                multiplier=1.00,
                description="Normal weekday daytime (06:00-22:00)",
                active=True,
            ),
            PayRule(
                rule_name="Night",
                rule_type="night",
                multiplier=1.25,
                description="Night hours (22:00-06:00)",
                active=True,
            ),
            PayRule(
                rule_name="Sunday Day",
                rule_type="sunday_day",
                multiplier=1.75,
                description="Sunday daytime (06:00-22:00)",
                active=True,
            ),
            PayRule(
                rule_name="Sunday Night",
                rule_type="sunday_night",
                multiplier=2.00,
                description="Sunday night hours (22:00-06:00)",
                active=True,
            ),
            PayRule(
                rule_name="Saturday Day",
                rule_type="saturday_day",
                multiplier=1.50,
                description="Saturday daytime (06:00-22:00)",
                active=True,
            ),
            PayRule(
                rule_name="Saturday Night",
                rule_type="saturday_night",
                multiplier=1.75,
                description="Saturday night hours (22:00-06:00)",
                active=True,
            ),
            PayRule(
                rule_name="Public Holiday Day",
                rule_type="holiday_day",
                multiplier=2.00,
                description="Public holiday daytime",
                active=True,
            ),
            PayRule(
                rule_name="Public Holiday Night",
                rule_type="holiday_night",
                multiplier=2.25,
                description="Public holiday night hours",
                active=True,
            ),
        ]

        for rule in pay_rules:
            db.session.add(rule)

        print(f"✓ Created {len(pay_rules)} pay rules")

        # Create minimal sample analysts (4 analysts for demo)
        analysts = [
            Analyst(
                employee_id="SOC001",
                first_name="John",
                last_name="Smith",
                email="john.smith@soc.local",
                base_hourly_rate=15.00,
                status="active",
                created_by=admin_user.id
            ),
            Analyst(
                employee_id="SOC002",
                first_name="Maria",
                last_name="Garcia",
                email="maria.garcia@soc.local",
                base_hourly_rate=16.50,
                status="active",
                created_by=admin_user.id
            ),
            Analyst(
                employee_id="SOC003",
                first_name="Ahmed",
                last_name="Hassan",
                email="ahmed.hassan@soc.local",
                base_hourly_rate=15.75,
                status="active",
                created_by=admin_user.id
            ),
            Analyst(
                employee_id="SOC004",
                first_name="Sophie",
                last_name="Laurent",
                email="sophie.laurent@soc.local",
                base_hourly_rate=17.00,
                status="active",
                created_by=admin_user.id
            ),
        ]

        for analyst in analysts:
            db.session.add(analyst)

        db.session.flush()  # Ensure analysts have IDs
        print(f"✓ Created {len(analysts)} sample analysts")

        # Create minimal sample shifts (12 shifts for demo)
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)  # Last 30 days instead of 90

        shift_types = ['morning', 'afternoon', 'night', 'standard']
        shift_configs = {
            'morning': ('06:00:00', '14:00:00'),
            'afternoon': ('14:00:00', '22:00:00'),
            'night': ('22:00:00', '06:00:00'),
            'standard': ('09:00:00', '17:00:00'),
        }

        # Generate 12 sample shifts across all analysts
        num_shifts = 12
        print(f"🔄 Generating {num_shifts} sample shifts...")

        for i in range(num_shifts):
            analyst = analysts[i % len(analysts)]  # Distribute evenly
            shift_date = start_date + timedelta(days=(i * 2) + random.randint(0, 1))
            shift_type = shift_types[i % len(shift_types)]
            start_time_str, end_time_str = shift_configs[shift_type]

            # Parse times
            start_time = datetime.strptime(start_time_str, '%H:%M:%S').time()
            end_time = datetime.strptime(end_time_str, '%H:%M:%S').time()

            # Calculate hours and pay based on Greek labor law
            pay_calc = calculate_greek_pay(
                analyst.base_hourly_rate,
                shift_date,
                start_time,
                end_time,
                shift_type
            )

            shift = Shift(
                analyst_id=analyst.id,
                shift_date=shift_date,
                start_time=start_time,
                end_time=end_time,
                shift_type=shift_type,
                hours_worked=pay_calc['total_hours'],
                avg_multiplier=pay_calc['avg_multiplier'],
                base_pay=pay_calc['base_pay'],
                total_pay=pay_calc['total_pay'],
                notes=f"Sample {shift_type} shift",
                created_at=datetime.utcnow()
            )
            db.session.add(shift)

        # Commit all changes
        db.session.commit()

        print("\n" + "=" * 60)
        print("✅ DATABASE INITIALIZED SUCCESSFULLY!")
        print("=" * 60)
        print("\n📊 Summary:")
        print(f"   - Admin User: {admin_username}")
        print(f"   - Sample Analysts: {len(analysts)}")
        print(f"   - Pay Rules: {len(pay_rules)}")
        print(f"   - Sample Shifts: {num_shifts}")
        print("\n🔑 Default Login Credentials:")
        print(f"   Username: {admin_username}")
        print(f"   Password: {admin_password}")
        print(f"   Email: {admin_email}")
        print("\n⚠️  IMPORTANT: Change the admin password after first login!")
        print("=" * 60)
        print()


def calculate_greek_pay(base_rate, shift_date, start_time, end_time, shift_type):
    """
    Calculate pay according to Greek labor law
    - Normal weekday: 1.0x
    - Saturday day (06:00-22:00): 1.5x
    - Saturday night (22:00-06:00): 1.75x
    - Sunday day (06:00-22:00): 1.75x
    - Sunday night (22:00-06:00): 2.0x
    - Night hours (22:00-06:00): additional 25% on weekdays
    """
    
    # Calculate total hours
    start_datetime = datetime.combine(shift_date, start_time)
    end_datetime = datetime.combine(shift_date, end_time)
    
    # Handle overnight shifts
    if end_time < start_time:
        end_datetime += timedelta(days=1)
    
    total_hours = (end_datetime - start_datetime).total_seconds() / 3600
    
    # Determine multiplier based on day and time
    day_of_week = shift_date.weekday()  # 0=Monday, 6=Sunday
    
    if day_of_week == 6:  # Sunday
        if shift_type == 'night':
            multiplier = 2.00
        else:
            multiplier = 1.75
    elif day_of_week == 5:  # Saturday
        if shift_type == 'night':
            multiplier = 1.75
        else:
            multiplier = 1.50
    elif shift_type == 'night':  # Weekday night
        multiplier = 1.25
    else:  # Normal weekday
        multiplier = 1.00
    
    base_pay = total_hours * base_rate
    total_pay = base_pay * multiplier
    
    return {
        'total_hours': round(total_hours, 2),
        'avg_multiplier': multiplier,
        'base_pay': round(base_pay, 2),
        'total_pay': round(total_pay, 2)
    }


if __name__ == "__main__":
    init_sample_data()
