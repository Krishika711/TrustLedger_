// Demo ledger with a real hash chain, so tampering is actually detected.
const ZERO = '0'.repeat(64);
const digest = (s) => {
  let out = '';
  for (let k = 1; k <= 8; k++) {
    let h = 0x811c9dc5 ^ Math.imul(k, 0x9e3779b1);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    out += (h >>> 0).toString(16).padStart(8, '0');
  }
  return out;
};
const body = (b) => [b.index, b.timestamp, b.actor, b.action, b.subject, b.resource, b.prevHash].join('|');
const SEED = [
  ['admin.meera', 'GRANT', 'arjun.k', 'prod-db:read'],
  ['admin.meera', 'GRANT', 'isha.r', 'billing:approve'],
  ['admin.dev', 'GRANT', 'arjun.k', 'deploy:staging'],
  ['admin.meera', 'REVOKE', 'isha.r', 'billing:approve'],
  ['admin.dev', 'GRANT', 'kabir.s', 'prod-db:write'],
  ['admin.meera', 'GRANT', 'nina.p', 'audit:read'],
  ['admin.dev', 'REVOKE', 'arjun.k', 'prod-db:read'],
  ['admin.meera', 'GRANT', 'isha.r', 'hr-records:read'],
  ['admin.dev', 'GRANT', 'tara.m', 'deploy:prod'],
  ['admin.meera', 'REVOKE', 'kabir.s', 'prod-db:write'],
  ['admin.dev', 'GRANT', 'nina.p', 'secrets:rotate'],
  ['admin.meera', 'REVOKE', 'tara.m', 'deploy:prod'],
];
function build() {
  const out = []; let prev = ZERO; const t0 = Date.parse('2026-09-22T04:30:00Z');
  SEED.forEach(([actor, action, subject, resource], i) => {
    const b = { index: i, timestamp: new Date(t0 + i * 47 * 60000).toISOString(), actor, action, subject, resource, prevHash: prev };
    b.hash = digest(body(b)); out.push(b); prev = b.hash;
  });
  return out;
}
let chain = build();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const mock = {
  async ledger() { await wait(350); return chain.map((b) => ({ ...b })); },
  async verify() {
    await wait(250);
    for (let i = 0; i < chain.length; i++) {
      const b = chain[i];
      if (b.hash !== digest(body(b)) || b.prevHash !== (i ? chain[i - 1].hash : ZERO)) return { valid: false, brokenAt: b.index };
    }
    return { valid: true };
  },
  tamper(ord) { if (chain[ord]) chain[ord].resource = 'root:everything'; },
  reset() { chain = build(); },
};
