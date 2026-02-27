Bull UI — Simple, friendly dashboard for BullMQ

Bull UI is a lightweight, open-source web dashboard for viewing and managing BullMQ queues, jobs, and workers across one or more Redis instances. This README focuses on how to run and use the application — developer notes are kept compact and separate.

Why use Bull UI

- Inspect queues and jobs quickly — status, payload, attempts, timestamps
- Control jobs and queues — retry, remove, pause/resume (role checks apply)
- Connect multiple Redis/BullMQ instances and switch between them
- Small, focused surface: built for operators who want fast visibility and simple controls

Build and run (example):

```bash
docker build -t bull-ui:latest .
docker run -it --rm -p 3000:3000 \
  -e BETTER_AUTH_SECRET="<your-secret-at-least-32-chars>" \
  -e DATABASE_URL="postgres://user:pass@db:5432/bulldb" \
  bull-ui:latest
```

Notes on Docker env vars

- BETTER_AUTH_SECRET — required for auth; use a strong secret (>= 32 characters)
- BETTER_AUTH_URL — recommended for production. This is the base URL your users will be redirected to during auth flows (e.g. `https://app.example.com`). Set this environment variable to avoid mis-detected callback URLs and OAuth proxy issues.
- DATABASE_URL — optional (Postgres) — when provided the app will persist users, instances, and audits. Format: `postgres://user:pass@host:port/dbname`

Redis configuration

Redis/BullMQ instances are configured inside the app (Instance selector). You cannot provide a single Redis connection via an environment variable — add one or more instances from the dashboard after the server is running.

Minimal environment variables reference

- BETTER_AUTH_SECRET (required for production auth)
- BETTER_AUTH_URL (recommended for production; base URL used for auth callbacks/redirects)
- DATABASE_URL (optional, recommended for persistence)
- PORT (optional, defaults to 3000)

Using the app (user flow)

- Sign in (if auth enabled) or open the dashboard (dev mode may skip auth)
- From the instance selector add a Redis/BullMQ instance (host, port, optional password)
- Select a queue to view jobs, inspect payloads, and use controls (retry, promote, remove)
- Visit the workers page to view worker processes and their status

Security & operations

- Always set `BETTER_AUTH_SECRET` to a secure, high-entropy value in production.
- Run behind TLS (reverse proxy) and restrict access to the dashboard using network controls or auth providers.
