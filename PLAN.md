IMPLEMENTATION PLAN for BullMQ UI

## Goal

Build a web application that provides a graphical UI and control plane for BullMQ queues and workers. The app will support multiple Redis instances (no Redis auth initially), use tRPC for API, store user auth & config in a database, and provide real-time updates (SSE first, explore tRPC over HTTP/2 later).

## Principles

- Small vertical slices: deliver a minimal, working end-to-end flow early (list queues, view jobs) then iterate.
- Secure by default: require authentication for UI and API; limit operations by role.
- Observable & debuggable: logs, metrics, and simple UI audit trail for actions.
- Config-driven Redis connections: allow users to add/remove Redis instances via the UI.

## Phases & Tasks

Phase 0 — Project Setup (high priority)

- Initialize repository scaffolding (if not present): frontend (React/TanStack Start), backend (Node/Express/HTTP server compatible with tRPC), monorepo or single app convention. (1d)
- Add lint/format/typecheck tooling & CI skeleton and configure scripts in package.json. (0.5d)
- Add README, CONTRIBUTING, and this PLAN.md. (0.25d)

Phase 1 — Core Backend: BullMQ integration & API (high priority)

- Task: Add BullMQ connector service that can manage multiple connections by key (in-memory + persisted config). Provide simple API to list queues, queue counts, job lists, job details. (2d)
  - Acceptance: tRPC endpoint `getQueues(instanceId)` returns list of queues with counts.
- Task: Implement job inspection endpoints: `getJobs`, `getJob(jobId)`, `getJobLogs` (if available). (2d)
  - Acceptance: UI can display job state and payload for a selected queue.
- Task: Control endpoints: `pauseQueue`, `resumeQueue`, `removeJob`, `retryJob`, `cleanJobs` with safety checks. (2d)
  - Acceptance: Protected endpoints require auth and log actions to DB.

Phase 2 — Database & Auth (high priority)

- Task: Add DB schema for users, sessions, and redis-instances (name, host, port, tls flag, meta). Use BetterAuth-compatible schema. (1.5d)
  - Acceptance: migrations run locally and tables created.
  - Obs: When no user is present, the application should allow creating the first admin via UI (similar to grafana and other self-hosted tools).
- Task: Integrate BetterAuth (or chosen auth) to handle login, registration, session management. Implement role support (admin, viewer). (2d)
  - Acceptance: Users can log in; API endpoints respect roles.

Phase 3 — Core Frontend (high priority)

- Task: Implement authentication flows (login/logout, session persistence). (1d)
- Task: Create dashboard: instance selector, queue list for selected instance, queue detail page showing recent jobs and stats. (3d)
  - Acceptance: Dashboard shows queues and counts; clicking queue opens job list and details.
- Task: Implement queue actions in UI (pause/resume/clean) with confirmation modals. (1.5d)

Phase 4 — Real-time & Worker View (medium priority)

- Task: Add SSE-based updates for queue metrics and job events. Backend emits updates per instance and queue. (2d)
  - Acceptance: Dashboard metrics update in <5s without refresh.
- Task: Add worker list and worker controls (if applicable): view worker status, active jobs, kill/stop worker (where supported). (2d)

Phase 5 — Multi-Redis Management & Persistence (medium priority)

- Task: UI to add/remove Redis instances (host/port/name). Persist in DB. (1.5d)
- Task: Backend: persist connections and reconnect strategy; allow per-instance logs and health check. (1.5d)
  - Note: Do NOT implement Redis AUTH now — leave fields in DB but ignore for connection.

Phase 6 — Monitoring, Logging, and Auditing (medium priority)

- Task: Add server-side audit table for user actions (who paused queue, when). Expose audit via API. (1d)
- Task: Add basic metrics endpoint (Prometheus-friendly) for queue counts and errors. (1d)

Phase 7 — Testing, Validation & Hardening (high priority)

- Task: Add unit tests for backend services (BullMQ connector, connection manager) and tRPC endpoints. (2d)
- Task: Add integration tests for key user flows (login, view queues, pause/resume). (2d)
- Task: Run accessibility checks on major pages and fix issues. (1d)

Phase 8 — CI, Release & Docs (medium priority)

- Task: Wire up CI to run: lint, format, typecheck, tests. (0.5d)
- Task: Write user docs for connecting Redis instances, common troubleshooting. (1d)
- Task: Create release checklist and deployment scripts (Dockerfile, deployment notes). (1d)

Nice-to-have / Future (low priority)

- Explore tRPC over HTTP/2 or WebSocket transport for more efficient real-time comms.
- Implement Redis AUTH and TLS support for instance connections.
- Add RBAC/SSO integration (OAuth/OIDC).
- Add job reprocessing patterns UI (bulk retry rules, rate-limited requeue).

Data Model: core tables (suggestion)

- users: id, email, hash, role, created_at
- sessions: id, user_id, token, expires_at
- redis_instances: id, name, host, port, tls_enabled, meta, owner_id, created_at
- audits: id, user_id, action, target_type, target_id, payload, created_at

API surface (high level)

- Auth: `signIn`, `signOut`, `getSession`
- Instances: `listInstances`, `getInstance`, `createInstance`, `deleteInstance`, `healthCheckInstance`
- Queues: `getQueues(instanceId)`, `getQueueStats(instanceId, queueName)`, `pauseQueue`, `resumeQueue`
- Jobs: `getJobs(instanceId, queueName, filter)`, `getJob`, `retryJob`, `removeJob`
- Workers: `getWorkers(instanceId)`, `getWorkerDetails`, `stopWorker` (if supported)
- Realtime: SSE endpoint `/events?instanceId=...` (authenticated)

Security & Operational Notes

- All API endpoints require authentication. Enforce role checks on destructive operations.
- Rate-limit sensitive endpoints (job bulk actions).
- Maintain a short retention policy on job payloads shown in UI (configurable) to avoid storing large blobs.
- Provide clear warnings on destructive actions and require confirmation in UI.

Milestones & Timeline (example)

- M1 (2 weeks): Phase 0 + Phase 1 + Phase 3 minimal (auth, list queues, job view, pause/resume).
- M2 (4 weeks): Phase 2 + Phase 4 + Phase 5 (multi-instance, SSE, workers view).
- M3 (6 weeks): Phase 6 + Phase 7 + Phase 8 (monitoring, tests, CI, docs).

## Work Items Format

For each task create an issue or card containing:

- Title: short action phrase (e.g., "Add BullMQ connection manager")
- Description: why + what + acceptance criteria
- Estimate: timebox in days/hours
- Priority and dependencies

## Next steps (what I did now)

- Added this PLAN.md as project roadmap in repository root.

If you'd like, I can:

1. Create GitHub issues from these tasks (ask and I will push commits that create the issues using the GH CLI), or
2. Start implementing Phase 0/Phase 1 locally and open a PR with the first vertical slice (I will run lint/format/check as requested).
