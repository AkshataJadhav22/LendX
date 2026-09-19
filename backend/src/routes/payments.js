const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { computeScore } = require('../services/scoring');

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function generateTransactionId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 900000) + 100000;
  return `LENDX-TXN-${date}-${rand}`;
}

// ─────────────────────────────────────────────────────────────
// POST /api/payments/create
// Creates a payment record and executes the mock transaction
// ─────────────────────────────────────────────────────────────
router.post('/create', authenticateToken, (req, res) => {
  const { loan_id, repayment_id, payment_type, amount, payment_method } = req.body;
  const user_id = req.user.id;

  if (!loan_id || !payment_type || !amount || !payment_method) {
    return res.status(400).json({ error: 'loan_id, payment_type, amount, and payment_method are required' });
  }

  if (!['repayment', 'disbursement'].includes(payment_type)) {
    return res.status(400).json({ error: 'payment_type must be repayment or disbursement' });
  }

  // Verify loan exists
  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loan_id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });

  // For repayments — borrower can only pay their own loans
  if (payment_type === 'repayment') {
    if (loan.user_id !== user_id) {
      return res.status(403).json({ error: 'You can only make payments for your own loans' });
    }
    if (repayment_id) {
      const repayment = db.prepare('SELECT * FROM repayments WHERE id = ?').get(repayment_id);
      if (!repayment) return res.status(404).json({ error: 'Repayment installment not found' });
      if (repayment.status !== 'pending') {
        return res.status(400).json({ error: 'This installment has already been paid or is not payable' });
      }
      if (repayment.loan_id !== loan_id) {
        return res.status(400).json({ error: 'Repayment does not belong to this loan' });
      }
    }
  }

  // For disbursements — only admin
  if (payment_type === 'disbursement') {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can disburse loans' });
    }
    if (!['approved'].includes(loan.status)) {
      return res.status(400).json({ error: `Loan must be in 'approved' status to disburse. Current status: ${loan.status}` });
    }
  }

  const transaction_id = generateTransactionId();
  const payment_id = uuidv4();

  // Create payment record (initially pending)
  db.prepare(`
    INSERT INTO payments (id, loan_id, repayment_id, user_id, payment_type, amount, payment_method, transaction_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(payment_id, loan_id, repayment_id || null, user_id, payment_type, amount, payment_method, transaction_id);

  res.status(201).json({ payment_id, transaction_id, message: 'Payment initiated' });
});

// ─────────────────────────────────────────────────────────────
// POST /api/payments/verify
// Simulates the payment gateway callback — marks payment as
// successful and updates loan/repayment tables accordingly
// ─────────────────────────────────────────────────────────────
router.post('/verify', authenticateToken, (req, res) => {
  const { payment_id, action } = req.body; // action: 'success' | 'cancel'

  if (!payment_id) return res.status(400).json({ error: 'payment_id is required' });

  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment_id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  if (payment.status !== 'pending') {
    return res.status(400).json({ error: 'Payment has already been processed' });
  }

  if (action === 'cancel') {
    db.prepare("UPDATE payments SET status = 'cancelled' WHERE id = ?").run(payment_id);
    return res.json({ status: 'cancelled', message: 'Payment cancelled' });
  }

  // ── Simulate SUCCESS ──────────────────────────────────────
  db.prepare("UPDATE payments SET status = 'successful' WHERE id = ?").run(payment_id);

  let scoreRecalculated = false;

  if (payment.payment_type === 'repayment' && payment.repayment_id) {
    // Mark repayment installment paid/late
    const repayment = db.prepare('SELECT * FROM repayments WHERE id = ?').get(payment.repayment_id);
    if (repayment) {
      const today = new Date().toISOString().split('T')[0];
      const isLate = today > repayment.due_date;
      db.prepare("UPDATE repayments SET paid_date = ?, status = ? WHERE id = ?")
        .run(today, isLate ? 'late' : 'paid', payment.repayment_id);

      // Recalculate credit score
      const loan = db.prepare('SELECT user_id FROM loans WHERE id = ?').get(payment.loan_id);
      if (loan) {
        const { score, breakdown } = computeScore(loan.user_id);
        db.prepare('INSERT INTO credit_scores (id, user_id, score, breakdown) VALUES (?, ?, ?, ?)')
          .run(uuidv4(), loan.user_id, score, JSON.stringify(breakdown));
        scoreRecalculated = true;
      }

      // Close loan if all repayments done
      const pending = db.prepare(
        "SELECT COUNT(*) as count FROM repayments WHERE loan_id = ? AND status = 'pending'"
      ).get(payment.loan_id);
      if (pending.count === 0) {
        db.prepare("UPDATE loans SET status = 'closed', updated_at = datetime('now') WHERE id = ?")
          .run(payment.loan_id);
      }
    }
  }

  if (payment.payment_type === 'disbursement') {
    // Move loan from approved → disbursed and generate repayment schedule
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(payment.loan_id);
    if (loan && loan.status === 'approved') {
      db.prepare("UPDATE loans SET status = 'disbursed', updated_at = datetime('now') WHERE id = ?")
        .run(payment.loan_id);

      // Generate repayment schedule (only if not already present)
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

      // Recalculate score after disbursement
      const { score, breakdown } = computeScore(loan.user_id);
      db.prepare('INSERT INTO credit_scores (id, user_id, score, breakdown) VALUES (?, ?, ?, ?)')
        .run(uuidv4(), loan.user_id, score, JSON.stringify(breakdown));
      scoreRecalculated = true;
    }
  }

  const updatedPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment_id);
  res.json({
    status: 'successful',
    transaction_id: payment.transaction_id,
    payment: updatedPayment,
    scoreRecalculated,
    message: payment.payment_type === 'disbursement'
      ? 'Loan disbursed successfully!'
      : 'Repayment recorded successfully!',
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/payments/disburse
// Dedicated transaction-safe loan disbursement endpoint
// ─────────────────────────────────────────────────────────────
router.post('/disburse', authenticateToken, requireAdmin, (req, res) => {
  const targetLoanId = req.body.loanId || req.body.loan_id;
  const targetPaymentMethod = req.body.paymentMethod || req.body.payment_method || 'Bank Transfer';
  const paymentDetails = req.body.paymentDetails || req.body.payment_details || null;

  if (!targetLoanId) {
    return res.status(400).json({ error: 'loanId is required' });
  }

  // 1. Verify loan exists
  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(targetLoanId);
  if (!loan) {
    return res.status(404).json({ error: 'Loan not found' });
  }

  // 2. Prevent duplicate disbursement
  if (loan.status === 'disbursed') {
    return res.status(400).json({ error: 'Loan has already been disbursed. Duplicate disbursement prevented.' });
  }

  // 3. Verify loan status is approved
  if (loan.status !== 'approved') {
    return res.status(400).json({
      error: `Loan must be in 'approved' status to disburse. Current status is '${loan.status}'.`
    });
  }

  const borrower = db.prepare('SELECT id, full_name, email FROM users WHERE id = ?').get(loan.user_id);
  const transaction_id = generateTransactionId();
  const payment_id = uuidv4();

  // 4. Atomic database transaction
  const executeDisburseTx = db.transaction(() => {
    // A. Insert payment record (amount is taken directly from database loan.amount for security)
    db.prepare(`
      INSERT INTO payments (id, loan_id, repayment_id, user_id, payment_type, amount, payment_method, transaction_id, status, notes)
      VALUES (?, ?, NULL, ?, 'disbursement', ?, ?, ?, 'successful', ?)
    `).run(
      payment_id,
      loan.id,
      req.user.id,
      loan.amount,
      targetPaymentMethod,
      transaction_id,
      paymentDetails ? JSON.stringify(paymentDetails) : null
    );

    // B. Update loan status from approved -> disbursed
    db.prepare("UPDATE loans SET status = 'disbursed', updated_at = datetime('now') WHERE id = ?")
      .run(loan.id);

    // C. Generate repayment schedule if none exists
    const existing = db.prepare('SELECT COUNT(*) as count FROM repayments WHERE loan_id = ?').get(loan.id);
    if (existing.count === 0) {
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

    // D. Recalculate credit score after disbursement
    const { score, breakdown } = computeScore(loan.user_id);
    db.prepare('INSERT INTO credit_scores (id, user_id, score, breakdown) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), loan.user_id, score, JSON.stringify(breakdown));
  });

  try {
    executeDisburseTx();
  } catch (err) {
    console.error('Disbursement transaction failed:', err);
    return res.status(500).json({ error: 'Database transaction error during disbursement.' });
  }

  const updatedLoan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loan.id);
  const paymentRecord = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment_id);

  return res.json({
    status: 'successful',
    transaction_id,
    payment: paymentRecord,
    loan: updatedLoan,
    borrowerName: borrower?.full_name || 'Borrower',
    message: 'Loan disbursed successfully!',
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/payments/history
// Returns all payment records with loan & borrower metadata (Admin)
// ─────────────────────────────────────────────────────────────
router.get('/history', authenticateToken, requireAdmin, (req, res) => {
  const transactions = db.prepare(`
    SELECT 
      p.*, 
      l.purpose as loan_purpose,
      l.amount as loan_amount,
      l.tenure_months,
      u.full_name as borrower_name,
      u.email as borrower_email
    FROM payments p
    LEFT JOIN loans l ON p.loan_id = l.id
    LEFT JOIN users u ON l.user_id = u.id
    ORDER BY p.created_at DESC
  `).all();

  res.json({ transactions });
});

// ─────────────────────────────────────────────────────────────
// GET /api/payments/:loanId
// Returns all payment records for a loan
// ─────────────────────────────────────────────────────────────
router.get('/:loanId', authenticateToken, (req, res) => {
  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.loanId);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });

  // Borrowers can only see their own loan payments
  if (req.user.role === 'borrower' && loan.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const payments = db.prepare(
    'SELECT * FROM payments WHERE loan_id = ? ORDER BY created_at DESC'
  ).all(req.params.loanId);

  res.json({ payments });
});

module.exports = router;

