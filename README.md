# TrustLedger — Starter Skeleton

Full context and per-person tasks: see trustledger-team-brief.md in this same folder.

## Setup

### Server
cd server
cp .env.example .env    # fill in your DATABASE_URL
npm install
npm run migrate          # creates tables (needs psql on PATH), or run schema.sql manually in your DB client
npm run dev              # http://localhost:4000

### Client
cd client
cp .env.example .env
npm install
npm run dev               # http://localhost:3000

## Who owns what
- server/src/routes/auth.js, access.js  → Saanvi
- server/src/utils/hashChain.js         → Krishika
- server/src/utils/rbac.js              → Basant (also owns schema.sql / permissions table)
- client/pages/admin.js                 → Shickey
- client/pages/audit.js                 → Tejas
- server/src/db/seed.sql + testing      → Hritika

Push this whole skeleton to the parent repo FIRST, before anyone starts pasting
their role into their own Claude — everyone should build on top of this, not
scaffold their own separate project from scratch.
# TrustLedger_
