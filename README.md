# SOC Shift Manager

SOC Shift Manager is a web application for SOC shift operations, analyst scheduling, and Greek labor-law premium pay calculations.

This repository is now documented for the current beta state.

## Current Beta Status

- Single image build is available from root Dockerfile.
- Recommended external beta deployment uses reverse proxy on port 443.
- Internal direct beta mode on port 4443 is still available as fallback.
- Two-container development mode is still available.

## What Is Included

- Analyst management
- Shift management
- Standby week management
- Pay rules and premium multipliers
- Team and analyst analytics
- JWT authentication with refresh tokens

## Default Credentials

If you do not override environment variables, first login is:

- Username: admin
- Password: Admin123!

Important:

- Change the admin password immediately after first login.
- For public beta, always set custom ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_EMAIL.

## Sample Data Seeded By Default

- 4 analysts
- 8 pay rules
- 12 shifts

## Prerequisites

- Docker Engine or Docker Desktop
- Docker Compose v2
- Public DNS record for reverse-proxy mode

## Recommended Deployment For User Beta (HTTPS On 443)

1. Clone repository.
2. Set required environment variables.
3. Start reverse-proxy stack.

Commands:

export DOMAIN=beta.your-domain.com
export ACME_EMAIL=ops@your-domain.com
export CORS_ORIGINS=https://beta.your-domain.com
export SECRET_KEY=replace-with-long-random-secret
export JWT_SECRET_KEY=replace-with-long-random-secret
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD=replace-with-strong-password
export ADMIN_EMAIL=ops@your-domain.com

docker compose -f docker-compose.beta.proxy.yml up --build -d

User access URL:

https://your-domain

## Alternative Deployment Modes

### Internal Direct Beta Mode (No Reverse Proxy)

Use only for private testing.

Command:

docker compose -f docker-compose.beta.yml up --build -d

Access URL:

http://server-host:4443

### Two-Container Development Mode

Command:

docker compose -f docker-compose.yml up --build -d

Access URLs:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Run Two Separate Repositories On One Host

Do not use fixed container names.
Use a different compose project name per repo:

docker compose -p soca -f docker-compose.beta.yml up -d --build
docker compose -p socb -f docker-compose.beta.yml up -d --build

Notes:

- Host ports must differ if both stacks expose the same ports.
- Two reverse-proxy stacks cannot both bind host 80 and 443 at the same time.

## Environment Variables Reference

Required for reverse-proxy beta:

- DOMAIN
- ACME_EMAIL
- CORS_ORIGINS
- SECRET_KEY
- JWT_SECRET_KEY
- ADMIN_USERNAME
- ADMIN_PASSWORD
- ADMIN_EMAIL

Optional:

- DATABASE_URL (default is SQLite in /app/instance)
- START_COMMAND (advanced runtime override)

## Common Operations

Start:

docker compose -f docker-compose.beta.proxy.yml up -d --build

Stop:

docker compose -f docker-compose.beta.proxy.yml down

View logs:

docker compose -f docker-compose.beta.proxy.yml logs -f

Rebuild from scratch:

docker compose -f docker-compose.beta.proxy.yml build --no-cache
docker compose -f docker-compose.beta.proxy.yml up -d

## Troubleshooting

### Build error about ENV or parsing

Pull latest main and rebuild without cache.

### Certificate issues on deployment host

Verify DNS points to server and ports 80 and 443 are reachable.

### App is up but login fails

Check that credentials match ADMIN_USERNAME and ADMIN_PASSWORD used at first initialization.

### Data reset for fresh beta test

docker compose -f docker-compose.beta.proxy.yml down -v

docker compose -f docker-compose.beta.proxy.yml up --build -d

## Documentation Map

- QUICKSTART.md: concise install steps
- BETA_MILESTONE.md: release scope and checklist
- DEPLOYMENT_STRATEGIES.md: strategy rationale and user impact
- backend/README.md: backend API notes
- frontend/README.md: frontend notes

## Security Notes

- Never run public beta with default secrets.
- Restrict CORS_ORIGINS to exact allowed domain(s).
- Keep server patched and monitor container logs.
- Add image vulnerability scanning in CI before wider release.

## License

MIT
