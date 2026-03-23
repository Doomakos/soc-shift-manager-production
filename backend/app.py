import os
from datetime import datetime, timedelta
from decimal import Decimal
import re
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

app = Flask(__name__)
CORS(app, 
     resources={r"/*": {"origins": "*"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Database Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL", "sqlite:///soc_shift_manager.db"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# JWT Configuration
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)  # Short-lived for security
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)  # Longer refresh period

db = SQLAlchemy(app)
jwt = JWTManager(app)

# ==================== DATABASE MODELS ====================


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(30), default="l1_analyst")  # admin, soc_manager, shift_coordinator, l1_analyst, l2_analyst, hr_payroll
    analyst_id = db.Column(db.Integer, db.ForeignKey("analysts.id"), nullable=True)  # Link to Analyst record
    status = db.Column(db.String(20), default="pending_approval")  # pending_approval, active, inactive
    force_password_change = db.Column(db.Boolean, default=False)  # For admin-created accounts
    approved_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)  # Who approved this user
    approved_at = db.Column(db.DateTime, nullable=True)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_sensitive=False):
        data = {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "analyst_id": self.analyst_id,
            "status": self.status,
            "active": self.active,
            "created_at": self.created_at.isoformat(),
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }
        if include_sensitive:
            data["force_password_change"] = self.force_password_change
            data["approved_by"] = self.approved_by
            data["approved_at"] = self.approved_at.isoformat() if self.approved_at else None
        return data


class Analyst(db.Model):
    __tablename__ = "analysts"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(50), unique=True, nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    base_hourly_rate = db.Column(db.Float, nullable=False)
    monthly_salary = db.Column(db.Float)  # Optional: if provided, hourly_rate is calculated
    daily_hours = db.Column(db.Float, default=8.0)  # For salary calculation
    analyst_level = db.Column(db.String(10), default="L1")  # L1 (shift work) or L2 (standby)
    status = db.Column(db.String(20), default="active")  # active, inactive, on_leave
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    modified_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    modified_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    shifts = db.relationship(
        "Shift", backref="analyst", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "base_hourly_rate": self.base_hourly_rate,
            "monthly_salary": self.monthly_salary,
            "daily_hours": self.daily_hours,
            "analyst_level": self.analyst_level,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }


class Shift(db.Model):
    __tablename__ = "shifts"

    id = db.Column(db.Integer, primary_key=True)
    analyst_id = db.Column(db.Integer, db.ForeignKey("analysts.id"), nullable=False)
    shift_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    shift_type = db.Column(
        db.String(50), nullable=False
    )  # e.g., 'morning', 'afternoon', 'night'
    work_location = db.Column(
        db.String(20), default="office"
    )  # 'office' or 'remote'
    hours_worked = db.Column(db.Float, nullable=False)
    pay_multiplier = db.Column(
        db.Float, default=1.0
    )  # 1.0 = regular, 1.75 = Sunday (+75%)
    base_pay = db.Column(db.Float, nullable=False)
    total_pay = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    modified_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    modified_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    notes = db.Column(db.String(500))

    def to_dict(self):
        return {
            "id": self.id,
            "analyst_id": self.analyst_id,
            "analyst_name": f"{self.analyst.first_name} {self.analyst.last_name}",
            "shift_date": self.shift_date.isoformat(),
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            "shift_type": self.shift_type,
            "work_location": self.work_location,
            "hours_worked": self.hours_worked,
            "pay_multiplier": self.pay_multiplier,
            "base_pay": round(self.base_pay, 2),
            "total_pay": round(self.total_pay, 2),
            "created_at": self.created_at.isoformat(),
            "notes": self.notes,
        }


class PayRule(db.Model):
    __tablename__ = "pay_rules"

    id = db.Column(db.Integer, primary_key=True)
    rule_name = db.Column(db.String(100), nullable=False, unique=True)
    rule_type = db.Column(db.String(50), nullable=False)  # 'normal', 'night', 'sunday_day', 'sunday_night', 'holiday_day', 'holiday_night', 'sixth_day', 'sixth_night'
    multiplier = db.Column(db.Float, default=1.0)
    description = db.Column(db.String(500))
    active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "rule_name": self.rule_name,
            "rule_type": self.rule_type,
            "multiplier": self.multiplier,
            "description": self.description,
            "active": self.active,
        }


class StandbyWeek(db.Model):
    __tablename__ = "standby_weeks"

    id = db.Column(db.Integer, primary_key=True)
    analyst_id = db.Column(db.Integer, db.ForeignKey("analysts.id"), nullable=False)
    week_start = db.Column(db.Date, nullable=False)  # Monday of the week
    week_end = db.Column(db.Date, nullable=False)  # Sunday of the week
    notes = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    modified_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    modified_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    analyst = db.relationship("Analyst", backref="standby_weeks", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "analyst_id": self.analyst_id,
            "analyst_name": f"{self.analyst.first_name} {self.analyst.last_name}",
            "week_start": self.week_start.isoformat(),
            "week_end": self.week_end.isoformat(),
            "week_display": f"{self.week_start.strftime('%d/%m/%Y')} - {self.week_end.strftime('%d/%m/%Y')}",
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
        }


# ==================== UTILITY FUNCTIONS ====================

# Shift time templates
SHIFT_TEMPLATES = {
    "morning": {
        "start": "07:00:00",
        "end": "15:00:00",
        "label": "Morning (07:00 - 15:00)",
    },
    "evening": {
        "start": "15:00:00",
        "end": "23:00:00",
        "label": "Evening (15:00 - 23:00)",
    },
    "night": {"start": "23:00:00", "end": "07:00:00", "label": "Night (23:00 - 07:00)"},
    "standard": {
        "start": "09:00:00",
        "end": "17:00:00",
        "label": "Standard (09:00 - 17:00)",
    },
    "day_off": {
        "start": "00:00:00",
        "end": "00:00:00",
        "label": "Day Off",
    },
    "approved_leave": {
        "start": "00:00:00",
        "end": "00:00:00",
        "label": "Approved Leave",
    },
}


# Greek National Holidays
GREEK_HOLIDAYS = {
    '2025-01-01', '2025-01-06', '2025-03-03', '2025-03-25', '2025-04-18',
    '2025-04-20', '2025-04-21', '2025-05-01', '2025-06-08', '2025-06-09',
    '2025-08-15', '2025-10-28', '2025-12-25', '2025-12-26',
    '2026-01-01', '2026-01-06', '2026-02-23', '2026-03-25', '2026-04-10',
    '2026-04-12', '2026-04-13', '2026-05-01', '2026-05-31', '2026-06-01',
    '2026-08-15', '2026-10-28', '2026-12-25', '2026-12-26',
}


# ==================== AUTHENTICATION HELPERS ====================

def get_current_user():
    """Get current user from JWT token"""
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return db.session.get(User, int(user_id))


def role_required(*allowed_roles):
    """Decorator to require specific roles for endpoints
    
    Usage:
        @role_required('admin', 'soc_manager')
        def some_endpoint():
            ...
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"error": "User not found"}), 401
            
            if user.status != "active":
                return jsonify({"error": "Account not active"}), 403
            
            if user.role not in allowed_roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator


# ==================== HELPER FUNCTIONS ====================

def get_pay_multipliers():
    """Get pay multipliers from database or return defaults"""
    multipliers = {}
    rules = PayRule.query.filter_by(active=True).all()
    
    for rule in rules:
        multipliers[rule.rule_type] = rule.multiplier
    
    # Default Greek labor law multipliers
    defaults = {
        'normal': 1.00,
        'night': 1.25,
        'sunday_day': 1.75,
        'sunday_night': 2.00,
        'holiday_day': 1.75,
        'holiday_night': 2.00,
        'sixth_day': 1.30,
        'sixth_night': 1.55,
    }
    
    # Merge with defaults
    for key, value in defaults.items():
        if key not in multipliers:
            multipliers[key] = value
    
    return multipliers


# ==================== VALIDATION FUNCTIONS ====================

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_analyst_data(data, is_update=False):
    """Validate analyst data"""
    errors = []
    
    if not is_update or 'employee_id' in data:
        if not data.get('employee_id'):
            errors.append("Employee ID is required")
        elif len(data['employee_id']) > 50:
            errors.append("Employee ID too long (max 50 chars)")
    
    if not is_update or 'first_name' in data:
        if not data.get('first_name'):
            errors.append("First name is required")
        elif len(data['first_name']) > 100:
            errors.append("First name too long (max 100 chars)")
    
    if not is_update or 'last_name' in data:
        if not data.get('last_name'):
            errors.append("Last name is required")
        elif len(data['last_name']) > 100:
            errors.append("Last name too long (max 100 chars)")
    
    if not is_update or 'email' in data:
        if not data.get('email'):
            errors.append("Email is required")
        elif not validate_email(data['email']):
            errors.append("Invalid email format")
    
    if not is_update or 'base_hourly_rate' in data:
        if data.get('base_hourly_rate') is None:
            errors.append("Base hourly rate is required")
        elif data['base_hourly_rate'] <= 0:
            errors.append("Base hourly rate must be positive")
    
    return errors

def validate_shift_data(data, is_update=False):
    """Validate shift data"""
    errors = []
    
    if not is_update or 'analyst_id' in data:
        if not data.get('analyst_id'):
            errors.append("Analyst ID is required")
    
    if not is_update or 'shift_date' in data:
        if not data.get('shift_date'):
            errors.append("Shift date is required")
        else:
            try:
                shift_date = datetime.strptime(data['shift_date'], '%Y-%m-%d').date()
                if shift_date.year < 2000 or shift_date.year > 2100:
                    errors.append("Invalid year (must be between 2000 and 2100)")
            except ValueError:
                errors.append("Invalid date format (use YYYY-MM-DD)")
    
    if not is_update or 'start_time' in data:
        if not data.get('start_time'):
            errors.append("Start time is required")
        else:
            try:
                datetime.strptime(data['start_time'], '%H:%M:%S')
            except ValueError:
                errors.append("Invalid start time format (use HH:MM:SS)")
    
    if not is_update or 'end_time' in data:
        if not data.get('end_time'):
            errors.append("End time is required")
        else:
            try:
                datetime.strptime(data['end_time'], '%H:%M:%S')
            except ValueError:
                errors.append("Invalid end time format (use HH:MM:SS)")
    
    # Validate time range (start before end) for non-night shifts
    if data.get('start_time') and data.get('end_time'):
        try:
            start = datetime.strptime(data['start_time'], '%H:%M:%S').time()
            end = datetime.strptime(data['end_time'], '%H:%M:%S').time()
            # Allow night shifts (23:00 - 07:00) where end < start
            if start >= end and not (start.hour >= 20 or end.hour <= 10):
                errors.append("End time must be after start time (unless night shift)")
        except ValueError:
            pass  # Already caught above
    
    if not is_update or 'shift_type' in data:
        if not data.get('shift_type'):
            errors.append("Shift type is required")
    
    return errors

def check_shift_overlap(analyst_id, shift_date, start_time, end_time, exclude_shift_id=None):
    """Check if shift overlaps with existing shifts for same analyst"""
    existing_shifts = Shift.query.filter_by(
        analyst_id=analyst_id,
        shift_date=shift_date
    ).all()
    
    for shift in existing_shifts:
        if exclude_shift_id and shift.id == exclude_shift_id:
            continue
        
        # Convert to datetime for comparison
        new_start = datetime.combine(shift_date, start_time)
        new_end = datetime.combine(shift_date, end_time)
        exist_start = datetime.combine(shift.shift_date, shift.start_time)
        exist_end = datetime.combine(shift.shift_date, shift.end_time)
        
        # Handle night shifts that cross midnight
        if new_end <= new_start:
            new_end += timedelta(days=1)
        if exist_end <= exist_start:
            exist_end += timedelta(days=1)
        
        # Check for overlap
        if (new_start < exist_end and new_end > exist_start):
            return True, f"Shift overlaps with existing shift ({shift.start_time.strftime('%H:%M')} - {shift.end_time.strftime('%H:%M')})"
    
    return False, None


def is_sixth_consecutive_day(analyst_id, check_date):
    """
    Check if this is the 6th consecutive working day for an analyst.
    Returns True if analyst has worked 5 consecutive days before this date.
    """
    if isinstance(check_date, str):
        check_date = datetime.strptime(check_date, "%Y-%m-%d").date()
    
    # Get shifts from the past 5 days
    start_check = check_date - timedelta(days=5)
    
    shifts = Shift.query.filter(
        Shift.analyst_id == analyst_id,
        Shift.shift_date >= start_check,
        Shift.shift_date < check_date,
        ~Shift.shift_type.in_(['day_off', 'approved_leave'])
    ).order_by(Shift.shift_date).all()
    
    if len(shifts) < 5:
        return False
    
    # Check if there are 5 consecutive days
    dates_worked = set(shift.shift_date for shift in shifts)
    consecutive_count = 0
    current_date = check_date - timedelta(days=1)
    
    for _ in range(5):
        if current_date in dates_worked:
            consecutive_count += 1
            current_date -= timedelta(days=1)
        else:
            break
    
    return consecutive_count >= 5


def get_hour_multiplier(current_datetime, analyst_id, multipliers):
    """
    Get the appropriate multiplier for a specific hour based on Greek labor law.
    Priority: Sunday/Holiday > 6th Day > Night > Normal
    """
    date = current_datetime.date()
    date_str = date.isoformat()
    hour = current_datetime.hour
    day_of_week = date.weekday()  # 0=Monday, 6=Sunday
    
    is_sunday = (day_of_week == 6)
    is_holiday = (date_str in GREEK_HOLIDAYS)
    is_night = (hour >= 22 or hour < 6)  # 22:00-06:00
    is_sixth_day = is_sixth_consecutive_day(analyst_id, date)
    
    # Priority 1: Sunday or Holiday
    if is_sunday or is_holiday:
        if is_night:
            return multipliers['sunday_night'] if is_sunday else multipliers['holiday_night'], 'sunday_night' if is_sunday else 'holiday_night'
        else:
            return multipliers['sunday_day'] if is_sunday else multipliers['holiday_day'], 'sunday_day' if is_sunday else 'holiday_day'
    
    # Priority 2: 6th consecutive working day
    if is_sixth_day:
        if is_night:
            return multipliers['sixth_night'], 'sixth_night'
        else:
            return multipliers['sixth_day'], 'sixth_day'
    
    # Priority 3: Regular night
    if is_night:
        return multipliers['night'], 'night'
    
    # Default: Normal hours
    return multipliers['normal'], 'normal'


def calculate_hours_between_times(start_time, end_time):
    """Calculate hours between two time objects"""
    if isinstance(start_time, str):
        start_time = datetime.strptime(start_time, "%H:%M:%S").time()
    if isinstance(end_time, str):
        end_time = datetime.strptime(end_time, "%H:%M:%S").time()

    start_dt = datetime.combine(datetime.today(), start_time)
    end_dt = datetime.combine(datetime.today(), end_time)

    # Handle overnight shifts
    if end_dt <= start_dt:
        end_dt += timedelta(days=1)

    delta = end_dt - start_dt
    return delta.total_seconds() / 3600


def calculate_detailed_shift_breakdown(shift_date, start_time, end_time):
    """
    Calculate detailed hour breakdown for Greek labor laws.
    Returns hours worked per day, considering overnight shifts and day transitions.
    
    For example, Saturday 23:00 to Sunday 07:00:
    - Saturday: 1 hour (23:00-00:00)
    - Sunday before 6am (midnight hours): 6 hours (00:00-06:00)
    - Sunday after 6am: 1 hour (06:00-07:00)
    
    Returns dict with breakdown by date and time period
    """
    if isinstance(start_time, str):
        start_time = datetime.strptime(start_time, "%H:%M:%S").time()
    if isinstance(end_time, str):
        end_time = datetime.strptime(end_time, "%H:%M:%S").time()
    
    if isinstance(shift_date, str):
        shift_date = datetime.strptime(shift_date, "%Y-%m-%d").date()
    
    start_dt = datetime.combine(shift_date, start_time)
    end_dt = datetime.combine(shift_date, end_time)
    
    # Handle overnight shifts
    if end_dt <= start_dt:
        end_dt += timedelta(days=1)
    
    breakdown = {}
    current_dt = start_dt
    
    while current_dt < end_dt:
        current_date = current_dt.date()
        current_hour = current_dt.hour
        
        # Determine next checkpoint (midnight or 6am or end of shift)
        next_checkpoint = min(end_dt, current_dt.replace(hour=23, minute=59, second=59) + timedelta(seconds=1))
        
        # Check for 6am boundary (important for Greek labor laws - night shift premium ends)
        if current_hour < 6:
            six_am = current_dt.replace(hour=6, minute=0, second=0)
            if six_am < end_dt and current_dt < six_am:
                next_checkpoint = min(next_checkpoint, six_am)
        
        # Calculate hours for this segment
        segment_hours = (next_checkpoint - current_dt).total_seconds() / 3600
        
        # Categorize the time period
        date_key = current_date.isoformat()
        is_night = current_hour >= 22 or current_hour < 6  # Night: 22:00-06:00
        
        period_key = f"{date_key}_night" if is_night else f"{date_key}_day"
        
        if date_key not in breakdown:
            breakdown[date_key] = {
                'date': date_key,
                'day_of_week': current_date.weekday(),
                'day_hours': 0,
                'night_hours': 0,
                'total_hours': 0
            }
        
        if is_night:
            breakdown[date_key]['night_hours'] += segment_hours
        else:
            breakdown[date_key]['day_hours'] += segment_hours
        
        breakdown[date_key]['total_hours'] += segment_hours
        
        current_dt = next_checkpoint
    
    return breakdown


def calculate_shift_pay(analyst_id, shift_date, start_time, end_time, shift_type):
    """
    Calculate comprehensive shift pay according to Greek labor law.
    Slices the shift into 1-hour segments and applies appropriate multipliers.
    Returns detailed breakdown including hours, multipliers, and total pay.
    """
    analyst = Analyst.query.get(analyst_id)
    if not analyst:
        raise ValueError(f"Analyst {analyst_id} not found")
    
    hourly_rate = analyst.base_hourly_rate
    
    # Skip calculation for non-work shifts
    if shift_type in ['day_off', 'approved_leave']:
        return {
            'total_hours': 0,
            'total_pay': 0,
            'base_pay': 0,
            'avg_multiplier': 1.0,
            'breakdown': []
        }
    
    # Convert to datetime objects
    if isinstance(start_time, str):
        start_time = datetime.strptime(start_time, "%H:%M:%S").time()
    if isinstance(end_time, str):
        end_time = datetime.strptime(end_time, "%H:%M:%S").time()
    if isinstance(shift_date, str):
        shift_date = datetime.strptime(shift_date, "%Y-%m-%d").date()
    
    start_dt = datetime.combine(shift_date, start_time)
    end_dt = datetime.combine(shift_date, end_time)
    
    # Handle overnight shifts
    if end_dt <= start_dt:
        end_dt += timedelta(days=1)
    
    # Get multipliers
    multipliers = get_pay_multipliers()
    
    # Calculate pay hour by hour
    total_pay = 0
    total_hours = 0
    breakdown_details = []
    current_dt = start_dt
    
    while current_dt < end_dt:
        # Calculate hours in this segment (1 hour or remaining time)
        next_dt = min(current_dt + timedelta(hours=1), end_dt)
        segment_hours = (next_dt - current_dt).total_seconds() / 3600
        
        # Get multiplier for this hour
        multiplier, rule_type = get_hour_multiplier(current_dt, analyst_id, multipliers)
        
        # Calculate pay for this segment
        segment_pay = segment_hours * hourly_rate * multiplier
        
        total_pay += segment_pay
        total_hours += segment_hours
        
        breakdown_details.append({
            'datetime': current_dt.isoformat(),
            'hours': round(segment_hours, 2),
            'multiplier': multiplier,
            'rule_type': rule_type,
            'pay': round(segment_pay, 2)
        })
        
        current_dt = next_dt
    
    avg_multiplier = (total_pay / (total_hours * hourly_rate)) if total_hours > 0 else 1.0
    
    return {
        'total_hours': round(total_hours, 2),
        'total_pay': round(total_pay, 2),
        'base_pay': round(total_hours * hourly_rate, 2),
        'avg_multiplier': round(avg_multiplier, 3),
        'breakdown': breakdown_details
    }


# ==================== API ENDPOINTS - AUTHENTICATION ====================

@app.route("/api/auth/setup", methods=["GET", "POST"])
def setup_admin():
    """First-run setup: Check if admin exists, create if needed"""
    
    if request.method == "GET":
        # Check if any users exist
        user_count = User.query.count()
        return jsonify({"needs_setup": user_count == 0}), 200
    
    # POST: Create first admin
    # Only allow if no users exist
    if User.query.count() > 0:
        return jsonify({"error": "Setup already completed"}), 400
    
    data = request.json
    
    # Validate required fields
    if not all(k in data for k in ["username", "email", "password"]):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Validate password strength
    if len(data["password"]) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    
    # Create admin user
    admin = User(
        username=data["username"],
        email=data["email"],
        role="admin",
        status="active",  # Auto-activate first admin
        force_password_change=False
    )
    admin.set_password(data["password"])
    
    try:
        db.session.add(admin)
        db.session.commit()
        return jsonify({
            "message": "Admin account created successfully",
            "user": admin.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/auth/register", methods=["POST"])
def register():
    """Self-registration endpoint (pending approval)"""
    data = request.json
    
    # Validate required fields
    if not all(k in data for k in ["username", "email", "password"]):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Validate password strength
    if len(data["password"]) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    
    # Check if username or email already exists
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already exists"}), 400
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already exists"}), 400
    
    # Create user with pending status
    user = User(
        username=data["username"],
        email=data["email"],
        status="pending_approval",  # Requires admin approval
        force_password_change=False
    )
    user.set_password(data["password"])
    
    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({
            "message": "Registration successful. Awaiting admin approval.",
            "user": user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/auth/login", methods=["POST"])
def login():
    """Login endpoint - returns access and refresh tokens"""
    data = request.json
    
    if not all(k in data for k in ["username", "password"]):
        return jsonify({"error": "Missing username or password"}), 400
    
    # Find user
    user = User.query.filter_by(username=data["username"]).first()
    
    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Check if user is active
    if not user.active:
        return jsonify({"error": "Account is inactive"}), 403
    
    # Check if user is approved
    if user.status == "pending_approval":
        return jsonify({"error": "Account pending admin approval"}), 403
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Create tokens (identity must be string)
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(),
        "force_password_change": user.force_password_change
    }), 200


@app.route("/api/auth/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token"""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    
    if not user or not user.active or user.status != "active":
        return jsonify({"error": "Invalid user"}), 401
    
    access_token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": access_token}), 200


@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def get_current_user_info():
    """Get current user information from token"""
    user = get_current_user()
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({"user": user.to_dict()}), 200


@app.route("/api/auth/change-password", methods=["PUT"])
@jwt_required()
def change_password():
    """Change current user's password"""
    user = get_current_user()
    data = request.json
    
    if not all(k in data for k in ["current_password", "new_password"]):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Verify current password
    if not user.check_password(data["current_password"]):
        return jsonify({"error": "Current password is incorrect"}), 400
    
    # Validate new password
    if len(data["new_password"]) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400
    
    # Update password
    user.set_password(data["new_password"])
    user.force_password_change = False  # Clear flag if it was set
    
    try:
        db.session.commit()
        return jsonify({"message": "Password changed successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ==================== API ENDPOINTS - USER MANAGEMENT ====================

@app.route("/api/users", methods=["GET"])
@role_required("admin", "soc_manager")
def get_users():
    """Get all users (admin and soc_manager only)"""
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([user.to_dict(include_sensitive=True) for user in users]), 200


@app.route("/api/users/<int:user_id>", methods=["GET"])
@role_required("admin", "soc_manager")
def get_user(user_id):
    """Get specific user (admin and soc_manager only)"""
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict(include_sensitive=True)), 200


@app.route("/api/users", methods=["POST"])
@role_required("admin", "soc_manager")
def create_user():
    """Create new user (admin and soc_manager only)"""
    data = request.json
    current_user = get_current_user()
    
    # Validate required fields
    if not all(k in data for k in ["username", "email", "password", "role"]):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Validate role
    valid_roles = ["admin", "soc_manager", "shift_coordinator", "l1_analyst", "l2_analyst", "hr_payroll"]
    if data["role"] not in valid_roles:
        return jsonify({"error": f"Invalid role. Must be one of: {', '.join(valid_roles)}"}), 400
    
    # Check if username or email already exists
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already exists"}), 400
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already exists"}), 400
    
    # Check if analyst_id is already assigned to another user
    if data.get("analyst_id"):
        existing_user = User.query.filter_by(analyst_id=data["analyst_id"]).first()
        if existing_user:
            return jsonify({"error": f"This analyst is already assigned to user '{existing_user.username}'"}), 400
    
    # Create user
    user = User(
        username=data["username"],
        email=data["email"],
        role=data["role"],
        analyst_id=data.get("analyst_id"),
        status="active",  # Admin-created users are auto-approved
        force_password_change=True,  # Force password change on first login
        approved_by=current_user.id,
        approved_at=datetime.utcnow()
    )
    user.set_password(data["password"])
    
    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({
            "message": "User created successfully",
            "user": user.to_dict(include_sensitive=True)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/users/<int:user_id>", methods=["PUT"])
@role_required("admin", "soc_manager")
def update_user(user_id):
    """Update user (admin and soc_manager only)"""
    user = User.query.get_or_404(user_id)
    data = request.json
    current_user = get_current_user()
    
    # Update fields
    if "email" in data:
        # Check if email is taken by another user
        existing = User.query.filter_by(email=data["email"]).first()
        if existing and existing.id != user_id:
            return jsonify({"error": "Email already exists"}), 400
        user.email = data["email"]
    
    if "role" in data:
        valid_roles = ["admin", "soc_manager", "shift_coordinator", "l1_analyst", "l2_analyst", "hr_payroll"]
        if data["role"] not in valid_roles:
            return jsonify({"error": f"Invalid role"}), 400
        user.role = data["role"]
    
    if "analyst_id" in data:
        # Check if analyst_id is already assigned to another user
        if data["analyst_id"]:
            existing_user = User.query.filter_by(analyst_id=data["analyst_id"]).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({"error": f"This analyst is already assigned to user '{existing_user.username}'"}), 400
        user.analyst_id = data["analyst_id"]
    
    if "active" in data:
        user.active = data["active"]
    
    try:
        db.session.commit()
        return jsonify({
            "message": "User updated successfully",
            "user": user.to_dict(include_sensitive=True)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/users/<int:user_id>/approve", methods=["POST"])
@role_required("admin", "soc_manager")
def approve_user(user_id):
    """Approve pending user and assign role (admin and soc_manager only)"""
    user = User.query.get_or_404(user_id)
    current_user = get_current_user()
    data = request.json
    
    if user.status != "pending_approval":
        return jsonify({"error": "User is not pending approval"}), 400
    
    # Validate and assign role
    if "role" not in data:
        return jsonify({"error": "Role is required for approval"}), 400
    
    valid_roles = ["admin", "soc_manager", "shift_coordinator", "l1_analyst", "l2_analyst", "hr_payroll"]
    if data["role"] not in valid_roles:
        return jsonify({"error": f"Invalid role"}), 400
    
    # Check if analyst_id is already assigned to another user
    if data.get("analyst_id"):
        existing_user = User.query.filter_by(analyst_id=data["analyst_id"]).first()
        if existing_user and existing_user.id != user_id:
            return jsonify({"error": f"This analyst is already assigned to user '{existing_user.username}'"}), 400
    
    # Approve user
    user.status = "active"
    user.role = data["role"]
    user.analyst_id = data.get("analyst_id")
    user.approved_by = current_user.id
    user.approved_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({
            "message": "User approved successfully",
            "user": user.to_dict(include_sensitive=True)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
@role_required("admin", "soc_manager")
def delete_user(user_id):
    """Delete user (admin and soc_manager only)"""
    user = User.query.get_or_404(user_id)
    current_user = get_current_user()
    
    # Prevent self-deletion
    if user.id == current_user.id:
        return jsonify({"error": "Cannot delete your own account"}), 400
    
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/users/<int:user_id>/reset-password", methods=["PUT"])
@role_required("admin", "soc_manager")
def admin_reset_password(user_id):
    """Reset user password (admin and soc_manager only, no current password needed)"""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    new_password = data.get('new_password')
    if not new_password or len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    
    try:
        user.set_password(new_password)
        user.force_password_change = True  # Force user to change password on next login
        db.session.commit()
        return jsonify({"message": "Password reset successfully. User will be prompted to change it on next login."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ==================== API ENDPOINTS - ANALYSTS ====================


@app.route("/api/analysts", methods=["GET"])
def get_analysts():
    """Get all analysts"""
    analysts = Analyst.query.all()
    return jsonify([a.to_dict() for a in analysts]), 200


@app.route("/api/analysts", methods=["POST"])
def create_analyst():
    """Create a new analyst"""
    data = request.json

    # Validate input data
    errors = validate_analyst_data(data)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    try:
        # Check for duplicate employee_id
        existing = Analyst.query.filter_by(employee_id=data["employee_id"]).first()
        if existing:
            return jsonify({"error": "Employee ID already exists"}), 400
        
        # Check for duplicate email
        existing_email = Analyst.query.filter_by(email=data["email"]).first()
        if existing_email:
            return jsonify({"error": "Email already exists"}), 400

        daily_hours = data.get("daily_hours", 8.0)
        
        # Bidirectional calculation: monthly_salary <-> hourly_rate
        if "monthly_salary" in data and data["monthly_salary"]:
            # Calculate hourly rate from monthly salary
            # Formula: hourly_rate = (monthly_salary / 25) / daily_hours
            monthly_salary = float(data["monthly_salary"])
            base_hourly_rate = (monthly_salary / 25) / daily_hours
        elif "base_hourly_rate" in data:
            # Calculate monthly salary from hourly rate
            base_hourly_rate = float(data["base_hourly_rate"])
            monthly_salary = (base_hourly_rate * daily_hours) * 25
        else:
            return jsonify({"error": "Either monthly_salary or base_hourly_rate must be provided"}), 400
        
        analyst = Analyst(
            employee_id=data["employee_id"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            email=data["email"],
            base_hourly_rate=base_hourly_rate,
            monthly_salary=monthly_salary,
            daily_hours=daily_hours,
            analyst_level=data.get("analyst_level", "L1"),
            # created_by will be set once auth is implemented
        )
        db.session.add(analyst)
        db.session.commit()
        return jsonify(analyst.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@app.route("/api/analysts/<int:analyst_id>", methods=["GET"])
def get_analyst(analyst_id):
    """Get a specific analyst"""
    analyst = Analyst.query.get_or_404(analyst_id)
    return jsonify(analyst.to_dict()), 200


@app.route("/api/analysts/<int:analyst_id>", methods=["PUT"])
def update_analyst(analyst_id):
    """Update an analyst"""
    analyst = Analyst.query.get_or_404(analyst_id)
    data = request.json

    # Validate input data
    errors = validate_analyst_data(data, is_update=True)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    try:
        # Check for duplicate email if email is being changed
        if 'email' in data and data['email'] != analyst.email:
            existing_email = Analyst.query.filter_by(email=data["email"]).first()
            if existing_email:
                return jsonify({"error": "Email already exists"}), 400

        analyst.first_name = data.get("first_name", analyst.first_name)
        analyst.last_name = data.get("last_name", analyst.last_name)
        analyst.status = data.get("status", analyst.status)
        analyst.daily_hours = data.get("daily_hours", analyst.daily_hours)
        analyst.analyst_level = data.get("analyst_level", analyst.analyst_level)
        
        if 'email' in data:
            analyst.email = data['email']
        
        # Bidirectional calculation
        if "monthly_salary" in data and data["monthly_salary"]:
            analyst.monthly_salary = float(data["monthly_salary"])
            analyst.base_hourly_rate = (analyst.monthly_salary / 25) / analyst.daily_hours
        elif "base_hourly_rate" in data:
            analyst.base_hourly_rate = float(data["base_hourly_rate"])
            analyst.monthly_salary = (analyst.base_hourly_rate * analyst.daily_hours) * 25

        # modified_by will be set once auth is implemented
        db.session.commit()
        return jsonify(analyst.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@app.route("/api/analysts/<int:analyst_id>", methods=["DELETE"])
def delete_analyst(analyst_id):
    """Delete an analyst"""
    analyst = Analyst.query.get_or_404(analyst_id)
    db.session.delete(analyst)
    db.session.commit()
    return jsonify({"message": "Analyst deleted"}), 200


# ==================== API ENDPOINTS - SHIFTS ====================


@app.route("/api/shift-templates", methods=["GET"])
def get_shift_templates():
    """Get available shift templates"""
    templates = [
        {
            "type": key,
            "label": value["label"],
            "start": value["start"],
            "end": value["end"],
        }
        for key, value in SHIFT_TEMPLATES.items()
    ]
    return jsonify(templates), 200


@app.route("/api/shifts", methods=["GET"])
def get_shifts():
    """Get all shifts with optional filtering"""
    analyst_id = request.args.get("analyst_id")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    query = Shift.query

    if analyst_id:
        query = query.filter_by(analyst_id=analyst_id)
    if start_date:
        query = query.filter(Shift.shift_date >= start_date)
    if end_date:
        query = query.filter(Shift.shift_date <= end_date)

    shifts = query.order_by(Shift.shift_date.desc()).all()
    return jsonify([s.to_dict() for s in shifts]), 200


@app.route("/api/shifts", methods=["POST"])
@jwt_required()
def create_shift():
    """Create a new shift"""
    data = request.json
    current_user = get_current_user()

    try:
        # Basic validation
        if not data.get("analyst_id"):
            return jsonify({"error": "Analyst ID is required"}), 400
        if not data.get("shift_date"):
            return jsonify({"error": "Shift date is required"}), 400
        
        analyst = Analyst.query.get_or_404(data["analyst_id"])

        # Get shift template
        shift_type = data.get("shift_type", "standard")
        if shift_type not in SHIFT_TEMPLATES:
            return jsonify({"error": "Invalid shift_type"}), 400

        template = SHIFT_TEMPLATES[shift_type]
        start_time = template["start"]
        end_time = template["end"]

        # Normalize times to Python time objects for DB storage (SQLite Time expects time objects)
        start_time_obj = (
            datetime.strptime(start_time, "%H:%M:%S").time()
            if isinstance(start_time, str)
            else start_time
        )
        end_time_obj = (
            datetime.strptime(end_time, "%H:%M:%S").time()
            if isinstance(end_time, str)
            else end_time
        )

        # Normalize shift_date to a Python date object (SQLite Date expects date objects)
        shift_date_obj = (
            datetime.strptime(data["shift_date"], "%Y-%m-%d").date()
            if isinstance(data.get("shift_date"), str)
            else data.get("shift_date")
        )

        # Check for shift overlaps
        has_overlap, overlap_msg = check_shift_overlap(
            data["analyst_id"],
            shift_date_obj,
            start_time_obj,
            end_time_obj
        )
        if has_overlap:
            return jsonify({"error": overlap_msg}), 400

        # Calculate hours and pay using new Greek labor law system
        pay_calc = calculate_shift_pay(
            data["analyst_id"],
            shift_date_obj,
            start_time_obj,
            end_time_obj,
            shift_type
        )

        shift = Shift(
            analyst_id=data["analyst_id"],
            shift_date=shift_date_obj,
            start_time=start_time_obj,
            end_time=end_time_obj,
            shift_type=shift_type,
            work_location=data.get("work_location", "office"),
            hours_worked=pay_calc['total_hours'],
            pay_multiplier=pay_calc['avg_multiplier'],
            base_pay=pay_calc['base_pay'],
            total_pay=pay_calc['total_pay'],
            notes=data.get("notes"),
            created_by=current_user.id if current_user else None,
            modified_by=current_user.id if current_user else None,
        )

        db.session.add(shift)
        db.session.commit()
        return jsonify(shift.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@app.route("/api/shifts/<int:shift_id>", methods=["GET"])
def get_shift(shift_id):
    """Get a specific shift"""
    shift = Shift.query.get_or_404(shift_id)
    return jsonify(shift.to_dict()), 200


@app.route("/api/shifts/<int:shift_id>", methods=["PUT"])
@jwt_required()
def update_shift(shift_id):
    """Update a shift"""
    shift = Shift.query.get_or_404(shift_id)
    data = request.json
    current_user = get_current_user()

    try:
        # Update audit field
        if current_user:
            shift.modified_by = current_user.id
        # Normalize shift_date if provided (convert string to date)
        if "shift_date" in data:
            shift.shift_date = (
                datetime.strptime(data["shift_date"], "%Y-%m-%d").date()
                if isinstance(data.get("shift_date"), str)
                else data.get("shift_date")
            )

        # If shift_type is updated, recalculate start/end times from template
        if "shift_type" in data:
            shift.shift_type = data["shift_type"]
            if shift.shift_type in SHIFT_TEMPLATES:
                template = SHIFT_TEMPLATES[shift.shift_type]
                shift.start_time = (
                    datetime.strptime(template["start"], "%H:%M:%S").time()
                )
                shift.end_time = (
                    datetime.strptime(template["end"], "%H:%M:%S").time()
                )
        else:
            # Manual time update (if provided)
            if "start_time" in data:
                shift.start_time = (
                    datetime.strptime(data["start_time"], "%H:%M:%S").time()
                    if isinstance(data.get("start_time"), str)
                    else data.get("start_time")
                )
            if "end_time" in data:
                shift.end_time = (
                    datetime.strptime(data["end_time"], "%H:%M:%S").time()
                    if isinstance(data.get("end_time"), str)
                    else data.get("end_time")
                )

        shift.notes = data.get("notes", shift.notes)
        shift.work_location = data.get("work_location", shift.work_location)

        # Recalculate hours and pay using new Greek labor law system
        pay_calc = calculate_shift_pay(
            shift.analyst_id,
            shift.shift_date,
            shift.start_time,
            shift.end_time,
            shift.shift_type
        )
        
        shift.hours_worked = pay_calc['total_hours']
        shift.pay_multiplier = pay_calc['avg_multiplier']
        shift.base_pay = pay_calc['base_pay']
        shift.total_pay = pay_calc['total_pay']

        db.session.commit()
        return jsonify(shift.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@app.route("/api/shifts/<int:shift_id>", methods=["DELETE"])
@jwt_required()
def delete_shift(shift_id):
    """Delete a shift"""
    shift = Shift.query.get_or_404(shift_id)
    db.session.delete(shift)
    db.session.commit()
    return jsonify({"message": "Shift deleted"}), 200


# ==================== API ENDPOINTS - PAY RULES ====================


@app.route("/api/pay-rules", methods=["GET"])
def get_pay_rules():
    """Get all pay rules"""
    rules = PayRule.query.filter_by(active=True).all()
    return jsonify([r.to_dict() for r in rules]), 200


@app.route("/api/pay-rules", methods=["POST"])
def create_pay_rule():
    """Create a new pay rule"""
    data = request.json

    try:
        rule = PayRule(
            rule_name=data["rule_name"],
            rule_type=data.get("rule_type"),
            multiplier=data["multiplier"],
            description=data.get("description"),
            active=data.get("active", True),
        )
        db.session.add(rule)
        db.session.commit()
        return jsonify(rule.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@app.route("/api/pay-rules/<int:rule_id>", methods=["PUT"])
def update_pay_rule(rule_id):
    """Update a pay rule"""
    rule = PayRule.query.get_or_404(rule_id)
    data = request.json

    rule.multiplier = data.get("multiplier", rule.multiplier)
    rule.active = data.get("active", rule.active)
    rule.description = data.get("description", rule.description)

    db.session.commit()
    return jsonify(rule.to_dict()), 200


@app.route("/api/pay-rules/initialize", methods=["POST"])
def initialize_pay_rules():
    """Initialize default Greek labor law pay rules"""
    try:
        # Check if rules already exist
        existing_count = PayRule.query.count()
        if existing_count > 0:
            return jsonify({
                "message": "Pay rules already exist",
                "count": existing_count
            }), 200
        
        # Default multipliers according to Greek labor law
        default_rules = [
            {"rule_type": "normal", "multiplier": 1.00, "description": "Normal weekday daytime (06:00-22:00)"},
            {"rule_type": "night", "multiplier": 1.25, "description": "Night hours (22:00-06:00)"},
            {"rule_type": "sunday_day", "multiplier": 1.75, "description": "Sunday daytime (06:00-22:00)"},
            {"rule_type": "sunday_night", "multiplier": 2.00, "description": "Sunday night (22:00-06:00)"},
            {"rule_type": "holiday_day", "multiplier": 1.75, "description": "Holiday daytime (06:00-22:00)"},
            {"rule_type": "holiday_night", "multiplier": 2.00, "description": "Holiday night (22:00-06:00)"},
            {"rule_type": "sixth_day", "multiplier": 1.30, "description": "6th consecutive work day daytime"},
            {"rule_type": "sixth_night", "multiplier": 1.55, "description": "6th consecutive work day night"},
        ]
        
        for rule_data in default_rules:
            rule = PayRule(
                rule_name=rule_data["rule_type"].replace("_", " ").title(),
                rule_type=rule_data["rule_type"],
                multiplier=rule_data["multiplier"],
                description=rule_data["description"],
                active=True
            )
            db.session.add(rule)
        
        db.session.commit()
        return jsonify({
            "message": "Default pay rules initialized",
            "count": len(default_rules)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@app.route("/api/shifts/recalculate-all", methods=["POST"])
def recalculate_all_shifts():
    """Recalculate pay for all existing shifts using new Greek labor law system"""
    try:
        data = request.json or {}
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        
        # Build query
        query = Shift.query
        if start_date:
            query = query.filter(Shift.shift_date >= datetime.strptime(start_date, "%Y-%m-%d").date())
        if end_date:
            query = query.filter(Shift.shift_date <= datetime.strptime(end_date, "%Y-%m-%d").date())
        
        shifts = query.all()
        updated_count = 0
        skipped_count = 0
        
        for shift in shifts:
            try:
                # Recalculate using new system
                pay_calc = calculate_shift_pay(
                    shift.analyst_id,
                    shift.shift_date,
                    shift.start_time,
                    shift.end_time,
                    shift.shift_type
                )
                
                # Update shift with new calculations
                shift.hours_worked = pay_calc['total_hours']
                shift.pay_multiplier = pay_calc['avg_multiplier']
                shift.base_pay = pay_calc['base_pay']
                shift.total_pay = pay_calc['total_pay']
                
                updated_count += 1
            except Exception as e:
                app.logger.warning(f"Failed to recalculate shift {shift.id}: {str(e)}")
                skipped_count += 1
        
        db.session.commit()
        
        return jsonify({
            "message": "Shifts recalculated successfully",
            "updated": updated_count,
            "skipped": skipped_count,
            "total": len(shifts)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


# ==================== API ENDPOINTS - ANALYTICS ====================


@app.route("/api/analytics/analyst-summary/<int:analyst_id>", methods=["GET"])
def get_analyst_summary(analyst_id):
    """Get detailed shift information for payroll calculation (no final pay amounts)"""
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    analyst = Analyst.query.get_or_404(analyst_id)

    query = Shift.query.filter_by(analyst_id=analyst_id)
    if start_date:
        query = query.filter(Shift.shift_date >= start_date)
    if end_date:
        query = query.filter(Shift.shift_date <= end_date)

    shifts = query.order_by(Shift.shift_date).all()

    total_hours = sum(s.hours_worked for s in shifts if s.shift_type not in ['day_off', 'approved_leave'])
    total_shifts = len([s for s in shifts if s.shift_type not in ['day_off', 'approved_leave']])

    # Count shifts by type
    shift_types = {}
    for shift in shifts:
        if shift.shift_type not in shift_types:
            shift_types[shift.shift_type] = 0
        shift_types[shift.shift_type] += 1

    # Detailed shift list with all calculation factors including hour-by-hour breakdown
    detailed_shifts = []
    for shift in shifts:
        # Calculate detailed breakdown for work shifts
        multiplier_breakdown = []
        if shift.shift_type not in ['day_off', 'approved_leave'] and shift.start_time and shift.end_time:
            try:
                pay_calc = calculate_shift_pay(
                    shift.analyst_id,
                    shift.shift_date,
                    shift.start_time,
                    shift.end_time,
                    shift.shift_type
                )
                # Group by multiplier and rule type for cleaner display
                multiplier_summary = {}
                for segment in pay_calc['breakdown']:
                    key = f"{segment['rule_type']}_{segment['multiplier']}"
                    if key not in multiplier_summary:
                        multiplier_summary[key] = {
                            'rule_type': segment['rule_type'],
                            'multiplier': segment['multiplier'],
                            'hours': 0
                        }
                    multiplier_summary[key]['hours'] += segment['hours']
                
                multiplier_breakdown = [
                    {
                        'rule_type': v['rule_type'],
                        'multiplier': v['multiplier'],
                        'hours': round(v['hours'], 2)
                    }
                    for v in multiplier_summary.values()
                ]
            except Exception as e:
                print(f"Error calculating breakdown for shift {shift.id}: {e}")
                multiplier_breakdown = []
        
        detailed_shifts.append({
            "shift_id": shift.id,
            "date": shift.shift_date.strftime("%Y-%m-%d"),
            "day_of_week": shift.shift_date.strftime("%A"),
            "shift_type": shift.shift_type,
            "start_time": shift.start_time.strftime("%H:%M") if shift.start_time else None,
            "end_time": shift.end_time.strftime("%H:%M") if shift.end_time else None,
            "hours_worked": round(shift.hours_worked, 2) if shift.hours_worked else 0,
            "pay_multiplier": shift.pay_multiplier,
            "work_location": shift.work_location,
            "notes": shift.notes,
            "multiplier_breakdown": multiplier_breakdown  # NEW: detailed breakdown
        })

    return (
        jsonify(
            {
                "analyst_id": analyst_id,
                "analyst_name": f"{analyst.first_name} {analyst.last_name}",
                "total_shifts": total_shifts,
                "total_hours": round(total_hours, 2),
                "shift_type_breakdown": shift_types,
                "detailed_shifts": detailed_shifts,
                "period": {"start_date": start_date, "end_date": end_date},
            }
        ),
        200,
    )


@app.route("/api/analytics/team-summary", methods=["GET"])
def get_team_summary():
    """Get shift summary stats for entire team with aggregated multiplier breakdown"""
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    query = Shift.query
    if start_date:
        query = query.filter(Shift.shift_date >= start_date)
    if end_date:
        query = query.filter(Shift.shift_date <= end_date)

    shifts = query.all()

    total_hours = sum(s.hours_worked for s in shifts if s.shift_type not in ['day_off', 'approved_leave'])
    total_shifts = len([s for s in shifts if s.shift_type not in ['day_off', 'approved_leave']])
    num_analysts = len(set(s.analyst_id for s in shifts if s.shift_type not in ['day_off', 'approved_leave']))

    # Aggregate multiplier breakdown across all shifts
    team_multiplier_summary = {}
    for shift in shifts:
        if shift.shift_type not in ['day_off', 'approved_leave'] and shift.start_time and shift.end_time:
            try:
                pay_calc = calculate_shift_pay(
                    shift.analyst_id,
                    shift.shift_date,
                    shift.start_time,
                    shift.end_time,
                    shift.shift_type
                )
                # Aggregate by rule type and multiplier
                for segment in pay_calc['breakdown']:
                    key = f"{segment['rule_type']}_{segment['multiplier']}"
                    if key not in team_multiplier_summary:
                        team_multiplier_summary[key] = {
                            'rule_type': segment['rule_type'],
                            'multiplier': segment['multiplier'],
                            'hours': 0
                        }
                    team_multiplier_summary[key]['hours'] += segment['hours']
            except Exception as e:
                print(f"Error calculating breakdown for shift {shift.id}: {e}")
                continue

    # Convert to list and round hours
    team_multiplier_breakdown = [
        {
            'rule_type': v['rule_type'],
            'multiplier': v['multiplier'],
            'hours': round(v['hours'], 2)
        }
        for v in sorted(team_multiplier_summary.values(), key=lambda x: x['multiplier'])
    ]

    return (
        jsonify(
            {
                "total_shifts": total_shifts,
                "total_hours": round(total_hours, 2),
                "num_analysts": num_analysts,
                "multiplier_breakdown": team_multiplier_breakdown,
                "period": {"start_date": start_date, "end_date": end_date},
            }
        ),
        200,
    )


@app.route("/api/analytics/payroll-details/<int:analyst_id>", methods=["GET"])
def get_payroll_details(analyst_id):
    """
    DEPRECATED: Payroll details endpoint removed for privacy.
    Use analyst-summary endpoint instead for shift metrics.
    Payroll calculations should be done by payroll team with real rates.
    """
    return jsonify({
        "error": "Payroll endpoint deprecated",
        "message": "Use /api/analytics/analyst-summary/{analyst_id} for shift metrics instead",
        "note": "Payroll calculations should be handled separately by payroll team"
    }), 410  # 410 Gone
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    analyst = Analyst.query.get_or_404(analyst_id)

    query = Shift.query.filter_by(analyst_id=analyst_id)
    if start_date:
        query = query.filter(Shift.shift_date >= start_date)
    if end_date:
        query = query.filter(Shift.shift_date <= end_date)

    shifts = query.all()

    # Initialize breakdown counters
    breakdown = {
        'monday_hours': 0,
        'tuesday_hours': 0,
        'wednesday_hours': 0,
        'thursday_hours': 0,
        'friday_hours': 0,
        'saturday_hours': 0,
        'sunday_hours': 0,
        'night_hours': 0,  # 22:00-06:00
        'saturday_night_hours': 0,
        'sunday_night_hours': 0,
        'total_night_shifts': 0,
        'total_weekend_hours': 0,
        'total_regular_hours': 0,
        'day_off_count': 0,
        'approved_leave_count': 0,
        'remote_hours': 0,
        'office_hours': 0,
    }

    day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    for shift in shifts:
        # Skip non-working shifts
        if shift.shift_type in ['day_off', 'approved_leave']:
            if shift.shift_type == 'day_off':
                breakdown['day_off_count'] += 1
            else:
                breakdown['approved_leave_count'] += 1
            continue
        
        # Get detailed breakdown for this shift
        shift_breakdown = calculate_detailed_shift_breakdown(
            shift.shift_date, 
            shift.start_time, 
            shift.end_time
        )
        
        # Count night shifts (shifts that include night hours)
        has_night_hours = any(details['night_hours'] > 0 for details in shift_breakdown.values())
        if has_night_hours:
            breakdown['total_night_shifts'] += 1
        
        # Process each day segment
        for date_key, details in shift_breakdown.items():
            day_of_week = details['day_of_week']
            day_hours = details['day_hours']
            night_hours = details['night_hours']
            
            # Add to day of week totals
            day_key = f"{day_names[day_of_week]}_hours"
            breakdown[day_key] += details['total_hours']
            
            # Add to night hours
            breakdown['night_hours'] += night_hours
            
            # Track remote/office hours
            if shift.work_location == 'remote':
                breakdown['remote_hours'] += details['total_hours']
            else:
                breakdown['office_hours'] += details['total_hours']
            
            # Weekend night hours
            if day_of_week == 5:  # Saturday
                breakdown['saturday_night_hours'] += night_hours
                breakdown['total_weekend_hours'] += details['total_hours']
            elif day_of_week == 6:  # Sunday
                breakdown['sunday_night_hours'] += night_hours
                breakdown['total_weekend_hours'] += details['total_hours']
            else:
                breakdown['total_regular_hours'] += details['total_hours']

    # Calculate totals and pay
    total_hours = sum(breakdown[f'{day}_hours'] for day in day_names)
    base_rate = analyst.base_hourly_rate
    
    # Calculate estimated pay with premiums
    regular_pay = breakdown['total_regular_hours'] * base_rate
    saturday_pay = breakdown['saturday_hours'] * base_rate * 1.5
    sunday_pay = breakdown['sunday_hours'] * base_rate * 1.75
    
    total_pay = regular_pay + saturday_pay + sunday_pay

    return jsonify({
        'analyst_id': analyst_id,
        'analyst_name': f"{analyst.first_name} {analyst.last_name}",
        'employee_id': analyst.employee_id,
        'base_hourly_rate': base_rate,
        'period': {
            'start_date': start_date,
            'end_date': end_date
        },
        'hours_breakdown': {
            'monday': round(breakdown['monday_hours'], 2),
            'tuesday': round(breakdown['tuesday_hours'], 2),
            'wednesday': round(breakdown['wednesday_hours'], 2),
            'thursday': round(breakdown['thursday_hours'], 2),
            'friday': round(breakdown['friday_hours'], 2),
            'saturday': round(breakdown['saturday_hours'], 2),
            'sunday': round(breakdown['sunday_hours'], 2),
            'total_hours': round(total_hours, 2),
        },
        'special_hours': {
            'night_hours_total': round(breakdown['night_hours'], 2),
            'saturday_night_hours': round(breakdown['saturday_night_hours'], 2),
            'sunday_night_hours': round(breakdown['sunday_night_hours'], 2),
            'total_night_shifts': breakdown['total_night_shifts'],
            'total_weekend_hours': round(breakdown['total_weekend_hours'], 2),
            'total_regular_hours': round(breakdown['total_regular_hours'], 2),
            'remote_hours': round(breakdown['remote_hours'], 2),
            'office_hours': round(breakdown['office_hours'], 2),
        },
        'leave_info': {
            'day_off_count': breakdown['day_off_count'],
            'approved_leave_count': breakdown['approved_leave_count'],
        },
        'pay_calculation': {
            'regular_hours_pay': round(regular_pay, 2),
            'saturday_hours_pay': round(saturday_pay, 2),
            'sunday_hours_pay': round(sunday_pay, 2),
            'total_estimated_pay': round(total_pay, 2),
        }
    }), 410  # 410 Gone


@app.route("/api/analytics/team-payroll-summary", methods=["GET"])
def get_team_payroll_summary():
    """
    DEPRECATED: Team payroll endpoint removed for privacy.
    Payroll calculations should be done by payroll team with real rates.
    """
    return jsonify({
        "error": "Payroll endpoint deprecated",
        "message": "Use /api/analytics/team-summary for shift metrics instead",
        "note": "Payroll calculations should be handled separately by payroll team"
    }), 410  # 410 Gone


# ==================== INITIALIZATION ====================


@app.route("/api/init", methods=["POST"])
def initialize_database():
    """Initialize database with default pay rules"""
    try:
        db.create_all()

        # Add default pay rules if they don't exist
        if PayRule.query.count() == 0:
            default_rules = [
                PayRule(
                    rule_name="Sunday Premium",
                    day_of_week=6,  # Sunday
                    multiplier=1.75,
                    description="Sunday shifts: +75% pay",
                ),
                PayRule(
                    rule_name="Saturday Premium",
                    day_of_week=5,  # Saturday
                    multiplier=1.5,
                    description="Saturday shifts: +50% pay",
                ),
                PayRule(
                    rule_name="Weekday Regular",
                    day_of_week=None,
                    multiplier=1.0,
                    description="Weekday shifts: regular pay",
                ),
            ]

            for rule in default_rules:
                db.session.add(rule)

            db.session.commit()

        return jsonify({"message": "Database initialized successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200


# ==================== API ENDPOINTS - STANDBY ====================


@app.route("/api/standby", methods=["GET"])
def get_standby_weeks():
    """Get all standby week assignments"""
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    analyst_id = request.args.get("analyst_id")
    
    query = StandbyWeek.query
    
    if analyst_id:
        query = query.filter_by(analyst_id=analyst_id)
    
    # Filter for weeks that overlap with the date range
    # A week overlaps if: week_start <= end_date AND week_end >= start_date
    if start_date and end_date:
        query = query.filter(
            StandbyWeek.week_start <= end_date,
            StandbyWeek.week_end >= start_date
        )
    elif start_date:
        query = query.filter(StandbyWeek.week_end >= start_date)
    elif end_date:
        query = query.filter(StandbyWeek.week_start <= end_date)
    
    standby_weeks = query.order_by(StandbyWeek.week_start.desc()).all()
    return jsonify([sw.to_dict() for sw in standby_weeks]), 200


@app.route("/api/standby", methods=["POST"])
def create_standby_week():
    """Assign L2 analyst to standby for a week"""
    data = request.json
    
    try:
        # Validate analyst exists and is L2
        analyst = Analyst.query.get_or_404(data["analyst_id"])
        if analyst.analyst_level != "L2":
            return jsonify({"error": "Only L2 analysts can be assigned to standby"}), 400
        
        # Parse dates
        week_start = datetime.strptime(data["week_start"], "%Y-%m-%d").date()
        week_end = datetime.strptime(data["week_end"], "%Y-%m-%d").date()
        
        # Validate week_start is Monday and week_end is Sunday
        if week_start.weekday() != 0:  # 0 = Monday
            return jsonify({"error": "Week must start on Monday"}), 400
        if week_end.weekday() != 6:  # 6 = Sunday
            return jsonify({"error": "Week must end on Sunday"}), 400
        
        # Check for overlapping standby assignments
        overlap = StandbyWeek.query.filter(
            StandbyWeek.analyst_id == data["analyst_id"],
            db.or_(
                db.and_(StandbyWeek.week_start <= week_start, StandbyWeek.week_end >= week_start),
                db.and_(StandbyWeek.week_start <= week_end, StandbyWeek.week_end >= week_end)
            )
        ).first()
        
        if overlap:
            return jsonify({
                "error": f"Analyst already assigned to standby for week {overlap.week_start} - {overlap.week_end}"
            }), 400
        
        standby_week = StandbyWeek(
            analyst_id=data["analyst_id"],
            week_start=week_start,
            week_end=week_end,
            notes=data.get("notes", "")
        )
        
        db.session.add(standby_week)
        db.session.commit()
        
        return jsonify(standby_week.to_dict()), 201
        
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@app.route("/api/standby/<int:standby_id>", methods=["PUT"])
def update_standby_week(standby_id):
    """Update standby week assignment"""
    standby_week = StandbyWeek.query.get_or_404(standby_id)
    data = request.json
    
    try:
        if "analyst_id" in data:
            analyst = Analyst.query.get_or_404(data["analyst_id"])
            if analyst.analyst_level != "L2":
                return jsonify({"error": "Only L2 analysts can be assigned to standby"}), 400
            standby_week.analyst_id = data["analyst_id"]
        
        if "week_start" in data:
            week_start = datetime.strptime(data["week_start"], "%Y-%m-%d").date()
            if week_start.weekday() != 0:
                return jsonify({"error": "Week must start on Monday"}), 400
            standby_week.week_start = week_start
        
        if "week_end" in data:
            week_end = datetime.strptime(data["week_end"], "%Y-%m-%d").date()
            if week_end.weekday() != 6:
                return jsonify({"error": "Week must end on Sunday"}), 400
            standby_week.week_end = week_end
        
        if "notes" in data:
            standby_week.notes = data["notes"]
        
        db.session.commit()
        return jsonify(standby_week.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@app.route("/api/standby/<int:standby_id>", methods=["DELETE"])
def delete_standby_week(standby_id):
    """Delete standby week assignment"""
    standby_week = StandbyWeek.query.get_or_404(standby_id)
    db.session.delete(standby_week)
    db.session.commit()
    return jsonify({"message": "Standby week deleted"}), 200


@app.route("/api/analysts/l2", methods=["GET"])
def get_l2_analysts():
    """Get all L2 analysts"""
    l2_analysts = Analyst.query.filter_by(analyst_level="L2", status="active").all()
    return jsonify([a.to_dict() for a in l2_analysts]), 200


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=False, host="0.0.0.0", port=5000)
