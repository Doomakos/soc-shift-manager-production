# Deployment Strategies for Beta

This project supports two deployment approaches.

## Strategy A: Direct App Exposure (Port 4443)

Architecture:
- One container runs both backend API and frontend static assets.
- Application listens directly on port 4443.
- No reverse proxy layer in front.

How users are affected:
- Users access one URL and one port.
- Simpler setup and faster rollout for internal beta testing.
- If TLS is not added, users see HTTP only and no browser trust guarantees.
- If the app process restarts, the endpoint is temporarily unavailable.

When to use:
- Internal beta environments.
- Small pilot groups.
- Fast validation before production hardening.

Trade-offs:
- Lower operational complexity.
- Fewer controls for advanced TLS, WAF, and edge rate limiting.
- Less flexible if you later add additional services under the same domain.

## Strategy B: Reverse Proxy Fronting (Port 443)

Architecture:
- Application container runs on an internal port (for example 4443).
- Reverse proxy (Nginx, Traefik, Caddy, cloud load balancer) exposes 443.
- Proxy handles TLS, certificates, headers, and optional rate limiting.

How users are affected:
- Users access standard HTTPS endpoint on 443.
- Better browser trust and fewer security warnings.
- Usually better uptime behavior during rolling updates and restarts.
- Potentially better performance for static asset caching.

When to use:
- External beta users.
- Customer-facing deployments.
- Any environment where TLS and policy controls are required.

Trade-offs:
- More setup and operations overhead.
- Additional component to configure and monitor.

## Recommendation

Selected for current beta:
- Strategy B (Reverse Proxy on 443) is the approved path for user testing.

Fallback usage:
- Strategy A remains available only for internal/private validation.

## Decision Checklist

Choose Strategy A if all are true:
- Users are internal.
- Fast setup matters more than strict edge controls.
- You can tolerate a non-standard port.

Choose Strategy B if any are true:
- Users are external.
- You need HTTPS on 443.
- You need stronger perimeter controls (TLS lifecycle, headers, rate limits, IP policies).
