# Single-image production build for SOC Shift Manager
# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/public ./public
COPY frontend/src ./src
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./
RUN npm run build

# Stage 2: Python backend runtime
FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    PORT=4443 \
    DATABASE_URL=sqlite:////app/instance/soc_shift_manager.db \
    START_COMMAND="gunicorn --bind 0.0.0.0:4443 --workers 2 --threads 4 --timeout 120 app:app"

WORKDIR /app

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt

COPY backend/app.py ./app.py
COPY backend/init_db.py ./init_db.py
COPY backend/entrypoint.py ./entrypoint.py
COPY --from=frontend-builder /frontend/build ./static

RUN useradd -m -u 10001 appuser \
    && mkdir -p /app/instance \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 4443

ENTRYPOINT ["python", "entrypoint.py"]
