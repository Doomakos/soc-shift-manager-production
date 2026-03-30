# SOC Shift Manager Quick Start

This guide gives you two startup paths.

## Prerequisites

- Docker Engine or Docker Desktop
- Docker Compose v2

## Option 1: Standard Two-Container Mode

```bash
git clone https://github.com/Doomakos/soc-shift-manager-production.git
cd soc-shift-manager-production
docker-compose up --build
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Option 2: Single-Image Beta Mode

```bash
git clone https://github.com/Doomakos/soc-shift-manager-production.git
cd soc-shift-manager-production
docker compose -f docker-compose.beta.yml up --build
```

Access:
- Combined UI and API: http://localhost:4443

## Option 3: Reverse Proxy Beta Mode (Recommended For User Testing)

```bash
git clone https://github.com/Doomakos/soc-shift-manager-production.git
cd soc-shift-manager-production
export DOMAIN=beta.your-domain.com
export ACME_EMAIL=ops@your-domain.com
export CORS_ORIGINS=https://beta.your-domain.com
docker compose -f docker-compose.beta.proxy.yml up --build
```

Access:
- https://<your-domain>

## Default Login

- Username: admin
- Password: Admin123!

Change the admin password after first login.

## Included Sample Data

- 4 sample analysts
- 8 pay rules
- 12 sample shifts

## Common Commands

Start in background:

```bash
docker-compose up -d
docker compose -f docker-compose.beta.yml up -d
```

Stop and keep data:

```bash
docker-compose down
docker compose -f docker-compose.beta.yml down
```

Reset data:

```bash
docker-compose down -v
docker compose -f docker-compose.beta.yml down -v
```

## Troubleshooting

Check running containers:

```bash
docker ps
```

Check logs:

```bash
docker-compose logs -f
docker compose -f docker-compose.beta.yml logs -f
docker compose -f docker-compose.beta.proxy.yml logs -f
```

Port checks:

```bash
lsof -i :3000
lsof -i :5000
lsof -i :4443
lsof -i :443
lsof -i :80
```

## More Information

- Main docs: [README.md](README.md)
- Beta milestone checklist: [BETA_MILESTONE.md](BETA_MILESTONE.md)
- Deployment options and user impact: [DEPLOYMENT_STRATEGIES.md](DEPLOYMENT_STRATEGIES.md)
