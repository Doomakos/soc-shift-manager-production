# Beta Milestone: Single-Image Deployment

Target phase: Beta
Target date: TBD

## Goal
Ship one Docker image that can run the complete application (frontend + backend) on any Docker-compatible server, with baseline hardening and a cleaner public repository.

## Scope
- Single deployable image built from repository root Dockerfile.
- Frontend served by backend from bundled static assets.
- API and UI served from the same origin on port 4443 by default.
- External beta traffic served via reverse proxy on port 443.
- Baseline security hardening for beta.
- Repository hygiene cleanup for public release.

## Deliverables
- [x] Root single-image Docker build at Dockerfile.
- [x] Beta deployment compose file at docker-compose.beta.yml.
- [x] Same-origin frontend API default configuration.
- [x] Backend static asset serving for SPA fallback routing.
- [x] Baseline CORS hardening via CORS_ORIGINS environment variable.
- [x] Non-root container runtime user in the single-image container.
- [x] Production WSGI runtime via gunicorn.
- [x] TLS termination strategy finalized: reverse proxy on 443.
- [x] Reverse-proxy deployment stack at docker-compose.beta.proxy.yml.
- [ ] Secrets management moved from defaults to generated values.
- [ ] Optional image vulnerability scan integrated into CI.
- [ ] Final public-doc set curated for end users.

## Security Baseline For Beta
- Use unique SECRET_KEY and JWT_SECRET_KEY values.
- Use a non-default admin password before first public run.
- Restrict CORS_ORIGINS to known UI URLs.
- Keep persistent DB volume mounted outside container filesystem.
- Keep image updated and rebuild when dependencies are patched.

## Runbook (Beta)
Build and run with reverse proxy (recommended for user testing):

Set required DNS/TLS environment values:

```bash
export DOMAIN=beta.your-domain.com
export ACME_EMAIL=ops@your-domain.com
export CORS_ORIGINS=https://beta.your-domain.com
```

Deploy:

```bash
docker compose -f docker-compose.beta.proxy.yml up --build -d
```

Access UI at:
- https://<your-domain>

Fallback (internal/private test only):

```bash
docker compose -f docker-compose.beta.yml up --build -d
```

Fallback URL:
- http://<server-host>:4443

## Post-Beta Hardening Tasks
- Add rate limiting for authentication endpoints.
- Add security headers and stricter cookie/session policies if cookies are introduced.
- Add structured audit logging and centralized log retention.
- Add CI pipeline checks (SAST, dependency scan, image scan).

## Cleanup Policy
Public repository should include only:
- Source code required to build/run.
- Essential docs (README, quick start, deployment, security notes).
- No editor/OS artifact files or accidental backup files.
