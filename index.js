require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

// Store codes in JSON file
const dataFile = path.join(__dirname, 'codes.json');
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}));

function readCodes() {
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}
function saveCodes(codes) {
  fs.writeFileSync(dataFile, JSON.stringify(codes, null, 2));
}

// Public endpoint: verify code
app.post('/verify', (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Code required' });
  const codes = readCodes();
  const entry = codes[code];
  res.json({ valid: !!(entry && entry.active) });
});

// Admin endpoints (require header Authorization: Bearer ADMIN_KEY)
app.use('/admin', (req, res, next) => {
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (token !== process.env.ADMIN_KEY) return res.status(403).json({ error: 'Forbidden' });
  next();
});

app.post('/admin/add', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code required' });
  const codes = readCodes();
  codes[code] = { active: true };
  saveCodes(codes);
  res.json({ ok: true });
});

app.post('/admin/deactivate', (req, res) => {
  const { code } = req.body;
  const codes = readCodes();
  if (!codes[code]) return res.status(404).json({ error: 'Not found' });
  codes[code].active = false;
  saveCodes(codes);
  res.json({ ok: true });
});

app.get('/admin/list', (req, res) => res.json(readCodes()));

app.listen(PORT, () => console.log(`RX Admin API running on port ${PORT}`));
