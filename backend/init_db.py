"""
SOC Shift Manager - Database Initialization Script
This script initializes baseline database data for beta/production.
"""

import os
from datetime import datetime
from werkzeug.security import generate_password_hash

from app import PayRule, User, app, db


DEFAULT_PAY_RULES = [
    {
        "rule_name": "Normal",
        "rule_type": "normal",
        "multiplier": 1.00,
        "description": "Normal weekday daytime (06:00-22:00)",
    },
    {
        "rule_name": "Night",
        "rule_type": "night",
        "multiplier": 1.25,
        "description": "Night hours (22:00-06:00)",
    },
    {
        "rule_name": "Sunday Day",
        "rule_type": "sunday_day",
        "multiplier": 1.75,
        "description": "Sunday daytime (06:00-22:00)",
    },
    {
        "rule_name": "Sunday Night",
        "rule_type": "sunday_night",
        "multiplier": 2.00,
        "description": "Sunday night hours (22:00-06:00)",
    },
    {
        "rule_name": "Saturday Day",
        "rule_type": "saturday_day",
        "multiplier": 1.50,
        "description": "Saturday daytime (06:00-22:00)",
    },
    {
        "rule_name": "Saturday Night",
        "rule_type": "saturday_night",
        "multiplier": 1.75,
        "description": "Saturday night hours (22:00-06:00)",
    },
    {
        "rule_name": "Public Holiday Day",
        "rule_type": "holiday_day",
        "multiplier": 2.00,
        "description": "Public holiday daytime",
    },
    {
        "rule_name": "Public Holiday Night",
        "rule_type": "holiday_night",
        "multiplier": 2.25,
        "description": "Public holiday night hours",
    },
]


def ensure_admin_user(force_reset=False):
    """Create admin if missing, optionally reset password for recovery."""
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin123!")
    admin_email = os.getenv("ADMIN_EMAIL", "admin@soc.local")

    admin_user = User.query.filter_by(username=admin_username).first()

    if not admin_user:
        admin_user = User(
            username=admin_username,
            email=admin_email,
            password_hash=generate_password_hash(admin_password),
            role="admin",
            status="active",
            active=True,
            force_password_change=False,
            created_at=datetime.utcnow(),
        )
        db.session.add(admin_user)
        print(f"✓ Created admin user: {admin_username}")
    else:
        admin_user.email = admin_email
        admin_user.role = "admin"
        admin_user.status = "active"
        admin_user.active = True

        if force_reset:
            admin_user.password_hash = generate_password_hash(admin_password)
            print(f"✓ Reset admin password for user: {admin_username}")
        else:
            print(f"✓ Admin user already exists: {admin_username}")


def ensure_pay_rules():
    """Upsert default Greek labor-law pay rules."""
    created_count = 0
    updated_count = 0

    for rule_data in DEFAULT_PAY_RULES:
        rule = PayRule.query.filter_by(rule_type=rule_data["rule_type"]).first()
        if not rule:
            rule = PayRule(**rule_data, active=True)
            db.session.add(rule)
            created_count += 1
            continue

        rule.rule_name = rule_data["rule_name"]
        rule.multiplier = rule_data["multiplier"]
        rule.description = rule_data["description"]
        rule.active = True
        updated_count += 1

    print(f"✓ Pay rules ready (created: {created_count}, updated: {updated_count})")


def init_baseline_data():
    """Initialize baseline data: admin account + pay rules only."""

    with app.app_context():
        db.create_all()
        print("🚀 Ensuring baseline database data...")

        force_reset = os.getenv("ADMIN_FORCE_RESET", "false").strip().lower() in {
            "1",
            "true",
            "yes",
            "on",
        }

        ensure_admin_user(force_reset=force_reset)
        ensure_pay_rules()

        db.session.commit()

        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_email = os.getenv("ADMIN_EMAIL", "admin@soc.local")

        print("\n" + "=" * 60)
        print("✅ DATABASE BASELINE READY")
        print("=" * 60)
        print("\n📊 Summary:")
        print(f"   - Admin User: {admin_username}")
        print(f"   - Admin Email: {admin_email}")
        print(f"   - Pay Rules: {len(DEFAULT_PAY_RULES)}")
        print("   - Demo Analysts: 0")
        print("   - Demo Shifts: 0")
        if force_reset:
            print("\n🔐 Admin password was reset from ADMIN_PASSWORD.")
        else:
            print("\n🔐 Admin password unchanged unless admin was newly created.")
        print("=" * 60)
        print()


if __name__ == "__main__":
    init_baseline_data()
