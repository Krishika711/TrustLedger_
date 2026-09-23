// Saanvi: grant/revoke/list. Every grant/revoke also writes a ledger event —
// don't remove that call, it's the whole point of the project.
const express = require('express');
const pool = require('../db/pool');
const { insertLedgerEvent } = require('../utils/hashChain');
const router = express.Router();

router.post('/grant', async (req, res) => {
  const { user_id, resource_id, access_type, granted_by } = req.body;

  if (!user_id || !resource_id || !access_type || !granted_by) {
    return res.status(400).json({
      error: 'user_id, resource_id, access_type, and granted_by are all required',
    });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO permissions (user_id, resource_id, access_type, granted_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, resource_id, access_type, granted_by]
    );
    const event = await insertLedgerEvent(pool, {
      actorId: granted_by,
      resourceId: resource_id,
      action: `grant:${access_type}`,
    });
    res.json({ permission: rows[0], ledgerEvent: event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/revoke', async (req, res) => {
  const { user_id, resource_id, revoked_by } = req.body;

  if (!user_id || !resource_id || !revoked_by) {
    return res.status(400).json({
      error: 'user_id, resource_id, and revoked_by are all required',
    });
  }

  try {
    const { rowCount } = await pool.query(
      'DELETE FROM permissions WHERE user_id = $1 AND resource_id = $2',
      [user_id, resource_id]
    );

    if (rowCount === 0) {
      return res.status(404).json({
        error: 'No matching permission found to revoke',
      });
    }

    const event = await insertLedgerEvent(pool, {
      actorId: revoked_by,
      resourceId: resource_id,
      action: 'revoke',
    });
    res.json({ ledgerEvent: event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/list', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM permissions');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;