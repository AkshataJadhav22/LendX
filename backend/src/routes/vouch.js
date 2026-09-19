const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/vouch - submit a vouch
router.post('/', authenticateToken, (req, res) => {
  const { vouchee_id, note } = req.body;
  const voucher_id = req.user.id;

  if (!vouchee_id) return res.status(400).json({ error: 'vouchee_id is required' });
  if (vouchee_id === voucher_id) return res.status(400).json({ error: 'Cannot vouch for yourself' });

  const voucheeExists = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'borrower'").get(vouchee_id);
  if (!voucheeExists) return res.status(404).json({ error: 'Borrower not found' });

  // Check for duplicate vouch
  const existingVouch = db.prepare('SELECT id FROM vouches WHERE voucher_id = ? AND vouchee_id = ?').get(voucher_id, vouchee_id);
  if (existingVouch) return res.status(409).json({ error: 'You have already vouched for this person' });

  const id = uuidv4();
  db.prepare('INSERT INTO vouches (id, voucher_id, vouchee_id, note, weight) VALUES (?, ?, ?, ?, ?)')
    .run(id, voucher_id, vouchee_id, note || null, 1.0);

  res.status(201).json({ message: 'Vouch submitted successfully', vouchId: id });
});

// GET /api/vouch/:userId - get vouches received by a user
router.get('/:userId', authenticateToken, (req, res) => {
  const vouches = db.prepare(`
    SELECT v.*, u.full_name as voucher_name, u.email as voucher_email
    FROM vouches v
    JOIN users u ON v.voucher_id = u.id
    WHERE v.vouchee_id = ?
    ORDER BY v.created_at DESC
  `).all(req.params.userId);

  res.json({ vouches, count: vouches.length });
});

// GET /api/vouch/given/:userId - vouches given by a user
router.get('/given/:userId', authenticateToken, (req, res) => {
  const vouches = db.prepare(`
    SELECT v.*, u.full_name as vouchee_name, u.email as vouchee_email
    FROM vouches v
    JOIN users u ON v.vouchee_id = u.id
    WHERE v.voucher_id = ?
    ORDER BY v.created_at DESC
  `).all(req.params.userId);

  res.json({ vouches, count: vouches.length });
});

// GET /api/vouch/search/borrowers - search for borrowers to vouch
router.get('/search/borrowers', authenticateToken, (req, res) => {
  const { email } = req.query;
  if (!email || email.length < 3) {
    return res.status(400).json({ error: 'Provide at least 3 characters for search' });
  }

  const borrowers = db.prepare(`
    SELECT u.id, u.full_name, u.email, bp.business_name
    FROM users u
    LEFT JOIN borrower_profiles bp ON bp.user_id = u.id
    WHERE u.role = 'borrower' AND u.email LIKE ? AND u.id != ?
    LIMIT 10
  `).all(`%${email}%`, req.user.id);

  res.json({ borrowers });
});

module.exports = router;
