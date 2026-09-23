const express = require('express');
const pool = require('../db/pool');
const { verifyChain } = require('../utils/hashChain');
const router = express.Router();

router.get('/verify', async (req, res) => {
  try {
    const result = await verifyChain(pool);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
