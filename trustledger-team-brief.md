# TrustLedger — Team Brief (SIH26125)

Deadline: tomorrow morning, Sept 24, 2026.

Paste the "Shared context" block below plus your own section into your own Claude to get started. Don't change the schema or endpoint names without telling the whole team — that's the one thing every piece depends on.

---

## Shared context (same for all 6 of you — paste this every time)

We're building **TrustLedger** — a tamper-evident access-control audit log, for SIH 2026 (problem statement SIH26125, BEL identity/access platform).

**The problem:** normal databases let anyone with admin access secretly edit or delete access logs, so there's no way to prove an audit trail wasn't tampered with.

**The idea:** every grant/revoke event gets chained by hash — each event's hash includes the previous event's hash. Edit or delete a row without redoing every hash after it, and recomputing the chain reveals exactly where it broke. **We are NOT deploying a real blockchain** — no Solidity, no Polygon, no wallets, no gas. That's out of scope for a beginner team with about a day. The hash-chain lives in plain PostgreSQL.

**Stack:** React / Next.js (frontend) · Node.js + Express (API) · PostgreSQL (data + ledger).

**Shared data contract — use these exact names, no variations:**

Tables:
- `users(id, name, role)`
- `resources(id, name)`
- `permissions(id, user_id, resource_id, access_type, granted_by, created_at)` — current state, what the admin dashboard reads
- `ledger_events(id, prev_hash, event_hash, actor_id, resource_id, action, created_at)` — the hash-chain

Hash rule: `event_hash = SHA256(prev_hash + actor_id + resource_id + action + created_at)`. The first row's `prev_hash` is `"0".repeat(64)`.

Endpoints (Express, JSON):
- `POST /auth/login` → `{ token, user }`
- `POST /access/grant` `{ actor_id, resource_id }` → writes to `permissions` AND `ledger_events`
- `POST /access/revoke` `{ actor_id, resource_id }` → same
- `GET /access/list` → current rows from `permissions`
- `GET /ledger` → all rows from `ledger_events`
- `GET /audit/verify` → recomputes the chain, returns `{ valid: bool, brokenAt: [ids] }`

**Repo:** parent repo, PR-based. Branch as `feature/<your-role>`, PR into main. Skip waiting on a full review given the timeline — just a 2-minute smoke test before merging.

---

## Your role: Krishika — Ledger + Audit + Integration lead

You own writing to `ledger_events` (the hashing logic) and `GET /audit/verify` (recompute + compare). You're also integration lead — merging PRs, keeping everyone's env vars consistent, and owning the final demo (intentionally corrupt one row, show `/audit/verify` catch it).

**Paste to your Claude:** "I'm building a hash-chain audit log in Node.js for a hackathon. Each row in a `ledger_events` table needs `event_hash = SHA256(prev_hash + actor_id + resource_id + action + created_at)`, chained to the previous row's hash. I need: (1) an insert function that computes and writes a new chained event, (2) a verify function that walks the whole table and recomputes every hash to find exactly where the chain breaks. Use Node's built-in `crypto` module and plain SQL via `pg`. [paste the shared context above too]"

## Your role: Saanvi — Backend API

You own the Express API: `/auth/login`, `/access/grant`, `/access/revoke`, `/access/list`. Grant/revoke should write to `permissions` and call Krishika's ledger-write function.

**Paste to your Claude:** "I'm building an Express.js REST API for a hackathon. I need endpoints for login (keep auth simple, no need for full security), granting/revoking access (writes to a `permissions` table and also needs to trigger a ledger write), and listing current permissions. [paste the shared context + endpoint list above] Please scaffold the Express routes and controller functions."

## Your role: Basant — Database + Access Control

You own the Postgres schema (`users`, `resources`, `permissions`) and the RBAC check — does a given user have access to a given resource.

**Paste to your Claude:** "I need a PostgreSQL schema for `users`, `resources`, and `permissions` tables [paste the table definitions above], plus a simple RBAC helper function in Node.js that checks if a user has a given access_type on a resource. Please give me the SQL migration and the check function."

## Your role: Shickey — Frontend: Admin dashboard

You own the React/Next.js UI for login and granting/revoking access, calling Saanvi's API.

**Paste to your Claude:** "I'm building a React/Next.js admin dashboard for a hackathon. I need a login form and a grant/revoke access form that calls a REST API (`POST /access/grant`, `POST /access/revoke`, `GET /access/list`). Keep it simple and functional, not fancy — about a day of time. Please scaffold the components."

## Your role: Tejas — Frontend: Audit dashboard

You own the React/Next.js UI that shows the ledger and calls `GET /audit/verify` to show whether the log is intact or tampered.

**Paste to your Claude:** "I'm building a React/Next.js dashboard that calls `GET /audit/verify` (returns `{ valid: bool, brokenAt: [ids] }`) and `GET /ledger` (list of events), and shows a clear verified/tampered status plus the event list. Please scaffold the components."

## Your role: Hritika — Demo, QA & seed data

You own seed data (fake users/resources/events so the app isn't empty), end-to-end testing once pieces are merged, and the live tamper-demo (manually corrupt one row in `ledger_events`, show `/audit/verify` catch it). You also keep the pitch talking points matched to what's actually built.

**Paste to your Claude:** "I need to write seed data (SQL inserts) for a hackathon demo: a few fake users, resources, and a chain of `ledger_events` [paste the table structure above]. I also want a short test checklist for manually verifying that granting access, revoking it, and then corrupting a row all behave correctly, including the audit check catching the corruption."
