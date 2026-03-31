# Vite Migration Checklist (Post-Beta)

This checklist is for migrating the frontend from Create React App (react-scripts) to Vite after beta stabilization.

## Goals

- Remove legacy CRA transitive deprecation noise.
- Speed up local development and production builds.
- Keep runtime behavior and API paths unchanged.

## Preconditions

- Beta release branch is stable.
- No critical production incidents in progress.
- A dedicated migration branch is created.

## Step 1: Create Migration Branch

- Create a branch named vite-migration.
- Freeze non-critical frontend feature work until migration is merged.

## Step 2: Install Vite Tooling

- Add vite and @vitejs/plugin-react.
- Remove react-scripts and CRA-specific dependencies that are no longer needed.

## Step 3: Add Vite Config

- Create vite.config.js.
- Configure dev server port.
- Configure proxy so /api continues to route to backend in development.

## Step 4: Update Scripts in package.json

- Replace start script with vite.
- Replace build script with vite build.
- Add preview script with vite preview.

## Step 5: Handle Environment Variables

- Migrate from process.env.REACT_APP_* to import.meta.env.VITE_* where needed.
- Keep fallback behavior for /api base URL.

## Step 6: Validate Routing Behavior

- Verify BrowserRouter works with production static hosting.
- Ensure unknown routes still resolve to index.html.

## Step 7: Docker Integration

- Update root Dockerfile frontend build stage to run Vite build.
- Confirm output directory (dist) is copied to backend static path.

## Step 8: Regression Test Matrix

- Login/logout and token refresh.
- Setup flow and first-run routing.
- Analyst, shifts, calendar pages.
- Analytics filters and reports.
- User management and password reset flow.

## Step 9: CI Updates

- Update CI frontend job to use new scripts.
- Keep backend and compose validation jobs unchanged.

## Step 10: Rollout Plan

- Deploy to staging.
- Run smoke tests with beta user roles.
- Merge to main only after successful verification.

## Exit Criteria

- Frontend build passes in CI with Vite.
- No functional regressions in core workflows.
- Documented deployment instructions are updated.
