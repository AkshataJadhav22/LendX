const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper: generate mock UPI transaction data
function generateUpiData() {
  const months = 6;
  const avgMonthly = Math.floor(Math.random() * 40000) + 10000;
  const consistency = Math.random() * 0.4 + 0.6; // 0.6 - 1.0
  return { months, avgMonthly, consistency, txnCount: Math.floor(Math.random() * 80) + 20 };
}

// Helper: generate mock utility bill data
function generateUtilityData() {
  const totalBills = Math.floor(Math.random() * 6) + 6;
  const onTime = Math.floor(totalBills * (Math.random() * 0.3 + 0.7));
  return { totalBills, onTime, onTimeRatio: +(onTime / totalBills).toFixed(2) };
}

// Helper: generate mock GST data
function generateGstData() {
  const filed = Math.random() > 0.3;
  const quarters = Math.floor(Math.random() * 4) + 1;
  return { filed, quartersCompliant: filed ? quarters : 0, consistency: filed ? +(quarters / 4).toFixed(2) : 0 };
}

// POST /api/data/upi
router.post('/upi', authenticateToken, (req, res) => {
  const user_id = req.user.id;
  const data = generateUpiData();
  // Remove old UPI signal
  db.prepare("DELETE FROM alt_data_signals WHERE user_id = ? AND source = 'upi'").run(user_id);
  const id = uuidv4();
  db.prepare('INSERT INTO alt_data_signals (id, user_id, source, aggregated_value, metadata) VALUES (?, ?, ?, ?, ?)')
    .run(id, user_id, 'upi', data.consistency, JSON.stringify(data));
  res.json({ message: 'UPI data connected successfully', data });
});

// POST /api/data/utility
router.post('/utility', authenticateToken, (req, res) => {
  const user_id = req.user.id;
  const data = generateUtilityData();
  db.prepare("DELETE FROM alt_data_signals WHERE user_id = ? AND source = 'utility'").run(user_id);
  const id = uuidv4();
  db.prepare('INSERT INTO alt_data_signals (id, user_id, source, aggregated_value, metadata) VALUES (?, ?, ?, ?, ?)')
    .run(id, user_id, 'utility', data.onTimeRatio, JSON.stringify(data));
  res.json({ message: 'Utility data connected successfully', data });
});

// POST /api/data/gst
router.post('/gst', authenticateToken, (req, res) => {
  const user_id = req.user.id;
  const data = generateGstData();
  db.prepare("DELETE FROM alt_data_signals WHERE user_id = ? AND source = 'gst'").run(user_id);
  const id = uuidv4();
  db.prepare('INSERT INTO alt_data_signals (id, user_id, source, aggregated_value, metadata) VALUES (?, ?, ?, ?, ?)')
    .run(id, user_id, 'gst', data.consistency, JSON.stringify(data));
  res.json({ message: 'GST data connected successfully', data });
});

// POST /api/data/social-vouch
router.post('/social-vouch', authenticateToken, (req, res) => {
  const user_id = req.user.id;
  const vouches = db.prepare("SELECT COUNT(*) as count FROM vouches WHERE vouchee_id = ?").get(user_id);
  const vouchCount = vouches?.count || 0;
  const normalizedVouch = Math.min(vouchCount / 5, 1); // max at 5 vouches
  // Update vouch signal
  db.prepare("DELETE FROM alt_data_signals WHERE user_id = ? AND source = 'vouch'").run(user_id);
  const id = uuidv4();
  db.prepare('INSERT INTO alt_data_signals (id, user_id, source, aggregated_value, metadata) VALUES (?, ?, ?, ?, ?)')
    .run(id, user_id, 'vouch', normalizedVouch, JSON.stringify({ vouchCount }));
  res.json({ message: 'Social vouch data refreshed', data: { vouchCount, normalizedVouch } });
});

// GET /api/data/:userId - get all connected sources
router.get('/:userId', authenticateToken, (req, res) => {
  const signals = db.prepare('SELECT source, aggregated_value, metadata, collected_at FROM alt_data_signals WHERE user_id = ? ORDER BY collected_at DESC')
    .all(req.params.userId);
  const sources = {};
  for (const s of signals) {
    if (!sources[s.source]) {
      sources[s.source] = { ...s, metadata: JSON.parse(s.metadata || '{}') };
    }
  }
  res.json({ sources });
});

module.exports = router;
