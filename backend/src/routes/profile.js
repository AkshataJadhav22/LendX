const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/profile
router.post('/', authenticateToken, (req, res) => {
  const { business_name, business_type, location, monthly_income_est, phone } = req.body;
  const user_id = req.user.id;

  if (!business_name || !business_type || !location || !monthly_income_est) {
    return res.status(400).json({ error: 'business_name, business_type, location, monthly_income_est are required' });
  }

  const existing = db.prepare('SELECT id FROM borrower_profiles WHERE user_id = ?').get(user_id);
  if (existing) {
    // Update instead
    db.prepare(`UPDATE borrower_profiles SET business_name=?, business_type=?, location=?, monthly_income_est=?, phone=? WHERE user_id=?`)
      .run(business_name, business_type, location, monthly_income_est, phone || null, user_id);
    const updated = db.prepare('SELECT * FROM borrower_profiles WHERE user_id = ?').get(user_id);
    return res.json({ profile: updated });
  }

  const id = uuidv4();
  db.prepare('INSERT INTO borrower_profiles (id, user_id, business_name, business_type, location, monthly_income_est, phone) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, user_id, business_name, business_type, location, monthly_income_est, phone || null);

  const profile = db.prepare('SELECT * FROM borrower_profiles WHERE id = ?').get(id);
  res.status(201).json({ profile });
});

// GET /api/profile/:id
router.get('/:id', authenticateToken, (req, res) => {
  const profile = db.prepare('SELECT * FROM borrower_profiles WHERE user_id = ?').get(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json({ profile });
});

// PUT /api/profile/:id
router.put('/:id', authenticateToken, (req, res) => {
  const { business_name, business_type, location, monthly_income_est, phone } = req.body;
  db.prepare(`UPDATE borrower_profiles SET business_name=?, business_type=?, location=?, monthly_income_est=?, phone=? WHERE user_id=?`)
    .run(business_name, business_type, location, monthly_income_est, phone || null, req.params.id);
  const profile = db.prepare('SELECT * FROM borrower_profiles WHERE user_id = ?').get(req.params.id);
  res.json({ profile });
});

module.exports = router;
