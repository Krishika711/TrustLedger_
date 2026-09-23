const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const accessRoutes = require('./routes/access');
const ledgerRoutes = require('./routes/ledger');
const auditRoutes = require('./routes/audit');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/access', accessRoutes);
app.use('/ledger', ledgerRoutes);
app.use('/audit', auditRoutes);

app.get('/', (req, res) => res.send('TrustLedger API is running'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`TrustLedger API running on port ${PORT}`));
