import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loanApi } from '../lib/api';
import Navbar from '../components/Navbar';
import { ArrowRight, Clock, CheckCircle2, XCircle, AlertCircle, CreditCard } from 'lucide-react';

const STATUS_STEPS = [
  { key: 'pending', label: 'Application Received', desc: 'Your loan application has been submitted.' },
  { key: 'under_review', label: 'Under Review', desc: 'Our team is reviewing your credit profile.' },
  { key: 'approved', label: 'Approved', desc: 'Your loan has been approved!' },
  { key: 'disbursed', label: 'Disbursed', desc: 'Funds have been transferred to your account.' },
  { key: 'active', label: 'Active Loan', desc: 'Your loan is active. Make repayments on time.' },
  { key: 'closed', label: 'Closed', desc: 'Loan fully repaid. Great job!' },
];

function getStatusIndex(status: string) {
  const map: Record<string, number> = {
    pending: 0, under_review: 1, approved: 2, disbursed: 3, active: 4, closed: 5, rejected: -1
  };
  return map[status] ?? 0;
}

function StatusIcon({ status, current }: { status: string; current: boolean }) {
  if (status === 'rejected') return <XCircle size={20} className="text-red-500" />;
  if (current) return <AlertCircle size={20} className="text-neon-green animate-pulse" />;
  return <CheckCircle2 size={20} className="text-neon-green" />;
}

export default function LoanStatus() {
  const { id } = useParams<{ id: string }>();
  const [loan, setLoan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loanApi.get(id).then(res => setLoan(res.data.loan)).finally(() => setIsLoading(false));
      // Poll every 10s for updates
      const interval = setInterval(() => {
        loanApi.get(id).then(res => setLoan(res.data.loan)).catch(() => {});
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [id]);

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

  if (!loan) {
    return (
      <div className="min-h-screen bg-cream-soft">
        <Navbar />
        <div className="pt-24 px-6 text-center py-24">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-black text-forest-black">Loan not found</h2>
        </div>
      </div>
    );
  }

  const currentStepIndex = getStatusIndex(loan.status);
  const isRejected = loan.status === 'rejected';
  const isActive = ['disbursed', 'active'].includes(loan.status);

  return (
    <div className="min-h-screen bg-cream-soft">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link to="/dashboard" className="text-sm text-muted-green hover:text-forest-black transition-colors">← Dashboard</Link>
          </div>

          <h1 className="text-3xl font-black text-forest-black mb-2">Loan Status</h1>
          <p className="text-muted-green mb-8">Track your application from submission to disbursement.</p>

          {/* Loan details card */}
          <div className="card p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-3xl font-black text-forest-black mb-1">₹{loan.amount.toLocaleString('en-IN')}</div>
                <div className="text-muted-green text-sm">{loan.tenure_months} months · {loan.interest_rate}% p.a.</div>
              </div>
              <span className={`badge text-sm px-4 py-2 ${
                isRejected ? 'badge-red' :
                loan.status === 'active' || loan.status === 'closed' ? 'badge-green' :
                loan.status === 'approved' || loan.status === 'disbursed' ? 'badge-sky' :
                'badge-yellow'
              }`}>
                {loan.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-green">Purpose</span>
                <div className="font-semibold text-forest-black mt-1">{loan.purpose}</div>
              </div>
              <div>
                <span className="text-muted-green">Applied on</span>
                <div className="font-semibold text-forest-black mt-1">{new Date(loan.applied_at).toLocaleDateString('en-IN')}</div>
              </div>
              <div>
                <span className="text-muted-green">Monthly EMI</span>
                <div className="font-semibold text-forest-black mt-1">
                  ₹{(() => {
                    const r = loan.interest_rate / 100 / 12;
                    return Math.round(loan.amount * r * Math.pow(1 + r, loan.tenure_months) / (Math.pow(1 + r, loan.tenure_months) - 1)).toLocaleString('en-IN');
                  })()}
                </div>
              </div>
              <div>
                <span className="text-muted-green">Last updated</span>
                <div className="font-semibold text-forest-black mt-1">{new Date(loan.updated_at).toLocaleDateString('en-IN')}</div>
              </div>
            </div>
          </div>

          {/* Status tracker */}
          {isRejected ? (
            <div className="card p-8 text-center border-2 border-red-200">
              <XCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-forest-black mb-2">Application Rejected</h3>
              <p className="text-muted-green mb-6">
                Unfortunately, this application was not approved at this time.
                Improve your credit score and try again.
              </p>
              <Link to="/connect" className="btn-primary">
                Improve My Score <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <div className="card p-8">
              <h3 className="font-bold text-forest-black mb-6">Application Progress</h3>
              <div className="space-y-0">
                {STATUS_STEPS.map((step, i) => {
                  const isDone = i < currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  const isPending = i > currentStepIndex;
                  return (
                    <div key={step.key} className="flex gap-4">
                      {/* Timeline dot & line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isDone ? 'bg-neon-green' : isCurrent ? 'bg-forest-black border-2 border-neon-green' : 'bg-cream-soft'
                        }`}>
                          {isDone ? <CheckCircle2 size={18} className="text-forest-black" /> :
                            isCurrent ? <div className="w-2.5 h-2.5 rounded-full bg-neon-green animate-pulse" /> :
                            <div className="w-2.5 h-2.5 rounded-full bg-muted-green/30" />}
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`w-0.5 h-8 my-1 ${isDone ? 'bg-neon-green' : 'bg-cream-soft'}`} />
                        )}
                      </div>
                      {/* Content */}
                      <div className={`pb-6 ${i === STATUS_STEPS.length - 1 ? 'pb-0' : ''}`}>
                        <div className={`font-semibold ${isCurrent ? 'text-forest-black' : isDone ? 'text-forest-black' : 'text-muted-green'}`}>
                          {step.label}
                          {isCurrent && <span className="ml-2 badge-green text-xs">Current</span>}
                        </div>
                        <div className={`text-sm mt-0.5 ${isCurrent ? 'text-muted-green' : isDone ? 'text-muted-green/70' : 'text-muted-green/40'}`}>
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Repayment CTA */}
          {isActive && (
            <div className="mt-6 card p-6 border-2 border-neon-green/30 bg-neon-green/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={18} className="text-neon-green" />
                    <span className="font-bold text-forest-black">Loan is Active</span>
                  </div>
                  <p className="text-sm text-muted-green">View your repayment schedule and make payments.</p>
                </div>
                <Link to={`/repayment/${loan.id}`} className="btn-primary text-sm py-2.5 px-5 flex-shrink-0">
                  Repayments <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
