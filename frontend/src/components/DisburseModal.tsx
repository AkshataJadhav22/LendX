import React, { useState } from 'react';
import { paymentApi } from '../lib/api';
import {
  X, Smartphone, Building2, Wallet, ChevronRight,
  CheckCircle2, XCircle, Loader2, Shield, ArrowLeft,
  ExternalLink, FileText, Lock
} from 'lucide-react';
import type { SuccessResult } from './PaymentModal';
import PaymentReceipt from './PaymentReceipt';

interface DisburseModalProps {
  loan: {
    id: string;
    amount: number;
    interest_rate: number;
    tenure_months: number;
    purpose: string;
    status?: string;
  };
  borrowerName: string;
  onSuccess: (result: SuccessResult) => void;
  onClose: () => void;
}

type Method = 'upi' | 'bank_transfer' | 'mock_wallet';
type Stage = 'select' | 'payment_step' | 'processing' | 'success' | 'failed';

const METHODS = [
  { key: 'upi' as Method, label: 'UPI', desc: 'Instant transfer via UPI ID', icon: <Smartphone size={20} /> },
  { key: 'bank_transfer' as Method, label: 'Bank Transfer', desc: 'Direct NEFT/RTGS bank credit', icon: <Building2 size={20} /> },
  { key: 'mock_wallet' as Method, label: 'Mock Wallet', desc: 'Instant from platform balance', icon: <Wallet size={20} /> },
];

const BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
];

export default function DisburseModal({ loan, borrowerName, onSuccess, onClose }: DisburseModalProps) {
  const [method, setMethod] = useState<Method>('upi');
  const [stage, setStage] = useState<Stage>('select');

  // UPI Form State
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');

  // Bank Transfer Form State
  const [selectedBank, setSelectedBank] = useState('State Bank of India');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankErrors, setBankErrors] = useState<{ account?: string; ifsc?: string }>({});

  // Mock Wallet State
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    const saved = localStorage.getItem('lendx_mock_wallet_balance');
    return saved ? parseFloat(saved) : 500000;
  });

  // Transaction Result State
  const [transactionId, setTransactionId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [resolvedMethodLabel, setResolvedMethodLabel] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Confirmation notice in stage 1 ─────────────────────────
  function getConfirmNotice() {
    if (method === 'upi') {
      return `You are about to disburse ₹${loan.amount.toLocaleString('en-IN')} to ${borrowerName} via UPI. This will mark the loan as disbursed and generate the repayment schedule.`;
    }
    if (method === 'bank_transfer') {
      return `You are about to disburse ₹${loan.amount.toLocaleString('en-IN')} to ${borrowerName} via Direct Bank Transfer (NEFT/RTGS). This will mark the loan as disbursed and generate the repayment schedule.`;
    }
    return `You are about to disburse ₹${loan.amount.toLocaleString('en-IN')} to ${borrowerName} via LendX Mock Wallet. Funds will be deducted from your available demo balance.`;
  }

  // ── Method label for display & DB ─────────────────────────
  function getMethodDisplayLabel() {
    if (method === 'upi') return `UPI (${upiId.trim() || 'demo@upi'})`;
    if (method === 'bank_transfer') {
      const masked = accountNumber.length >= 4 ? `•••• ${accountNumber.slice(-4)}` : '•••• 5678';
      return `Bank Transfer (${selectedBank} - AC: ${masked})`;
    }
    return 'Mock Wallet';
  }

  // ── Validation for payment step ────────────────────────────
  function validatePaymentStep(): boolean {
    if (method === 'upi') {
      if (!upiId.trim()) {
        setUpiError('UPI ID is required');
        return false;
      }
      if (!/^[\w.\-]+@[\w]+$/.test(upiId.trim())) {
        setUpiError('Enter a valid UPI ID (e.g. demo@upi)');
        return false;
      }
      setUpiError('');
      return true;
    }

    if (method === 'bank_transfer') {
      const errors: { account?: string; ifsc?: string } = {};
      const cleanAcc = accountNumber.replace(/\s/g, '');
      if (!cleanAcc || cleanAcc.length < 9 || cleanAcc.length > 18) {
        errors.account = 'Enter a valid account number (9–18 digits)';
      }
      const cleanIfsc = ifsc.trim().toUpperCase();
      if (!cleanIfsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
        errors.ifsc = 'Enter a valid 11-character IFSC (e.g. SBIN0001234)';
      }
      setBankErrors(errors);
      return Object.keys(errors).length === 0;
    }

    if (method === 'mock_wallet') {
      if (walletBalance < loan.amount) {
        setErrorMsg('Insufficient Demo Wallet Balance');
        return false;
      }
      return true;
    }

    return true;
  }

  // ── Execute Disbursement ───────────────────────────────────
  async function handleExecutePayment() {
    if (isSubmitting) return; // Prevent double-clicks
    if (!validatePaymentStep()) return;

    setIsSubmitting(true);
    setStage('processing');
    setErrorMsg('');

    const finalMethodLabel = getMethodDisplayLabel();

    try {
      // 1. Simulate network / gateway processing delay (1.5s)
      await new Promise(r => setTimeout(r, 1500));

      // 2. Call the atomic disbursement API on the backend
      const res = await paymentApi.disburse({
        loanId: loan.id,
        paymentMethod: finalMethodLabel,
        paymentDetails: {
          method,
          upiId: method === 'upi' ? upiId.trim() : undefined,
          bank: method === 'bank_transfer' ? selectedBank : undefined,
          ifsc: method === 'bank_transfer' ? ifsc.trim().toUpperCase() : undefined,
        },
      });

      const tid = res.data.transaction_id;
      const pid = res.data.payment?.id || '';
      const nowStr = new Date().toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      setTransactionId(tid);
      setPaymentId(pid);
      setPaymentDate(nowStr);
      setResolvedMethodLabel(finalMethodLabel);

      // Deduct from demo wallet balance if wallet was used
      if (method === 'mock_wallet') {
        const newBalance = Math.max(0, walletBalance - loan.amount);
        setWalletBalance(newBalance);
        localStorage.setItem('lendx_mock_wallet_balance', newBalance.toString());
      }

      setStage('success');
      onSuccess({
        transaction_id: tid,
        payment_method: finalMethodLabel,
        amount: loan.amount,
        timestamp: new Date().toISOString(),
        payment_id: pid,
      });
    } catch (err: any) {
      console.error('Disbursement error:', err);
      setStage('failed');
      setErrorMsg(err?.response?.data?.error || 'Disbursement failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 flex items-center justify-center"
      style={{ background: 'rgba(18,35,21,0.78)', backdropFilter: 'blur(6px)' }}
    >
      <div className="w-full max-w-lg bg-cream-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-slide-up border border-cream-soft">

        {/* ── Top Header (Fixed at top of modal) ── */}
        <div className="bg-forest-black px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-neon-gradient rounded-md flex items-center justify-center">
                <span className="text-forest-black font-black text-xs">L</span>
              </div>
              <span className="text-cream font-bold text-sm">
                {stage === 'payment_step' ? 'LENDX DEMO PAYMENT' : 'LendX Admin'}
              </span>
              <span className="badge text-xs px-2 py-0.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 ml-1 font-mono">
                DEMO
              </span>
            </div>
            <p className="text-cream/50 text-xs mt-0.5">
              {stage === 'payment_step' && method === 'upi' && 'Instant UPI Transfer Gateway'}
              {stage === 'payment_step' && method === 'bank_transfer' && 'NEFT / RTGS Bank Transfer Gateway'}
              {stage === 'payment_step' && method === 'mock_wallet' && 'Platform Wallet Disbursement'}
              {stage !== 'payment_step' && 'Mock Disbursement Gateway · No real money transferred'}
            </p>
          </div>
          {stage !== 'processing' && (
            <button
              onClick={onClose}
              className="text-cream/50 hover:text-cream transition-colors p-1 rounded-lg hover:bg-forest-deep"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* ── Loan Summary Bar (Fixed header under title) ── */}
        <div className="bg-neon-green/5 border-b border-neon-green/20 px-6 py-3 space-y-1 flex-shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-green">Borrower</span>
            <span className="font-bold text-forest-black text-sm">{borrowerName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-green">Loan ID</span>
            <span className="font-mono text-[11px] text-forest-black bg-cream-soft px-2 py-0.5 rounded">
              {loan.id.slice(0, 18)}…
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-green">Approved Amount</span>
            <span className="text-2xl font-black text-neon-green">₹{loan.amount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-green pt-0.5">
            <span>{loan.tenure_months} months · {loan.interest_rate}% p.a.</span>
            <span className="badge-green text-[11px] px-2 py-0.5 font-medium">
              Status: {stage === 'success' ? 'disbursed' : (loan.status || 'approved')}
            </span>
          </div>
        </div>

        {/* ── Scrollable Modal Body ── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">

          {/* ══════════════════════════════════════════════════════
              STAGE 1: METHOD SELECTION (Matches Screenshot)
             ══════════════════════════════════════════════════════ */}
          {stage === 'select' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-bold text-forest-black text-base">Select Disbursement Method</h3>
              
              <div className="space-y-2.5">
                {METHODS.map(m => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMethod(m.key)}
                    className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border-2 text-left transition-all ${
                      method === m.key
                        ? 'border-neon-green bg-neon-green/5 shadow-sm'
                        : 'border-cream-soft hover:border-muted-green/60 bg-cream-white'
                    }`}
                  >
                    <div className={`p-2 rounded-xl flex-shrink-0 ${method === m.key ? 'bg-neon-green text-forest-black' : 'bg-cream-soft text-muted-green'}`}>
                      {m.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-forest-black text-sm">{m.label}</div>
                      <div className="text-xs text-muted-green">{m.desc}</div>
                    </div>
                    {method === m.key && <CheckCircle2 size={18} className="text-neon-green flex-shrink-0 ml-2" />}
                  </button>
                ))}
              </div>

              {/* Confirm Disbursement section */}
              <div className="border-2 border-neon-green/30 rounded-xl p-3.5 bg-neon-green/5 animate-fade-in">
                <div className="flex items-start gap-2.5 text-xs">
                  <Shield size={16} className="text-neon-green mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-forest-black text-xs mb-0.5">Confirm Disbursement</p>
                    <p className="text-muted-green text-xs leading-relaxed">
                      {getConfirmNotice()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons — PROMINENT AND VISIBLE */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1 justify-center py-3 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStage('payment_step')}
                  className="btn-primary flex-[2] justify-center py-3 text-sm font-bold shadow-md hover:shadow-neon flex items-center gap-1.5"
                >
                  Confirm & Continue to Payment <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              STAGE 2: PAYMENT GATEWAY INTERFACE (Method Specific)
             ══════════════════════════════════════════════════════ */}
          {stage === 'payment_step' && (
            <div className="animate-slide-up space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-cream-soft">
                <button
                  type="button"
                  onClick={() => setStage('select')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-green hover:text-forest-black transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Methods
                </button>
                <span className="badge text-xs px-2.5 py-0.5 bg-neon-green/10 text-forest-black border border-neon-green/30 font-medium">
                  {method === 'upi' ? 'UPI Gateway' : method === 'bank_transfer' ? 'NEFT Gateway' : 'Wallet Gateway'}
                </span>
              </div>

              {/* ── UPI Flow ── */}
              {method === 'upi' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-forest-black text-cream p-4 rounded-xl space-y-2">
                    <div className="text-[11px] text-cream/60 font-semibold tracking-wide uppercase">LENDX DEMO PAYMENT</div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-cream/70">Disbursement Amount</span>
                      <span className="text-xl font-black text-neon-green">₹{loan.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs text-cream/70 pt-1 border-t border-cream/10">
                      <span>Borrower: <strong className="text-cream">{borrowerName}</strong></span>
                      <span>Method: <strong className="text-cream">UPI</strong></span>
                    </div>
                  </div>

                  <div>
                    <label className="label">Borrower UPI ID</label>
                    <input
                      value={upiId}
                      onChange={e => { setUpiId(e.target.value); setUpiError(''); }}
                      className="input font-mono text-sm"
                      placeholder="demo@upi"
                      autoFocus
                    />
                    {upiError && <p className="text-red-500 text-xs mt-1 font-medium">{upiError}</p>}
                  </div>

                  {/* Quick suggestions */}
                  <div>
                    <span className="text-xs text-muted-green block mb-1.5">Quick Demo UPI IDs:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'demo@upi',
                        `${borrowerName.toLowerCase().replace(/\s+/g, '')}@oksbi`,
                        'akshata@okaxis'
                      ].map(suggested => (
                        <button
                          key={suggested}
                          type="button"
                          onClick={() => { setUpiId(suggested); setUpiError(''); }}
                          className="text-xs bg-cream-soft hover:bg-neon-green/20 border border-cream-soft px-2.5 py-1 rounded-md text-forest-black font-mono transition-colors"
                        >
                          {suggested}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 flex gap-2 text-xs text-yellow-800">
                    <Shield size={14} className="flex-shrink-0 text-yellow-600 mt-0.5" />
                    <span>Demo payment — no real money will be transferred.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecutePayment}
                    disabled={isSubmitting}
                    className="btn-primary w-full justify-center py-3 text-sm font-bold shadow-md hover:shadow-neon"
                  >
                    Pay ₹{loan.amount.toLocaleString('en-IN')}
                  </button>
                </div>
              )}

              {/* ── Bank Transfer Flow ── */}
              {method === 'bank_transfer' && (
                <div className="space-y-3.5 animate-fade-in">
                  <div className="bg-forest-black text-cream p-4 rounded-xl space-y-2">
                    <div className="text-[11px] text-cream/60 font-semibold tracking-wide uppercase">LENDX DEMO BANK TRANSFER</div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-cream/70">Disbursement Amount</span>
                      <span className="text-xl font-black text-neon-green">₹{loan.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs text-cream/70 pt-1 border-t border-cream/10">
                      <span>Borrower: <strong className="text-cream">{borrowerName}</strong></span>
                      <span>Loan: <strong className="text-cream">{loan.id.slice(0, 8)}…</strong></span>
                    </div>
                  </div>

                  <div>
                    <label className="label">Select Bank</label>
                    <select
                      value={selectedBank}
                      onChange={e => setSelectedBank(e.target.value)}
                      className="input text-sm"
                    >
                      {BANKS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Beneficiary Account Number</label>
                    <input
                      value={accountNumber}
                      onChange={e => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 18);
                        setAccountNumber(clean);
                      }}
                      className="input font-mono tracking-wider text-sm"
                      placeholder="987654321012"
                      maxLength={18}
                    />
                    {bankErrors.account && <p className="text-red-500 text-xs mt-1 font-medium">{bankErrors.account}</p>}
                  </div>

                  <div>
                    <label className="label">IFSC Code</label>
                    <input
                      value={ifsc}
                      onChange={e => setIfsc(e.target.value.toUpperCase().slice(0, 11))}
                      className="input font-mono uppercase text-sm"
                      placeholder="SBIN0001234"
                      maxLength={11}
                    />
                    {bankErrors.ifsc && <p className="text-red-500 text-xs mt-1 font-medium">{bankErrors.ifsc}</p>}
                  </div>

                  <div className="p-3 rounded-xl bg-cream-soft border border-cream flex gap-2 text-xs text-muted-green">
                    <Lock size={14} className="flex-shrink-0 text-neon-green mt-0.5" />
                    <span>Simulated transfer only. Bank account numbers are never stored in plain text.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecutePayment}
                    disabled={isSubmitting}
                    className="btn-primary w-full justify-center py-3 text-sm font-bold shadow-md hover:shadow-neon"
                  >
                    Confirm Bank Transfer
                  </button>
                </div>
              )}

              {/* ── Mock Wallet Flow ── */}
              {method === 'mock_wallet' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="card p-4 space-y-3 bg-forest-black text-cream">
                    <div className="text-[11px] text-cream/60 font-semibold tracking-wide uppercase">LENDX DEMO WALLET</div>
                    <div className="flex items-center justify-between text-xs text-cream/60">
                      <span>Available Demo Balance</span>
                      <span className="badge bg-neon-green/20 text-neon-green border-none text-[10px]">LIVE DEMO</span>
                    </div>
                    <div className="text-2xl font-black text-neon-green">
                      ₹{walletBalance.toLocaleString('en-IN')}
                    </div>

                    <div className="border-t border-cream/10 pt-2.5 flex justify-between text-xs text-cream/80">
                      <span>Disbursement Amount:</span>
                      <span className="font-bold text-cream">- ₹{loan.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs text-cream/80">
                      <span>Remaining Balance:</span>
                      <span className="font-bold text-neon-green">
                        ₹{Math.max(0, walletBalance - loan.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {walletBalance < loan.amount && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                      <XCircle size={16} className="flex-shrink-0" />
                      <span className="font-medium">Insufficient Demo Wallet Balance</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleExecutePayment}
                    disabled={walletBalance < loan.amount || isSubmitting}
                    className="btn-primary w-full justify-center py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-neon"
                  >
                    Pay ₹{loan.amount.toLocaleString('en-IN')} from Wallet
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              STAGE 3: PROCESSING (Realistic Animation)
             ══════════════════════════════════════════════════════ */}
          {stage === 'processing' && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-neon-green/10 flex items-center justify-center mx-auto mb-4">
                <Loader2 size={32} className="text-neon-green animate-spin" />
              </div>
              <h3 className="font-bold text-forest-black text-lg mb-1">
                {method === 'bank_transfer' ? 'Processing Transfer...' : 'Processing Payment...'}
              </h3>
              <p className="text-muted-green text-xs mb-4">
                Transferring ₹{loan.amount.toLocaleString('en-IN')} to {borrowerName}
              </p>
              <div className="space-y-2 max-w-xs mx-auto text-left bg-cream-soft/40 p-3 rounded-xl border border-cream-soft">
                {[
                  'Verifying loan authorization',
                  'Recording transaction in ledger',
                  'Generating repayment schedule',
                  'Updating borrower loan status'
                ].map((stepText, idx) => (
                  <div key={stepText} className="flex items-center gap-2 text-xs text-muted-green">
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse flex-shrink-0"
                      style={{ animationDelay: `${idx * 0.3}s` }}
                    />
                    <span>{stepText}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              STAGE 4: SUCCESS CONFIRMATION (Requirement 8 & 9)
             ══════════════════════════════════════════════════════ */}
          {stage === 'success' && (
            <div className="text-center py-2 animate-slide-up space-y-3">
              <div className="w-14 h-14 rounded-full bg-neon-green/15 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-neon-green" />
              </div>

              <div>
                <h3 className="font-black text-forest-black text-xl">
                  ✓ Disbursement Successful
                </h3>
                <p className="text-2xl font-black text-neon-green mt-0.5">
                  ₹{loan.amount.toLocaleString('en-IN')}
                </p>
                <p className="text-muted-green text-xs mt-1">
                  Disbursed to: <strong className="text-forest-black">{borrowerName}</strong>
                </p>
              </div>

              {/* Transaction details card */}
              <div className="card p-3.5 text-left space-y-2 bg-cream-soft/40 border border-cream-soft">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-green">Loan ID</span>
                  <span className="font-mono text-forest-black font-semibold">{loan.id.slice(0, 18)}…</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-green">Transaction ID</span>
                  <span className="font-mono text-neon-green font-bold">{transactionId}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-green">Payment Method</span>
                  <span className="font-semibold text-forest-black max-w-[60%] truncate text-right">
                    {resolvedMethodLabel}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-green">Status</span>
                  <span className="badge-green text-[10px] py-0.5 px-2">Successful</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-green">Date</span>
                  <span className="font-semibold text-forest-black">{paymentDate}</span>
                </div>
              </div>

              {/* 3 Required Action Buttons (Requirement 8) */}
              <div className="space-y-2 pt-1">
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => window.open(`/loans/${loan.id}`, '_blank')}
                    className="btn-secondary flex-1 justify-center py-2.5 text-xs gap-1.5"
                  >
                    <ExternalLink size={14} /> View Loan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReceipt(true)}
                    className="btn-secondary flex-1 justify-center py-2.5 text-xs gap-1.5 border-neon-green/40 text-forest-black font-bold"
                  >
                    <FileText size={14} className="text-neon-green" /> View Receipt
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary w-full justify-center py-2.5 text-xs font-bold"
                >
                  Back to Dashboard
                </button>
              </div>

              {/* Receipt Modal Overlay */}
              {showReceipt && (
                <PaymentReceipt
                  result={{
                    transaction_id: transactionId,
                    payment_method: resolvedMethodLabel,
                    amount: loan.amount,
                    timestamp: new Date().toISOString(),
                    payment_id: paymentId,
                  }}
                  loanId={loan.id}
                  paymentType="disbursement"
                  borrowerName={borrowerName}
                  onClose={() => setShowReceipt(false)}
                />
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              STAGE 5: FAILED STATE
             ══════════════════════════════════════════════════════ */}
          {stage === 'failed' && (
            <div className="text-center py-6 animate-fade-in space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <XCircle size={36} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-forest-black text-lg">Disbursement Failed</h3>
                <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl mt-2 font-medium">{errorMsg}</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1 justify-center py-2.5 text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => { setStage('payment_step'); setErrorMsg(''); }}
                  className="btn-primary flex-1 justify-center py-2.5 text-xs"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
