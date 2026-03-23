"""
SOC Shift Manager - Database Initialization Script
This script initializes the database with sample data for testing.
"""

import random
from datetime import datetime, timedelta

from app import Analyst, PayRule, Shift, app, db


def init_sample_data():
    """Initialize database with sample data"""

    with app.app_context():
        # Create tables
        db.create_all()

        # Clear existing data (for fresh start)
        PayRule.query.delete()
        Shift.query.delete()
        Analyst.query.delete()

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
                description="Sunday night (22:00-06:00)",
                active=True,
            ),
            PayRule(
                rule_name="Holiday Day",
                rule_type="holiday_day",
                multiplier=1.75,
                description="Holiday daytime (06:00-22:00)",
                active=True,
            ),
            PayRule(
                rule_name="Holiday Night",
                rule_type="holiday_night",
                multiplier=2.00,
                description="Holiday night (22:00-06:00)",
                active=True,
            ),
            PayRule(
                rule_name="Sixth Day",
                rule_type="sixth_day",
                multiplier=1.30,
                description="6th consecutive work day daytime",
                active=True,
            ),
            PayRule(
                rule_name="Sixth Night",
                rule_type="sixth_night",
                multiplier=1.55,
                description="6th consecutive work day night",
                active=True,
            ),
        ]

        for rule in pay_rules:
            db.session.add(rule)

        # Create sample analysts with monthly salary
        analysts_data = [
            {
                "employee_id": "SOC001",
                "first_name": "John",
                "last_name": "Smith",
                "email": "john.smith@company.com",
                "monthly_salary": 3700.00,
                "daily_hours": 8.0,
            },
            {
                "employee_id": "SOC002",
                "first_name": "Maria",
                "last_name": "Garcia",
                "email": "maria.garcia@company.com",
                "monthly_salary": 3500.00,
                "daily_hours": 8.0,
            },
            {
                "employee_id": "SOC003",
                "first_name": "Ahmed",
                "last_name": "Hassan",
                "email": "ahmed.hassan@company.com",
                "monthly_salary": 3800.00,
                "daily_hours": 8.0,
            },
            {
                "employee_id": "SOC004",
                "first_name": "Sofia",
                "last_name": "Novak",
                "email": "sofia.novak@company.com",
                "monthly_salary": 3600.00,
                "daily_hours": 8.0,
            },
        ]

        analysts = []
        for data in analysts_data:
            # Calculate base_hourly_rate from monthly_salary
            monthly_salary = data["monthly_salary"]
            daily_hours = data["daily_hours"]
            base_hourly_rate = (monthly_salary / 25) / daily_hours
            
            analyst = Analyst(
                employee_id=data["employee_id"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                email=data["email"],
                monthly_salary=monthly_salary,
                base_hourly_rate=base_hourly_rate,
                daily_hours=daily_hours,
                status="active"
            )
            analysts.append(analyst)
            db.session.add(analyst)

        db.session.flush()  # Flush to get analyst IDs

        # Import calculate_shift_pay function
        from app import calculate_shift_pay

        # Create sample shifts (last 30 days)
        shift_types = ["morning", "afternoon", "night", "day_off", "approved_leave"]
        shift_templates = {
            "morning": ("06:00:00", "14:00:00"),
            "afternoon": ("14:00:00", "22:00:00"),
            "night": ("22:00:00", "06:00:00"),
        }
        
        for i in range(60):  # 60 shifts across all analysts
            analyst = random.choice(analysts)
            shift_date = datetime.now().date() - timedelta(days=random.randint(1, 30))
            shift_type = random.choice(shift_types)
            
            # Set times based on shift type
            if shift_type == "day_off" or shift_type == "approved_leave":
                start_time = datetime.strptime("00:00:00", "%H:%M:%S").time()
                end_time = datetime.strptime("00:00:00", "%H:%M:%S").time()
            else:
                start_str, end_str = shift_templates.get(shift_type, ("06:00:00", "14:00:00"))
                start_time = datetime.strptime(start_str, "%H:%M:%S").time()
                end_time = datetime.strptime(end_str, "%H:%M:%S").time()

            # Calculate pay using new Greek labor law system
            pay_calc = calculate_shift_pay(
                analyst.id,
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
                work_location=random.choice(['office', 'remote']),
                hours_worked=pay_calc['total_hours'],
                pay_multiplier=pay_calc['avg_multiplier'],
                base_pay=pay_calc['base_pay'],
                total_pay=pay_calc['total_pay'],
                notes=f"Sample shift #{i+1}",
            )
            db.session.add(shift)

        db.session.commit()
        print("✅ Database initialized with sample data!")
        print(f"   - Created {len(analysts)} analysts")
        print(f"   - Created {len(pay_rules)} pay rules")
        print(f"   - Created 60 sample shifts")


if __name__ == "__main__":
    init_sample_data()
