const express = require('express');
const { db } = require('../db/schema');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/loans - all loan applications
router.get('/loans', authenticateToken, requireAdmin, (req, res) => {
  const loans = db.prepare(`
    SELECT l.*, u.full_name, u.email, bp.business_name, bp.business_type,
           (SELECT score FROM credit_scores WHERE user_id = l.user_id ORDER BY calculated_at DESC LIMIT 1) as latest_score
    FROM loans l
    JOIN users u ON l.user_id = u.id
    LEFT JOIN borrower_profiles bp ON bp.user_id = l.user_id
    ORDER BY l.applied_at DESC
  `).all();
  res.json({ loans });
});

// GET /api/admin/borrowers - all borrowers with scores
router.get('/borrowers', authenticateToken, requireAdmin, (req, res) => {
  const borrowers = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.created_at,
           bp.business_name, bp.business_type, bp.location, bp.monthly_income_est,
           (SELECT score FROM credit_scores WHERE user_id = u.id ORDER BY calculated_at DESC LIMIT 1) as latest_score,
           (SELECT COUNT(*) FROM loans WHERE user_id = u.id) as total_loans,
           (SELECT COUNT(*) FROM vouches WHERE vouchee_id = u.id) as vouch_count
    FROM users u
    LEFT JOIN borrower_profiles bp ON bp.user_id = u.id
    WHERE u.role = 'borrower'
    ORDER BY u.created_at DESC
  `).all();
  res.json({ borrowers });
});

// GET /api/admin/analytics - portfolio-level stats
router.get('/analytics', authenticateToken, requireAdmin, (req, res) => {
  const totalBorrowers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'borrower'").get();
  const totalLoans = db.prepare("SELECT COUNT(*) as count FROM loans").get();
  const totalDisbursed = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM loans WHERE status IN ('disbursed', 'active', 'closed')").get();
  const avgScore = db.prepare(`
    SELECT COALESCE(AVG(s.score), 0) as avg_score FROM credit_scores s
    WHERE s.id IN (SELECT id FROM credit_scores GROUP BY user_id HAVING MAX(calculated_at))
  `).get();

  const loansByStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM loans GROUP BY status
  `).all();

  const defaultRate = db.prepare(`
    SELECT ROUND(100.0 * COUNT(CASE WHEN status = 'missed' THEN 1 END) / MAX(COUNT(*), 1), 1) as rate
    FROM repayments
  `).get();

  const repaymentStats = db.prepare(`
    SELECT
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
      COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
      COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed_count,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
    FROM repayments
  `).get();

  const scoreDistribution = db.prepare(`
    SELECT
      COUNT(CASE WHEN score < 450 THEN 1 END) as poor,
      COUNT(CASE WHEN score >= 450 AND score < 600 THEN 1 END) as fair,
      COUNT(CASE WHEN score >= 600 AND score < 750 THEN 1 END) as good,
      COUNT(CASE WHEN score >= 750 THEN 1 END) as excellent
    FROM credit_scores
    WHERE id IN (SELECT id FROM credit_scores GROUP BY user_id HAVING MAX(calculated_at))
  `).get();

  res.json({
    totalBorrowers: totalBorrowers.count,
    totalLoans: totalLoans.count,
    totalDisbursed: +totalDisbursed.total.toFixed(2),
    avgScore: Math.round(avgScore.avg_score),
    defaultRate: defaultRate?.rate || 0,
    loansByStatus,
    repaymentStats,
    scoreDistribution,
  });
});

module.exports = router;
