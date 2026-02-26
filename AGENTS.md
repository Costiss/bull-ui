# AGENTS.md - Development Guide for Bull UI

This guide provides instructions and conventions for agentic coding agents working on the `bull-ui` repository.

# Guide

After finishing changes, please always run

- `npm run lint`
- `npm run format`
- `npm run check`
- `npm run typecheck`

## 1. Commands

### Build & Dev

- **Dev Server**: `npm run dev` (runs on port 3000)
- **Build**: `npm run build`
- **Preview Build**: `npm run preview`

### Linting & Formatting

This project uses **Biome** for linting, formatting, and import organization.

- **Check (Lint + Format)**: `npm run check`
- **Lint only**: `npm run lint`
- **Format only**: `npm run format`
- **Fix**: Use `npx @biomejs/biome check --write <file>` to apply fixes to a specific file.

### Testing

- **Run all tests**: `npm run test` (uses Vitest)
- **Run a single test**: `npx vitest run <path_to_test_file>`
- **Watch mode**: `npx vitest`

### Database (Drizzle ORM)

- **Generate migrations**: `npm run db:generate`
- **Apply migrations**: `npm run db:migrate`
- **Push schema (dev only)**: `npm run db:push`
- **Studio**: `npm run db:studio`

---

## 2. Code Style & Conventions

### Core Technologies

- **Framework**: Tanstack Start (React 19)
- **Routing**: TanStack Router (File-based routing in `src/routes`)
- **State Management**: TanStack Store, TanStack Query, and tRPC
- **Database**: Drizzle ORM (PostgreSQL)
- **Styling**: Tailwind CSS 4, Lucide React icons
- **Schema Validation**: Zod
- **UI/Component Library**: Shadcn UI
- **User Authentication**: BetterAuth (NextAuth.js alternative)

### General Guidelines

- **Language**: TypeScript (Strict mode). Always use explicit types where inference isn't clear.
- **Components**: Functional components only. Prefer `export default function ComponentName()`.
- **Naming**:
  - Components: `PascalCase` (e.g., `Header.tsx`)
  - Utilities/Hooks: `camelCase` (e.g., `useAuth.ts`, `utils.ts`)
  - Files: Match the primary export.
- **Imports**:
  - Use the `#/*` alias for `src/*` (configured in `package.json` imports).
  - Biome automatically organizes imports.
  - Grouping: External libraries first, then internal aliases (`#/*`), then relative paths.

### Styling

- Use **Tailwind CSS** classes.
- Use the `cn()` utility from `#/*lib/utils` for conditional class merging:
  ```tsx
  import { cn } from "#/lib/utils";
  <div className={cn("base-class", isActive && "active-class")} />;
  ```

### State & Data Fetching

- **Server State**: Use TanStack Query (via tRPC or direct).
- **Client State**: Use TanStack Store for global UI state.
- **Forms/Validation**: Use Zod for schema definitions and runtime validation.

### Error Handling

- Use Zod's `.safeParse()` for validating external data.
- Use tRPC error handling for API calls.
- Wrap complex async operations in try/catch blocks with meaningful error logging.

---

## 3. Project Structure

- `src/components/`: Reusable UI components.
- `src/routes/`: TanStack Router file-based routes.
- `src/db/`: Drizzle schema and client initialization.
- `src/integrations/`: Configuration for tRPC, TanStack Query, etc.
- `src/lib/`: Shared utilities and stores.
- `src/styles.css`: Tailwind CSS entry point.

## 4. Specific Rules (Internal)

- **Imports**: Avoid deep relative nesting (e.g., `../../../../`). Use the `src/` alias.
- **Quotes**: Double quotes for JavaScript/TypeScript strings.
- **Router**: The route tree is generated. Do not manually edit `routeTree.gen.ts`.
