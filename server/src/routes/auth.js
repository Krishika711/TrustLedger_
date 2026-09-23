// Saanvi: demo-only login, no real password check — matches a user by name.
// Flesh out further only if there's time left after everything else works.
const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { name } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE name = $1', [name]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ token: 'demo-token', user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
