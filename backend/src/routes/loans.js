const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { computeScore } = require('../services/scoring');

const router = express.Router();

// POST /api/loans/apply
router.post('/apply', authenticateToken, (req, res) => {
  const { amount, tenure_months, purpose } = req.body;
  const user_id = req.user.id;

  if (!amount || !tenure_months || !purpose) {
    return res.status(400).json({ error: 'amount, tenure_months, and purpose are required' });
  }

  // Get latest score to set interest rate
  const latestScore = db.prepare('SELECT score FROM credit_scores WHERE user_id = ? ORDER BY calculated_at DESC LIMIT 1').get(user_id);
  const score = latestScore?.score || 500;

  // Dynamic rate: 8% at 900, 24% at 300
  const interest_rate = +(24 - ((score - 300) / 600) * 16).toFixed(2);

  const id = uuidv4();
  db.prepare('INSERT INTO loans (id, user_id, amount, tenure_months, interest_rate, purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, user_id, amount, tenure_months, interest_rate, purpose, 'pending');

  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(id);
  res.status(201).json({ loan });
});

// GET /api/loans/user/:userId
router.get('/user/:userId', authenticateToken, (req, res) => {
  const loans = db.prepare('SELECT * FROM loans WHERE user_id = ? ORDER BY applied_at DESC').all(req.params.userId);
  res.json({ loans });
});

// GET /api/loans/:id
router.get('/:id', authenticateToken, (req, res) => {
  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  res.json({ loan });
});

// PUT /api/loans/:id/status (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'disbursed', 'active', 'closed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.prepare("UPDATE loans SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .run(status, req.params.id);

  // If approved/disbursed, generate repayment schedule
  if (status === 'disbursed' || status === 'active') {
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
    if (loan) {
      // Check if schedule already exists
      const existingRepayments = db.prepare('SELECT COUNT(*) as count FROM repayments WHERE loan_id = ?').get(loan.id);
      if (existingRepayments.count === 0) {
        const monthlyRate = loan.interest_rate / 100 / 12;
        const emi = +(loan.amount * monthlyRate * Math.pow(1 + monthlyRate, loan.tenure_months) /
          (Math.pow(1 + monthlyRate, loan.tenure_months) - 1)).toFixed(2);

        for (let i = 1; i <= loan.tenure_months; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i);
          db.prepare('INSERT INTO repayments (id, loan_id, amount, due_date, status) VALUES (?, ?, ?, ?, ?)')
            .run(uuidv4(), loan.id, emi, dueDate.toISOString().split('T')[0], 'pending');
        }
      }
    }
  }

  // If loan is rejected/approved, recalculate score
  if (['approved', 'rejected', 'disbursed'].includes(status)) {
    const loan = db.prepare('SELECT user_id FROM loans WHERE id = ?').get(req.params.id);
    if (loan) {
      const { score, breakdown } = computeScore(loan.user_id);
      db.prepare('INSERT INTO credit_scores (id, user_id, score, breakdown) VALUES (?, ?, ?, ?)')
        .run(uuidv4(), loan.user_id, score, JSON.stringify(breakdown));
    }
  }

  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
  res.json({ loan });
});

// ─────────────────────────────────────────────────────────────
// POST /api/loans/:id/disburse
// Dedicated loan disbursement endpoint
// ─────────────────────────────────────────────────────────────
router.post('/:id/disburse', authenticateToken, requireAdmin, (req, res) => {
  const { payment_method = 'Bank Transfer' } = req.body;
  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);

  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  if (loan.status !== 'approved') {
    return res.status(400).json({ error: `Loan must be 'approved' to disburse. Current status: ${loan.status}` });
  }

  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  const transaction_id = `LENDX-TXN-${date}-${rand}`;
  const payment_id = uuidv4();

  // Create payment record
  db.prepare(`
    INSERT INTO payments (id, loan_id, user_id, payment_type, amount, payment_method, transaction_id, status)
    VALUES (?, ?, ?, 'disbursement', ?, ?, ?, 'successful')
  `).run(payment_id, loan.id, req.user.id, loan.amount, payment_method, transaction_id);

  // Update loan status to disbursed
  db.prepare("UPDATE loans SET status = 'disbursed', updated_at = datetime('now') WHERE id = ?")
    .run(loan.id);

  // Generate repayment schedule
  const existingRepayments = db.prepare('SELECT COUNT(*) as count FROM repayments WHERE loan_id = ?').get(loan.id);
  if (existingRepayments.count === 0) {
    const monthlyRate = loan.interest_rate / 100 / 12;
    const emi = +(
      (loan.amount * monthlyRate * Math.pow(1 + monthlyRate, loan.tenure_months)) /
      (Math.pow(1 + monthlyRate, loan.tenure_months) - 1)
    ).toFixed(2);

    for (let i = 1; i <= loan.tenure_months; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      db.prepare('INSERT INTO repayments (id, loan_id, amount, due_date, status) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), loan.id, emi, dueDate.toISOString().split('T')[0], 'pending');
    }
  }

  // Recalculate score
  const { score, breakdown } = computeScore(loan.user_id);
  db.prepare('INSERT INTO credit_scores (id, user_id, score, breakdown) VALUES (?, ?, ?, ?)')
    .run(uuidv4(), loan.user_id, score, JSON.stringify(breakdown));

  const updatedLoan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loan.id);
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment_id);

  res.json({
    message: 'Loan disbursed successfully!',
    loan: updatedLoan,
    transaction_id,
    payment,
  });
});

module.exports = router;

