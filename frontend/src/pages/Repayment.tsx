import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { repaymentApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import PaymentModal, { type SuccessResult } from '../components/PaymentModal';
import PaymentReceipt from '../components/PaymentReceipt';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ArrowLeft, CreditCard } from 'lucide-react';

export default function Repayment() {
  const { loanId } = useParams<{ loanId: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Payment modal state
  const [activeRepayment, setActiveRepayment] = useState<any | null>(null); // the installment being paid
  const [showModal, setShowModal] = useState(false);

  // Receipt state
  const [successResult, setSuccessResult] = useState<SuccessResult | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Success banner (shows after modal closes)
  const [bannerMsg, setBannerMsg] = useState('');

  useEffect(() => {
    fetchSchedule();
  }, [loanId]);

  const fetchSchedule = async () => {
    if (!loanId) return;
    try {
      const res = await repaymentApi.getSchedule(loanId);
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Opens the payment modal for a specific installment
  const openPaymentModal = (repayment: any) => {
    setActiveRepayment(repayment);
    setShowModal(true);
  };

  // Called by PaymentModal on mock-success
  const handlePaymentSuccess = async (result: SuccessResult) => {
    setSuccessResult(result);
    setShowModal(false);
    setActiveRepayment(null);
    setBannerMsg(`✓ Payment of ₹${result.amount.toLocaleString('en-IN')} recorded. TXN: ${result.transaction_id}`);
    setTimeout(() => setBannerMsg(''), 8000);
    await fetchSchedule(); // re-fetch to reflect new status
  };

  // ── Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-soft">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-[80vh]">
          <div className="w-12 h-12 border-4 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-cream-soft">
        <Navbar />
        <div className="pt-24 px-6 text-center py-24">
          <p className="text-muted-green">No repayment schedule found. The loan may not have been disbursed yet.</p>
          <Link to="/dashboard" className="btn-primary mt-4">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const { schedule, loan, totalPaid, totalDue } = data;
  const progress = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

  const statusIcon = (status: string) => {
    if (status === 'paid') return <CheckCircle2 size={18} className="text-neon-green" />;
    if (status === 'late') return <AlertTriangle size={18} className="text-yellow-500" />;
    if (status === 'missed') return <XCircle size={18} className="text-red-500" />;
    return <Clock size={18} className="text-muted-green" />;
  };

  const statusBadge = (status: string) => {
    if (status === 'paid') return 'badge-green';
    if (status === 'late') return 'badge-yellow';
    if (status === 'missed') return 'badge-red';
    return 'badge-sky';
  };

  return (
    <div className="min-h-screen bg-cream-soft">
      <Navbar />

      {/* Payment Modal */}
      {showModal && activeRepayment && loanId && (
        <PaymentModal
          loanId={loanId}
          repaymentId={activeRepayment.id}
          amount={activeRepayment.amount}
          paymentType="repayment"
          borrowerName={user?.full_name || 'Borrower'}
          label={`EMI — Due ${new Date(activeRepayment.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          onSuccess={handlePaymentSuccess}
          onClose={() => { setShowModal(false); setActiveRepayment(null); }}
        />
      )}

      {/* Receipt modal */}
      {showReceipt && successResult && (
        <PaymentReceipt
          result={successResult}
          loanId={loanId || ''}
          paymentType="repayment"
          borrowerName={user?.full_name || 'Borrower'}
          onClose={() => setShowReceipt(false)}
        />
      )}

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <Link to={`/loans/${loanId}`} className="flex items-center gap-2 text-sm text-muted-green hover:text-forest-black transition-colors mb-6">
            <ArrowLeft size={16} /> Back to Loan Status
          </Link>

          <h1 className="text-3xl font-black text-forest-black mb-2">Repayment Schedule</h1>
          <p className="text-muted-green mb-8">
            ₹{loan.amount.toLocaleString('en-IN')} loan · {loan.tenure_months} months · {loan.interest_rate}% p.a.
          </p>

          {/* Success banner */}
          {bannerMsg && (
            <div className="mb-6 p-4 rounded-xl bg-neon-green/10 border border-neon-green/30 text-forest-black font-semibold text-sm animate-fade-in flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-neon-green flex-shrink-0" />
                {bannerMsg}
              </div>
              {successResult && (
                <button
                  onClick={() => setShowReceipt(true)}
                  className="text-xs text-neon-green font-bold hover:underline whitespace-nowrap flex items-center gap-1"
                >
                  <CreditCard size={13} /> View Receipt
                </button>
              )}
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Loan', value: `₹${loan.amount.toLocaleString('en-IN')}`, color: 'text-forest-black' },
              { label: 'Amount Paid', value: `₹${totalPaid.toLocaleString('en-IN')}`, color: 'text-neon-green' },
              { label: 'Remaining', value: `₹${(totalDue - totalPaid).toLocaleString('en-IN')}`, color: 'text-muted-green' },
            ].map(stat => (
              <div key={stat.label} className="card p-5 text-center">
                <div className={`text-2xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-muted-green">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="card p-6 mb-6">
            <div className="flex justify-between text-sm mb-3">
              <span className="font-semibold text-forest-black">Repayment Progress</span>
              <span className="font-bold text-neon-green">{progress.toFixed(1)}%</span>
            </div>
            <div className="progress-bar h-3">
              <div className="progress-fill bg-neon-green" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Schedule table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-cream-soft bg-cream-soft/50 flex items-center justify-between">
              <h3 className="font-bold text-forest-black">Monthly Installments</h3>
              <span className="text-xs text-muted-green bg-yellow-100 border border-yellow-200 px-2 py-1 rounded-full">
                🔒 Demo — No real payment
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cream-soft">
                    <th className="table-header">#</th>
                    <th className="table-header">Due Date</th>
                    <th className="table-header">EMI Amount</th>
                    <th className="table-header">Paid Date</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((repayment: any, i: number) => (
                    <tr key={repayment.id} className="border-b border-cream-soft/50 hover:bg-cream-soft/30 transition-colors">
                      <td className="table-cell font-semibold">{i + 1}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          {statusIcon(repayment.status)}
                          {new Date(repayment.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="table-cell font-semibold">₹{repayment.amount.toLocaleString('en-IN')}</td>
                      <td className="table-cell text-muted-green">
                        {repayment.paid_date
                          ? new Date(repayment.paid_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : '—'}
                      </td>
                      <td className="table-cell">
                        <span className={`badge text-xs ${statusBadge(repayment.status)}`}>
                          {repayment.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        {repayment.status === 'pending' && (
                          <button
                            onClick={() => openPaymentModal(repayment)}
                            className="btn-primary text-xs py-1.5 px-4 gap-1"
                          >
                            <CreditCard size={13} /> Pay Now
                          </button>
                        )}
                        {(repayment.status === 'paid' || repayment.status === 'late') && (
                          <span className="text-xs text-muted-green flex items-center gap-1">
                            <CheckCircle2 size={13} className="text-neon-green" /> Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Note */}
          <div className="card p-4 mt-6 bg-neon-green/5 border border-neon-green/20">
            <p className="text-sm text-muted-green">
              <strong className="text-forest-black">💡 Dynamic Repricing:</strong> Every on-time payment recalculates your credit score.
              A higher score unlocks lower interest rates on future loans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
