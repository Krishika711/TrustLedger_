// Krishika: this is your module. computeHash/insertLedgerEvent/verifyChain are
// a working starting implementation — extend as needed, but keep the hash
// formula in sync with what's documented in the team brief.
const crypto = require('crypto');

const GENESIS_HASH = '0'.repeat(64);

function computeHash({ prevHash, actorId, resourceId, action, createdAt }) {
  return crypto
    .createHash('sha256')
    .update(`${prevHash}${actorId}${resourceId}${action}${createdAt}`)
    .digest('hex');
}

async function insertLedgerEvent(pool, { actorId, resourceId, action }) {
  const { rows } = await pool.query(
    'SELECT event_hash FROM ledger_events ORDER BY id DESC LIMIT 1'
  );
  const prevHash = rows.length ? rows[0].event_hash : GENESIS_HASH;
  const createdAt = new Date().toISOString();
  const eventHash = computeHash({ prevHash, actorId, resourceId, action, createdAt });

  const insert = await pool.query(
    `INSERT INTO ledger_events (prev_hash, event_hash, actor_id, resource_id, action, created_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [prevHash, eventHash, actorId, resourceId, action, createdAt]
  );
  return insert.rows[0];
}

async function verifyChain(pool) {
  const { rows } = await pool.query('SELECT * FROM ledger_events ORDER BY id ASC');
  let expectedPrev = GENESIS_HASH;
  const brokenAt = [];

  for (const row of rows) {
    const recomputed = computeHash({
      prevHash: expectedPrev,
      actorId: row.actor_id,
      resourceId: row.resource_id,
      action: row.action,
      createdAt: row.created_at,
    });

    if (row.prev_hash !== expectedPrev || row.event_hash !== recomputed) {
      brokenAt.push(row.id);
    }
    expectedPrev = row.event_hash;
  }

  return { valid: brokenAt.length === 0, brokenAt };
}

module.exports = { computeHash, insertLedgerEvent, verifyChain, GENESIS_HASH };
