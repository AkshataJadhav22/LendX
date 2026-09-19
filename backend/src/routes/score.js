const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const { computeScore } = require('../services/scoring');

const router = express.Router();

// POST /api/score/calculate
router.post('/calculate', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { score, breakdown, weightedSum } = computeScore(userId);

  const id = uuidv4();
  db.prepare('INSERT INTO credit_scores (id, user_id, score, breakdown) VALUES (?, ?, ?, ?)')
    .run(id, userId, score, JSON.stringify(breakdown));

  res.json({ score, weightedSum, breakdown });
});

// GET /api/score/:userId
router.get('/:userId', authenticateToken, (req, res) => {
  const latest = db.prepare('SELECT * FROM credit_scores WHERE user_id = ? ORDER BY calculated_at DESC LIMIT 1')
    .get(req.params.userId);

  if (!latest) {
    return res.status(404).json({ error: 'No score found. Please calculate first.' });
  }

  res.json({
    score: latest.score,
    breakdown: JSON.parse(latest.breakdown),
    calculated_at: latest.calculated_at,
  });
});

// GET /api/score/:userId/breakdown
router.get('/:userId/breakdown', authenticateToken, (req, res) => {
  const latest = db.prepare('SELECT * FROM credit_scores WHERE user_id = ? ORDER BY calculated_at DESC LIMIT 1')
    .get(req.params.userId);

  if (!latest) {
    return res.status(404).json({ error: 'No score found' });
  }

  res.json({ breakdown: JSON.parse(latest.breakdown), score: latest.score });
});

// GET /api/score/:userId/history
router.get('/:userId/history', authenticateToken, (req, res) => {
  const history = db.prepare('SELECT score, calculated_at FROM credit_scores WHERE user_id = ? ORDER BY calculated_at ASC LIMIT 50')
    .all(req.params.userId);
  res.json({ history });
});

module.exports = router;
