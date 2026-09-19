const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const { computeScore } = require('../services/scoring');

const router = express.Router();

// POST /api/repayments - log a repayment
router.post('/', authenticateToken, (req, res) => {
  const { repayment_id } = req.body;
  if (!repayment_id) return res.status(400).json({ error: 'repayment_id is required' });

  const repayment = db.prepare('SELECT * FROM repayments WHERE id = ?').get(repayment_id);
  if (!repayment) return res.status(404).json({ error: 'Repayment not found' });

  const today = new Date().toISOString().split('T')[0];
  const dueDate = repayment.due_date;
  const isLate = today > dueDate;

  db.prepare("UPDATE repayments SET paid_date = ?, status = ? WHERE id = ?")
    .run(today, isLate ? 'late' : 'paid', repayment_id);

  // Recalculate score after repayment
  const loan = db.prepare('SELECT user_id FROM loans WHERE id = ?').get(repayment.loan_id);
  if (loan) {
    const { score, breakdown } = computeScore(loan.user_id);
    db.prepare('INSERT INTO credit_scores (id, user_id, score, breakdown) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), loan.user_id, score, JSON.stringify(breakdown));
  }

  // Check if all repayments for the loan are done
  const pending = db.prepare("SELECT COUNT(*) as count FROM repayments WHERE loan_id = ? AND status = 'pending'").get(repayment.loan_id);
  if (pending.count === 0) {
    db.prepare("UPDATE loans SET status = 'closed', updated_at = datetime('now') WHERE id = ?").run(repayment.loan_id);
  }

  const updated = db.prepare('SELECT * FROM repayments WHERE id = ?').get(repayment_id);
  res.json({ repayment: updated, message: isLate ? 'Repayment logged (late)' : 'Repayment logged on time!' });
});

// GET /api/repayments/:loanId
router.get('/:loanId', authenticateToken, (req, res) => {
  const repayments = db.prepare('SELECT * FROM repayments WHERE loan_id = ? ORDER BY due_date ASC').all(req.params.loanId);
  res.json({ repayments });
});

// GET /api/repayments/schedule/:loanId
router.get('/schedule/:loanId', authenticateToken, (req, res) => {
  const repayments = db.prepare('SELECT * FROM repayments WHERE loan_id = ? ORDER BY due_date ASC').all(req.params.loanId);
  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.loanId);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });

  const totalPaid = repayments.filter(r => r.status === 'paid' || r.status === 'late').reduce((s, r) => s + r.amount, 0);
  const totalDue = repayments.reduce((s, r) => s + r.amount, 0);

  res.json({ schedule: repayments, loan, totalPaid: +totalPaid.toFixed(2), totalDue: +totalDue.toFixed(2) });
});

module.exports = router;
