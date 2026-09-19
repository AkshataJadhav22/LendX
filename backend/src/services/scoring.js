/**
 * LendX Credit Scoring Engine
 * Rule-based, explainable weighted scoring
 * Score range: 300–900 (credit-bureau style)
 *
 * Factors:
 *  - Transaction consistency (UPI) : 25%
 *  - Bill payment reliability       : 20%
 *  - Business formalization (GST)   : 15%
 *  - Community trust (Vouches)      : 15%
 *  - Repayment history              : 25%
 */

const { db } = require('../db/schema');

const FACTORS = [
  {
    key: 'transaction_consistency',
    label: 'Transaction Consistency',
    weight: 0.25,
    source: 'upi',
    description: 'Regularity and frequency of UPI/digital payment inflows over the last 6 months',
    icon: '💳',
  },
  {
    key: 'bill_payment_reliability',
    label: 'Bill Payment Reliability',
    weight: 0.20,
    source: 'utility',
    description: 'Ratio of on-time utility bill payments (electricity, water, gas)',
    icon: '⚡',
  },
  {
    key: 'business_formalization',
    label: 'Business Formalization',
    weight: 0.15,
    source: 'gst',
    description: 'GST filing presence and consistency as a measure of business legitimacy',
    icon: '📋',
  },
  {
    key: 'community_trust',
    label: 'Community Trust',
    weight: 0.15,
    source: 'vouch',
    description: 'Peer vouches from verified platform members — a social trust signal',
    icon: '🤝',
  },
  {
    key: 'repayment_history',
    label: 'Repayment History',
    weight: 0.25,
    source: null, // computed from repayments table
    description: 'On-time repayment ratio on prior and active loans',
    icon: '📈',
  },
];

function calculateRepaymentScore(userId) {
  const repayments = db.prepare(`
    SELECT r.status FROM repayments r
    JOIN loans l ON r.loan_id = l.id
    WHERE l.user_id = ?
  `).all(userId);

  if (!repayments || repayments.length === 0) return 0.5; // neutral if no history

  const paid = repayments.filter(r => r.status === 'paid').length;
  const late = repayments.filter(r => r.status === 'late').length;
  const missed = repayments.filter(r => r.status === 'missed').length;
  const total = repayments.length;

  // paid = full credit, late = 0.5 credit, missed = 0
  return ((paid + late * 0.5) / total);
}

function computeScore(userId) {
  // Fetch latest alt-data signals per source
  const signals = db.prepare(`
    SELECT source, aggregated_value, metadata FROM alt_data_signals
    WHERE user_id = ? AND id IN (
      SELECT id FROM alt_data_signals WHERE user_id = ? GROUP BY source HAVING MAX(collected_at)
    )
  `).all(userId, userId);

  const signalMap = {};
  for (const s of signals) {
    signalMap[s.source] = { value: s.aggregated_value, metadata: JSON.parse(s.metadata || '{}') };
  }

  const repaymentScore = calculateRepaymentScore(userId);
  const breakdown = [];
  let weightedSum = 0;

  for (const factor of FACTORS) {
    let rawValue = 0;

    if (factor.source === null) {
      rawValue = repaymentScore;
    } else if (signalMap[factor.source]) {
      rawValue = signalMap[factor.source].value;
    } else {
      rawValue = 0; // data not connected
    }

    // Clamp to [0, 1]
    const normalized = Math.max(0, Math.min(1, rawValue));
    const contribution = normalized * factor.weight;
    weightedSum += contribution;

    breakdown.push({
      key: factor.key,
      label: factor.label,
      icon: factor.icon,
      weight: factor.weight,
      weightPercent: Math.round(factor.weight * 100),
      rawValue: +rawValue.toFixed(3),
      normalized: +normalized.toFixed(3),
      contribution: +contribution.toFixed(4),
      score: Math.round(normalized * 100),
      description: factor.description,
      dataConnected: factor.source === null ? true : !!signalMap[factor.source],
    });
  }

  // Scale to 300–900 range
  const scaledScore = Math.round(300 + weightedSum * 600);

  return { score: scaledScore, weightedSum: +weightedSum.toFixed(4), breakdown };
}

module.exports = { computeScore, FACTORS };
