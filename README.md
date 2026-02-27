Welcome to Bull UI — a web-based control plane for BullMQ queues and workers.

This repository scaffolds a TanStack Start frontend and a Node backend to manage multiple BullMQ/Redis instances. The project follows a small vertical-slices approach: get a minimal, secure, end-to-end flow working early (list queues, view jobs, basic controls), then iterate toward real-time updates, multi-instance management, and observability.

Key project documents:

- `PLAN.md` - project roadmap and phased implementation plan.
- `CONTRIBUTING.md` - contribution guidelines (if present).

Getting started

- Install dependencies and start the dev server:

```bash
pnpm install
pnpm dev
```

- Build for production:

```bash
pnpm build
```

- Run tests (Vitest):

```bash
pnpm test
```

Scripts and checks

Use the repository scripts during development and for CI checks:

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm test` — run tests
- `pnpm lint` — run Biome linter
- `pnpm format` — format code with Biome
- `pnpm check` — lint + format checks

Environment & auth

- Configure environment variables in `.env.local`. Example keys used by the project:
  - `DATABASE_URL` — Postgres connection for persistence (users, instances, audits)
  - `BETTER_AUTH_SECRET` — secret for BetterAuth sessions

- The app integrates with BetterAuth for authentication (optional). See `README.md` and `src/lib/auth.ts` for example setup and migrations.

Architecture (high level)

- Frontend: React + TanStack Start + TanStack Router + Tailwind CSS + Shadcn UI
- Backend: Node HTTP server with tRPC endpoints (auth, instances, queues, jobs, workers) and BullMQ connector managing multiple Redis instances
- Database: Postgres (via Drizzle ORM suggested) for users, sessions, redis_instances, audits
- Realtime: SSE initially for queue/job events; later consider HTTP/2 or WebSocket transports

Roadmap highlights (see `PLAN.md` for details)

- Phase 0: project setup, tooling, and docs
- Phase 1: BullMQ connector + tRPC endpoints for listing queues and jobs, basic control endpoints (pause/resume, retry, remove)
- Phase 2: Database + BetterAuth-based authentication and roles (admin/viewer)
- Phase 3: Frontend dashboard, instance selector, queue/job views, auth flows (in progress)
- Phase 4: SSE-based realtime updates and worker view
- Phase 5: Persisted multi-Redis management and health checks
- Phase 6: Auditing and Prometheus-friendly metrics

Security & operational notes

- All API endpoints require authentication; destructive operations require proper role checks and confirmation.
- Rate-limit bulk/destructive endpoints and keep a configurable retention policy for displayed job payloads to avoid large blobs in the UI.

Contributing & next steps

- Follow the tasks in `PLAN.md` to create issues or cards for work items. Each task should include title, why/what, acceptance criteria, estimate, and priority.
- Recommended next actions:
  1. Implement Phase 0/Phase 1 vertical slice (getQueues, getJobs, basic UI) — this repo already includes `PLAN.md` and a running frontend scaffold.
  2. Add DB migrations and BetterAuth integration for secured endpoints.

If you'd like, I can create GitHub issues from `PLAN.md` or start implementing the Phase 0/Phase 1 vertical slice and open a PR. I will run `pnpm lint`, `pnpm format`, `pnpm check`, and `pnpm test` as requested when making changes.

Where to look in the codebase

- Frontend routes and components: `src/routes/`
- Styles: `src/styles.css`
- Backend server functions / API: `src/server/` (or `src/routes/api/` depending on structure)
- Auth helpers: `src/lib/auth.ts`

Thanks for starting this project — the PLAN.md contains a clear roadmap; this README emphasizes how to get started and where to focus next.
