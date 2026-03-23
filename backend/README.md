# SOC Shift Manager - Backend

## Setup

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Initialize Database
```bash
# For SQLite (default)
python app.py

# Or initialize with sample data
python init_db.py
```

### Run Development Server
```bash
python app.py
```

Server will be available at `http://localhost:5000`

## API Documentation

### Authentication
Currently, the API has no authentication. For production, consider adding:
- JWT tokens
- API keys
- OAuth2

### Response Format
All responses are JSON:

**Success (2xx)**
```json
{
  "id": 1,
  "employee_id": "SOC001",
  "first_name": "John",
  "last_name": "Smith",
  "email": "john@company.com",
  "base_hourly_rate": 18.50,
  "status": "active",
  "created_at": "2024-01-01T10:00:00"
}
```

**Error (4xx/5xx)**
```json
{
  "error": "Error message describing what went wrong"
}
```

## Key Endpoints

### System
- `POST /api/init` - Initialize database with default pay rules
- `GET /api/health` - Health check

### Analysts CRUD
- `POST /api/analysts` - Create analyst
- `GET /api/analysts` - List all
- `GET /api/analysts/<id>` - Get one
- `PUT /api/analysts/<id>` - Update
- `DELETE /api/analysts/<id>` - Delete

### Shifts CRUD
- `POST /api/shifts` - Create shift
- `GET /api/shifts` - List (supports filters)
- `GET /api/shifts/<id>` - Get one
- `PUT /api/shifts/<id>` - Update
- `DELETE /api/shifts/<id>` - Delete

### Analytics
- `GET /api/analytics/analyst-summary/<id>` - Individual summary
- `GET /api/analytics/team-summary` - Team summary

## Environment Variables

Create a `.env` file:
```
DATABASE_URL=sqlite:///soc_shift_manager.db
FLASK_ENV=development
FLASK_DEBUG=True
```

For PostgreSQL:
```
DATABASE_URL=postgresql://username:password@localhost:5432/soc_shift_manager
```

## Database

### Default Database
SQLite file: `soc_shift_manager.db`

### Models
1. **Analyst** - SOC Level 1 analysts
2. **Shift** - Individual shifts with pay calculations
3. **PayRule** - Premium pay multipliers for different days

## Testing

### Sample Data
Run the initialization script to populate test data:
```bash
python init_db.py
```

This creates:
- 4 sample analysts
- 60 sample shifts
- Default pay rules (Sunday +75%, Saturday +50%)

## Deployment

### Production with Gunicorn
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

## Database Migrations

For managing schema changes, consider adding Alembic:
```bash
pip install Flask-Migrate
```

## Security Notes

For production:
1. Add user authentication
2. Use HTTPS
3. Implement rate limiting
4. Add input validation
5. Use environment variables for secrets
6. Enable CORS only for trusted domains

## Troubleshooting

**Database locked error**
- Close all connections
- Delete `soc_shift_manager.db` and restart

**Port 5000 already in use**
- Change port: `app.run(port=5001)`

**CORS errors**
- Check frontend URL in CORS configuration
- Ensure backend is running before frontend requests
