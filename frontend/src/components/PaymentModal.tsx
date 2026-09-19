import React, { useState } from 'react';
import { paymentApi } from '../lib/api';
import {
  X, Smartphone, CreditCard, Building2, ChevronRight,
  CheckCircle2, XCircle, Loader2, Shield, Lock, FileText
} from 'lucide-react';
import PaymentReceipt from './PaymentReceipt';

// ─── Types ───────────────────────────────────────────────────
interface PaymentModalProps {
  loanId: string;
  repaymentId?: string;          // only for borrower repayments
  amount: number;
  paymentType: 'repayment' | 'disbursement';
  label: string;                  // e.g. "EMI #3" or "Loan Disbursement"
  borrowerName?: string;
  onSuccess: (result: SuccessResult) => void;
  onClose: () => void;
}

export interface SuccessResult {
  transaction_id: string;
  payment_method: string;
  amount: number;
  timestamp: string;
  payment_id: string;
}

type Tab = 'upi' | 'card' | 'netbanking';
type Stage = 'select' | 'form' | 'processing' | 'success' | 'failed' | 'cancelled';

const BANKS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank',
];

// ─── Helpers ─────────────────────────────────────────────────
function maskCardNumber(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 16);
  const groups = digits.match(/.{1,4}/g) || [];
  return groups.join(' ');
}

function validateUpi(id: string) {
  return /^[\w.\-]+@[\w]+$/.test(id.trim());
}

function validateCard(num: string) {
  return num.replace(/\s/g, '').length === 16;
}

function validateExpiry(exp: string) {
  const [m, y] = exp.split('/').map(Number);
  if (!m || !y || m < 1 || m > 12) return false;
  const now = new Date();
  const expDate = new Date(2000 + y, m - 1, 1);
  return expDate >= now;
}

// ─── Main Component ───────────────────────────────────────────
export default function PaymentModal({
  loanId, repaymentId, amount, paymentType, label, borrowerName, onSuccess, onClose
}: PaymentModalProps) {
  const [tab, setTab] = useState<Tab>('upi');
  const [stage, setStage] = useState<Stage>('select');
  const [showReceipt, setShowReceipt] = useState(false);

  // UPI state
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');

  // Card state
  const [cardNum, setCardNum] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  // NetBanking state
  const [selectedBank, setSelectedBank] = useState('');

  // Payment result
  const [paymentId, setPaymentId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Derived method label ──────────────────────────────────
  function getMethodLabel() {
    if (tab === 'upi') return `UPI (${upiId})`;
    if (tab === 'card') return `Card (**** **** **** ${cardNum.replace(/\s/g, '').slice(-4)})`;
    if (tab === 'netbanking') return `Net Banking (${selectedBank})`;
    return tab;
  }

  // ── Validate based on active tab ─────────────────────────
  function validateForm() {
    if (tab === 'upi') {
      if (!validateUpi(upiId)) { setUpiError('Enter a valid UPI ID (e.g. name@upi)'); return false; }
      setUpiError('');
      return true;
    }
    if (tab === 'card') {
      const errs: Record<string, string> = {};
      if (!validateCard(cardNum)) errs.num = 'Enter a valid 16-digit card number';
      if (!cardName.trim()) errs.name = 'Enter cardholder name';
      if (!validateExpiry(cardExpiry)) errs.expiry = 'Enter a valid expiry (MM/YY)';
      if (cardCvv.length < 3) errs.cvv = 'Enter a valid CVV';
      setCardErrors(errs);
      return Object.keys(errs).length === 0;
    }
    if (tab === 'netbanking') {
      return !!selectedBank;
    }
    return false;
  }

  // ── Initiate payment ──────────────────────────────────────
  async function handlePay() {
    if (!validateForm()) return;
    setStage('processing');
    setErrorMsg('');

    try {
      // Step 1: Create payment record
      const createRes = await paymentApi.create({
        loan_id: loanId,
        repayment_id: repaymentId,
        payment_type: paymentType,
        amount,
        payment_method: getMethodLabel(),
      });

      const pid = createRes.data.payment_id;
      const tid = createRes.data.transaction_id;
      setPaymentId(pid);
      setTransactionId(tid);

      // Step 2: Simulate processing delay (1.5s)
      await new Promise(r => setTimeout(r, 1500));

      // Step 3: Verify (mock success — deterministic)
      const verifyRes = await paymentApi.verify(pid, 'success');

      if (verifyRes.data.status === 'successful') {
        setStage('success');
        onSuccess({
          transaction_id: tid,
          payment_method: getMethodLabel(),
          amount,
          timestamp: new Date().toISOString(),
          payment_id: pid,
        });
      } else {
        setStage('failed');
        setErrorMsg('Payment verification failed. Please try again.');
      }
    } catch (err: any) {
      setStage('failed');
      setErrorMsg(err?.response?.data?.error || 'Payment failed. Please try again.');
    }
  }

  // ── Cancel ────────────────────────────────────────────────
  async function handleCancel() {
    if (paymentId) {
      try { await paymentApi.verify(paymentId, 'cancel'); } catch (_) {}
    }
    setStage('cancelled');
    setTimeout(onClose, 1200);
  }

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(18,35,21,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md bg-cream-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">

        {/* ── Header ── */}
        <div className="bg-forest-black px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-neon-gradient rounded-md flex items-center justify-center">
                <span className="text-forest-black font-black text-xs">L</span>
              </div>
              <span className="text-cream font-bold text-sm">LendX</span>
              <span className="badge text-xs px-2 py-0.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 ml-1">DEMO</span>
            </div>
            <p className="text-cream/40 text-xs mt-0.5">Mock Payment Gateway · No real money transferred</p>
          </div>
          {stage !== 'processing' && (
            <button onClick={onClose} className="text-cream/50 hover:text-cream transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        {/* ── Amount banner ── */}
        <div className="bg-forest-deep/10 border-b border-cream-soft px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-muted-green">{label}</div>
          <div className="text-xl font-black text-forest-black">₹{amount.toLocaleString('en-IN')}</div>
        </div>

        {/* ── Body ── */}
        <div className="p-6">

          {/* STAGE: select / form */}
          {(stage === 'select' || stage === 'form') && (
            <>
              {/* Payment method tabs */}
              <div className="flex rounded-xl bg-cream-soft p-1 mb-6">
                {([
                  { key: 'upi', label: 'UPI', icon: <Smartphone size={15} /> },
                  { key: 'card', label: 'Card', icon: <CreditCard size={15} /> },
                  { key: 'netbanking', label: 'Net Banking', icon: <Building2 size={15} /> },
                ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (
                  <button
                    key={t.key}
                    onClick={() => { setTab(t.key); setStage('form'); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                      tab === t.key ? 'bg-forest-black text-cream shadow-sm' : 'text-muted-green hover:text-forest-black'
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* UPI form */}
              {tab === 'upi' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="label">UPI ID</label>
                    <input
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      className="input"
                      placeholder="yourname@upi"
                    />
                    {upiError && <p className="text-red-500 text-xs mt-1">{upiError}</p>}
                  </div>
                  <div className="p-3 rounded-xl bg-cream-soft border border-cream flex gap-2 text-xs text-muted-green">
                    <Shield size={14} className="flex-shrink-0 text-neon-green mt-0.5" />
                    UPI IDs are used only for simulation and are not processed by any payment network.
                  </div>
                </div>
              )}

              {/* Card form */}
              {tab === 'card' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="label">Card Number</label>
                    <input
                      value={cardNum}
                      onChange={e => setCardNum(maskCardNumber(e.target.value))}
                      className="input font-mono tracking-widest"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                    {cardErrors.num && <p className="text-red-500 text-xs mt-1">{cardErrors.num}</p>}
                  </div>
                  <div>
                    <label className="label">Cardholder Name</label>
                    <input
                      value={cardName}
                      onChange={e => setCardName(e.target.value.toUpperCase())}
                      className="input uppercase"
                      placeholder="RAHUL SHARMA"
                    />
                    {cardErrors.name && <p className="text-red-500 text-xs mt-1">{cardErrors.name}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Expiry (MM/YY)</label>
                      <input
                        value={cardExpiry}
                        onChange={e => {
                          let v = e.target.value.replace(/\D/g, '');
                          if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                          setCardExpiry(v);
                        }}
                        className="input"
                        placeholder="08/28"
                        maxLength={5}
                      />
                      {cardErrors.expiry && <p className="text-red-500 text-xs mt-1">{cardErrors.expiry}</p>}
                    </div>
                    <div>
                      <label className="label">CVV</label>
                      <input
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="input"
                        placeholder="•••"
                        type="password"
                        maxLength={4}
                      />
                      {cardErrors.cvv && <p className="text-red-500 text-xs mt-1">{cardErrors.cvv}</p>}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-cream-soft border border-cream flex gap-2 text-xs text-muted-green">
                    <Lock size={14} className="flex-shrink-0 text-neon-green mt-0.5" />
                    Card details are used only for UI demonstration. They are immediately discarded and never stored or transmitted.
                  </div>
                </div>
              )}

              {/* Net Banking */}
              {tab === 'netbanking' && (
                <div className="animate-fade-in">
                  <label className="label mb-3">Select Your Bank</label>
                  <div className="grid grid-cols-2 gap-2">
                    {BANKS.map(bank => (
                      <button
                        key={bank}
                        onClick={() => setSelectedBank(bank)}
                        className={`p-3 rounded-xl text-xs font-medium text-left border-2 transition-all ${
                          selectedBank === bank
                            ? 'border-neon-green bg-neon-green/5 text-forest-black'
                            : 'border-cream-soft text-muted-green hover:border-muted-green'
                        }`}
                      >
                        🏦 {bank}
                      </button>
                    ))}
                  </div>
                  {tab === 'netbanking' && !selectedBank && (
                    <p className="text-xs text-muted-green mt-3">Select a bank to continue</p>
                  )}
                </div>
              )}

              {/* Pay button */}
              <div className="mt-6 flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1 justify-center py-3">
                  Cancel
                </button>
                <button
                  onClick={handlePay}
                  disabled={tab === 'netbanking' && !selectedBank}
                  className="btn-primary flex-1 justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pay ₹{amount.toLocaleString('en-IN')} <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* STAGE: processing */}
          {stage === 'processing' && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-neon-green/10 flex items-center justify-center mx-auto mb-5">
                <Loader2 size={32} className="text-neon-green animate-spin" />
              </div>
              <h3 className="font-bold text-forest-black text-lg mb-2">Processing Payment...</h3>
              <p className="text-muted-green text-sm">Please do not close this window.</p>
              <div className="mt-4 space-y-1.5">
                {['Initiating secure channel', 'Verifying payment details', 'Confirming transaction'].map((s, i) => (
                  <div key={s} className="flex items-center gap-2 text-xs text-muted-green justify-center" style={{ animationDelay: `${i * 0.3}s` }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STAGE: success */}
          {stage === 'success' && (
            <div className="text-center py-4 animate-slide-up">
              <div className="w-16 h-16 rounded-full bg-neon-green/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} className="text-neon-green" />
              </div>
              <h3 className="font-black text-forest-black text-xl mb-1">
                {paymentType === 'disbursement' ? 'Loan Disbursed ✓' : 'Payment Successful ✓'}
              </h3>
              <p className="text-muted-green text-sm mb-5">Transaction completed successfully.</p>
              <div className="card p-4 text-left space-y-2.5 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-green">Amount Paid</span>
                  <span className="font-bold text-forest-black">₹{amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-green">Transaction ID</span>
                  <span className="font-mono text-xs text-neon-green font-bold">{transactionId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-green">Payment Method</span>
                  <span className="font-semibold text-forest-black text-xs">{getMethodLabel()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-green">Date</span>
                  <span className="font-semibold text-forest-black text-xs">{new Date().toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-green">Status</span>
                  <span className="badge-green text-xs">Successful</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReceipt(true)}
                  className="btn-secondary flex-1 justify-center py-3 gap-2"
                >
                  <FileText size={16} /> View Receipt
                </button>
                <button
                  onClick={onClose}
                  className="btn-primary flex-1 justify-center py-3"
                >
                  Back to Loan
                </button>
              </div>

              {/* Receipt Modal */}
              {showReceipt && (
                <PaymentReceipt
                  result={{
                    transaction_id: transactionId,
                    payment_method: getMethodLabel(),
                    amount,
                    timestamp: new Date().toISOString(),
                    payment_id: paymentId,
                  }}
                  loanId={loanId}
                  paymentType={paymentType}
                  borrowerName={borrowerName || 'Borrower'}
                  onClose={() => setShowReceipt(false)}
                />
              )}
            </div>
          )}

          {/* STAGE: failed */}
          {stage === 'failed' && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle size={36} className="text-red-500" />
              </div>
              <h3 className="font-bold text-forest-black text-lg mb-2">Payment Failed</h3>
              <p className="text-sm text-muted-green mb-5">{errorMsg}</p>
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1 justify-center">Close</button>
                <button onClick={() => { setStage('form'); setErrorMsg(''); }} className="btn-primary flex-1 justify-center">
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* STAGE: cancelled */}
          {stage === 'cancelled' && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-cream-soft flex items-center justify-center mx-auto mb-4">
                <XCircle size={28} className="text-muted-green" />
              </div>
              <h3 className="font-bold text-forest-black">Payment Cancelled</h3>
              <p className="text-sm text-muted-green mt-1">Closing...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
