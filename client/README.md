# TrustLedger: Audit Dashboard (frontend)

React (Vite) + plain CSS. Shows the hash-chained ledger and whether it verifies.

## Run
    npm install
    cp .env.example .env     # edit if needed
    npm run dev              # http://localhost:5173
    npm run build            # production build in dist/

## Implementation plan (what was built, in order)
1. Contract: only `GET /ledger` and `GET /audit/verify` are used.
2. `src/mock.js`: demo ledger with a real hash chain, so tampering is detected offline.
3. `src/api.js`: fetch layer, optional `Authorization: Bearer <token>`, field-name normalising.
4. `src/App.jsx`: verification scan, chain view, filters, block detail.
5. `src/styles.css`: layout, states, motion (respects reduced-motion).

## API shapes it expects (confirm with the backend owners)
- `GET /ledger` returns an array (or `{blocks|entries|ledger|data: []}`) of
  `{ index, timestamp, actor, action: "GRANT"|"REVOKE", subject, resource, prevHash, hash }`
- `GET /audit/verify` returns `{ valid: boolean, brokenAt?: index }`
  (`verified`/`status: "verified"` and `tamperedIndex` are also accepted)
- The UI also checks locally that each `prevHash` equals the previous block's `hash`.
- Backend must allow CORS from the dev origin.

## Modes
- Demo data (default): includes "Corrupt a record" / "Restore ledger" buttons for the tamper demo.
- Live API: set `VITE_USE_MOCK=false` and `VITE_API_URL`, or use the toggle in the sidebar.
- Auth: token from `VITE_AUTH_TOKEN` or `localStorage.token`; no header is sent if neither exists.
