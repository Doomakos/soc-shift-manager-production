# Quick Start

This quick start is aligned with the current beta deployment state.

## Recommended Path: Reverse Proxy Beta On 443

1. Clone repository.
2. Set environment variables.
3. Start stack.
4. Login and verify.

Commands:

cd soc-shift-manager-production

export DOMAIN=beta.your-domain.com
export ACME_EMAIL=ops@your-domain.com
export CORS_ORIGINS=https://beta.your-domain.com
export SECRET_KEY=replace-with-long-random-secret
export JWT_SECRET_KEY=replace-with-long-random-secret
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD=replace-with-strong-password
export ADMIN_EMAIL=ops@your-domain.com

docker compose -f docker-compose.beta.proxy.yml up --build -d

Access URL:

https://your-domain

Default login if credentials were not overridden:

- Username: admin
- Password: Admin123!

## Fallback Path: Direct Single-Image Beta On 4443

Use only for internal/private testing.

Command:

docker compose -f docker-compose.beta.yml up --build -d

Access URL:

http://server-host:4443

## Verify Deployment

Check services:

docker compose -f docker-compose.beta.proxy.yml ps

Check logs:

docker compose -f docker-compose.beta.proxy.yml logs -f caddy
docker compose -f docker-compose.beta.proxy.yml logs -f soc-app

## Frequent Issues

If build fails after updates:

docker compose -f docker-compose.beta.proxy.yml build --no-cache
docker compose -f docker-compose.beta.proxy.yml up -d

If login fails:

- Verify ADMIN_USERNAME and ADMIN_PASSWORD values used on first initialization.
- If needed, reset volume and initialize again.

Reset data:

docker compose -f docker-compose.beta.proxy.yml down -v
docker compose -f docker-compose.beta.proxy.yml up --build -d

## Running Two Repositories On Same Host

Use different compose project names:

docker compose -p soca -f docker-compose.beta.yml up -d --build
docker compose -p socb -f docker-compose.beta.yml up -d --build

For reverse-proxy mode, do not run two stacks binding 80 and 443 simultaneously.
