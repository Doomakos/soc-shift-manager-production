# SOC Shift Manager

SOC Shift Manager is a web application for SOC shift operations, analyst scheduling, and Greek labor-law premium pay calculations.

This guide is written for first-time users and beta testers.

## Branches

| Branch    | Purpose                              | Recommended for          |
|-----------|--------------------------------------|--------------------------|
| `stable`  | Lab-tested, confirmed working builds | Beta testers / production |
| `develop` | Latest features, may be experimental | Early adopters / testing  |
| `main`    | Mirrors `develop` (active dev)       | Developers               |

**To use the stable release:**
```bash
git clone https://github.com/Doomakos/soc-shift-manager-production.git
cd soc-shift-manager-production
git checkout stable
docker compose up --build
```

**To try the latest experimental features:**
```bash
git checkout develop
git pull origin develop
docker compose up --build
```

---

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

The app ships with a default first-login account:

- Username: admin
- Password: Admin123!

Important:

- Change the admin password immediately after first login.
- Default credentials are intended only for initial access.

## Initial Data Seeded By Default

- 1 admin user
- 8 pay rules
- 0 demo analysts
- 0 demo shifts

## Prerequisites

- Docker Engine or Docker Desktop
- Docker Compose v2
- Public DNS record for reverse-proxy mode

## Recommended Deployment For User Beta (HTTPS On 443)

1. Clone repository.
2. Set domain and security variables.
3. Start reverse-proxy stack.

Commands:

export DOMAIN=beta.your-domain.com
export ACME_EMAIL=ops@your-domain.com
export CORS_ORIGINS=https://beta.your-domain.com
export SECRET_KEY=replace-with-long-random-secret
export JWT_SECRET_KEY=replace-with-long-random-secret

docker compose -f docker-compose.beta.proxy.yml up --build -d

User access URL:

https://your-domain

First login (default):

- Username: admin
- Password: Admin123!

Then change password inside the app.

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

Optional admin bootstrap overrides (advanced/deployer use):

- ADMIN_USERNAME
- ADMIN_PASSWORD
- ADMIN_EMAIL
- ADMIN_FORCE_RESET

How to set optional admin overrides:

Option A: export in shell before running docker compose

export ADMIN_USERNAME=myadmin
export ADMIN_PASSWORD=MyStrongPassword123!
export ADMIN_EMAIL=ops@your-domain.com

Option B: place the same keys in a `.env` file in the project root

If you do not set these values, the defaults are used and you can change the password after login in the app.

Admin recovery reset (one-time):

export ADMIN_PASSWORD=YourNewTemporaryPassword123!
export ADMIN_FORCE_RESET=true
docker compose -f docker-compose.beta.proxy.yml up -d

After login succeeds, set ADMIN_FORCE_RESET=false and restart normally.

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

Check the credentials that were used when the database was first initialized.

- If ADMIN_USERNAME/ADMIN_PASSWORD were never set, use admin / Admin123!
- If you changed them through environment variables, use those values

### Data reset for fresh beta test

docker compose -f docker-compose.beta.proxy.yml down -v

docker compose -f docker-compose.beta.proxy.yml up --build -d

## Documentation Map

- QUICKSTART.md: concise install steps
- BETA_MILESTONE.md: release scope and checklist
- DEPLOYMENT_STRATEGIES.md: strategy rationale and user impact
- VITE_MIGRATION_CHECKLIST.md: post-beta frontend migration plan
- backend/README.md: backend API notes
- frontend/README.md: frontend notes

## CI

GitHub Actions workflow file:

- .github/workflows/ci.yml

Checks included:

- Backend dependency install and syntax checks
- Frontend install and production build
- Docker compose configuration validation for all deployment modes

## Security Notes

- Never run public beta with default secrets.
- Restrict CORS_ORIGINS to exact allowed domain(s).
- Keep server patched and monitor container logs.
- Add image vulnerability scanning in CI before wider release.

## License

MIT
