import { mock } from './mock';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
export const MOCK_DEFAULT = import.meta.env.VITE_USE_MOCK !== 'false';

const authHeaders = () => {
  let t = import.meta.env.VITE_AUTH_TOKEN;
  try { t = localStorage.getItem('token') || t; } catch { /* storage unavailable */ }
  return t ? { Authorization: `Bearer ${t}` } : {};
};

async function get(path) {
  const r = await fetch(BASE + path, { headers: authHeaders() });
  if (!r.ok) throw new Error(`${path} returned ${r.status}`);
  return r.json();
}

// Accepts a few likely field names so small backend naming differences do not break the UI.
const toList = (d) => (Array.isArray(d) ? d : d?.blocks || d?.entries || d?.ledger || d?.data || []);
const toBlock = (b, i) => ({
  index: b.index ?? b.id ?? i,
  timestamp: b.timestamp ?? b.createdAt ?? b.time,
  actor: b.actor ?? b.admin ?? b.performedBy ?? 'unknown',
  action: String(b.action ?? b.event ?? '').toUpperCase(),
  subject: b.subject ?? b.user ?? b.target ?? 'unknown',
  resource: b.resource ?? b.role ?? b.permission ?? '',
  prevHash: b.prevHash ?? b.previousHash ?? b.prev_hash ?? '',
  hash: b.hash ?? b.currentHash ?? '',
});
const toVerdict = (d) => ({
  valid: d.valid ?? d.verified ?? ['verified', 'valid', 'ok'].includes(d.status),
  brokenAt: d.brokenAt ?? d.tamperedIndex ?? d.invalidIndex ?? null,
});

export function makeClient(useMock) {
  if (useMock) return { ledger: () => mock.ledger(), verify: () => mock.verify() };
  return {
    ledger: async () => toList(await get('/ledger')).map(toBlock),
    verify: async () => toVerdict(await get('/audit/verify')),
  };
}
