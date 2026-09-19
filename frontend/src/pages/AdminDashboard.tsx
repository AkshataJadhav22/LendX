import React, { useState, useEffect } from 'react';
import { adminApi, loanApi, paymentApi } from '../lib/api';
import Navbar from '../components/Navbar';
import DisburseModal from '../components/DisburseModal';
import PaymentReceipt from '../components/PaymentReceipt';
import type { SuccessResult } from '../components/PaymentModal';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, CreditCard, TrendingUp, AlertTriangle, CheckCircle2, Clock, XCircle, Eye, Banknote, FileText, ArrowUpDown } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B', under_review: '#3B82F6', approved: '#55DD4A',
  rejected: '#EF4444', disbursed: '#73D3EB', active: '#D8FF62', closed: '#566053',
};

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [borrowers, setBorrowers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'loans' | 'transactions' | 'borrowers'>('overview');
  const [updatingLoan, setUpdatingLoan] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Disburse modal
  const [disburseTarget, setDisburseTarget] = useState<any | null>(null);
  const [disburseBanner, setDisburseBanner] = useState('');

  // Receipt modal for history
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<any | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, loansRes, borrowersRes, historyRes] = await Promise.all([
        adminApi.getAnalytics(),
        adminApi.getLoans(),
        adminApi.getBorrowers(),
        paymentApi.getHistory().catch(() => ({ data: { transactions: [] } })),
      ]);
      setAnalytics(analyticsRes.data);
      setLoans(loansRes.data.loans);
      setBorrowers(borrowersRes.data.borrowers);
      setTransactions(historyRes.data?.transactions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLoanStatus = async (loanId: string, status: string) => {
    setUpdatingLoan(loanId);
    try {
      await loanApi.updateStatus(loanId, status);
      await fetchAll();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingLoan(null);
    }
  };

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

  const loansByStatusData = analytics?.loansByStatus?.map((s: any) => ({
    name: s.status.replace('_', ' '),
    count: s.count,
    fill: STATUS_COLORS[s.status] || '#566053',
  })) || [];

  const scoreDistData = analytics?.scoreDistribution ? [
    { name: 'Poor (<450)', value: analytics.scoreDistribution.poor, color: '#EF4444' },
    { name: 'Fair (450-600)', value: analytics.scoreDistribution.fair, color: '#F59E0B' },
    { name: 'Good (600-750)', value: analytics.scoreDistribution.good, color: '#3B82F6' },
    { name: 'Excellent (750+)', value: analytics.scoreDistribution.excellent, color: '#55DD4A' },
  ].filter(d => d.value > 0) : [];

  const filteredLoans = loans.filter(l =>
    l.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-cream-soft">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-content mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-forest-black mb-1">Admin Dashboard</h1>
              <p className="text-muted-green text-sm">Portfolio overview and loan management</p>
            </div>
            <button onClick={fetchAll} className="btn-secondary text-sm">Refresh</button>
          </div>

          {/* Disburse success banner */}
          {disburseBanner && (
            <div className="mb-6 p-4 rounded-xl bg-neon-green/10 border border-neon-green/30 text-forest-black font-semibold text-sm animate-fade-in flex items-center gap-2">
              <CheckCircle2 size={18} className="text-neon-green" />
              {disburseBanner}
            </div>
          )}

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Borrowers', value: analytics?.totalBorrowers || 0, icon: <Users size={20} />, color: 'text-neon-green' },
              { label: 'Total Loans', value: analytics?.totalLoans || 0, icon: <CreditCard size={20} />, color: 'text-sky' },
              { label: 'Avg Credit Score', value: analytics?.avgScore || '—', icon: <TrendingUp size={20} />, color: 'text-lime' },
              { label: 'Default Rate', value: `${analytics?.defaultRate || 0}%`, icon: <AlertTriangle size={20} />, color: 'text-red-400' },
            ].map(kpi => (
              <div key={kpi.label} className="card p-5">
                <div className={`mb-3 ${kpi.color}`}>{kpi.icon}</div>
                <div className={`text-3xl font-black ${kpi.color}`}>{kpi.value}</div>
                <div className="text-sm text-muted-green mt-1">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Total disbursed banner */}
          <div className="card-dark p-6 mb-8 flex items-center justify-between">
            <div>
              <div className="text-cream/60 text-sm mb-1">Total Amount Disbursed</div>
              <div className="text-4xl font-black text-neon-green">₹{(analytics?.totalDisbursed || 0).toLocaleString('en-IN')}</div>
            </div>
            <div className="text-6xl opacity-20">💰</div>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl bg-cream-soft p-1 w-fit mb-8 overflow-x-auto max-w-full">
            {[
              { key: 'overview', label: 'Analytics' },
              { key: 'loans', label: `Loan Applications (${loans.length})` },
              { key: 'transactions', label: `Disbursements & Transactions (${transactions.length})` },
              { key: 'borrowers', label: `Borrowers (${borrowers.length})` },
            ].map(tab => (
              <button
                key={tab.key}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-forest-black text-cream shadow-sm' : 'text-muted-green hover:text-forest-black'}`}
                onClick={() => setActiveTab(tab.key as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
              {/* Loans by status */}
              <div className="card p-6">
                <h3 className="font-bold text-forest-black mb-4">Loans by Status</h3>
                {loansByStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={loansByStatusData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#566053' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#566053' }} />
                      <Tooltip contentStyle={{ background: '#122315', border: 'none', borderRadius: '12px', color: '#F3EDE4' }} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {loansByStatusData.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="text-center py-12 text-muted-green">No loan data yet</div>}
              </div>

              {/* Score distribution */}
              <div className="card p-6">
                <h3 className="font-bold text-forest-black mb-4">Score Distribution</h3>
                {scoreDistData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={scoreDistData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {scoreDistData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#122315', border: 'none', borderRadius: '12px', color: '#F3EDE4' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="text-center py-12 text-muted-green">No score data yet</div>}
              </div>

              {/* Repayment stats */}
              <div className="card p-6 lg:col-span-2">
                <h3 className="font-bold text-forest-black mb-4">Repayment Statistics</h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'On Time', value: analytics?.repaymentStats?.paid_count || 0, icon: <CheckCircle2 size={18} />, color: 'text-neon-green', bg: 'bg-neon-green/10' },
                    { label: 'Late', value: analytics?.repaymentStats?.late_count || 0, icon: <AlertTriangle size={18} />, color: 'text-yellow-500', bg: 'bg-yellow-50' },
                    { label: 'Missed', value: analytics?.repaymentStats?.missed_count || 0, icon: <XCircle size={18} />, color: 'text-red-500', bg: 'bg-red-50' },
                    { label: 'Pending', value: analytics?.repaymentStats?.pending_count || 0, icon: <Clock size={18} />, color: 'text-blue-500', bg: 'bg-blue-50' },
                  ].map(stat => (
                    <div key={stat.label} className={`p-4 rounded-xl ${stat.bg} text-center`}>
                      <div className={`flex justify-center mb-2 ${stat.color}`}>{stat.icon}</div>
                      <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                      <div className="text-sm text-muted-green">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loans tab */}
          {activeTab === 'loans' && (
            <div className="animate-slide-up">
              <div className="mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="input max-w-sm"
                  placeholder="Search by name, email, purpose..."
                />
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-cream-soft bg-cream-soft/50">
                        <th className="table-header">Borrower</th>
                        <th className="table-header">Amount</th>
                        <th className="table-header">Purpose</th>
                        <th className="table-header">Score</th>
                        <th className="table-header">Rate</th>
                        <th className="table-header">Status</th>
                        <th className="table-header">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLoans.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-12 text-muted-green">No loan applications found</td></tr>
                      ) : filteredLoans.map(loan => (
                        <tr key={loan.id} className="border-b border-cream-soft/50 hover:bg-cream-soft/30 transition-colors">
                          <td className="table-cell">
                            <div className="font-semibold text-forest-black">{loan.full_name}</div>
                            <div className="text-xs text-muted-green">{loan.email}</div>
                            {loan.business_name && <div className="text-xs badge-green mt-1">{loan.business_name}</div>}
                          </td>
                          <td className="table-cell">
                            <div className="font-bold">₹{loan.amount.toLocaleString('en-IN')}</div>
                            <div className="text-xs text-muted-green">{loan.tenure_months} months</div>
                          </td>
                          <td className="table-cell text-sm max-w-24 truncate">{loan.purpose}</td>
                          <td className="table-cell">
                            <span className={`font-bold ${!loan.latest_score ? 'text-muted-green' : loan.latest_score >= 700 ? 'text-neon-green' : loan.latest_score >= 550 ? 'text-yellow-600' : 'text-red-500'}`}>
                              {loan.latest_score || '—'}
                            </span>
                          </td>
                          <td className="table-cell font-semibold text-neon-green">{loan.interest_rate}%</td>
                          <td className="table-cell">
                            <span className={`badge text-xs ${
                              loan.status === 'approved' || loan.status === 'active' || loan.status === 'closed' ? 'badge-green' :
                              loan.status === 'rejected' ? 'badge-red' :
                              loan.status === 'disbursed' ? 'badge-sky' : 'badge-yellow'
                            }`}>
                              {loan.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              {loan.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateLoanStatus(loan.id, 'under_review')}
                                    disabled={updatingLoan === loan.id}
                                    className="text-xs btn-secondary py-1.5 px-3"
                                  >
                                    Review
                                  </button>
                                </>
                              )}
                              {loan.status === 'under_review' && (
                                <>
                                  <button
                                    onClick={() => updateLoanStatus(loan.id, 'approved')}
                                    disabled={updatingLoan === loan.id}
                                    className="text-xs btn-primary py-1.5 px-3"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => updateLoanStatus(loan.id, 'rejected')}
                                    disabled={updatingLoan === loan.id}
                                    className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {loan.status === 'approved' && (
                                <button
                                  onClick={() => setDisburseTarget(loan)}
                                  className="text-xs btn-primary py-1.5 px-3 gap-1 flex items-center shadow-sm"
                                >
                                  <Banknote size={13} /> Disburse Loan
                                </button>
                              )}
                              {loan.status === 'disbursed' && (
                                <span className="text-xs flex items-center gap-1 font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-md">
                                  <CheckCircle2 size={12} className="text-sky-600" /> Disbursed
                                </span>
                              )}
                              {updatingLoan === loan.id && (
                                <div className="w-4 h-4 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Transactions / Disbursements history tab */}
          {activeTab === 'transactions' && (
            <div className="card overflow-hidden animate-slide-up">
              <div className="px-6 py-4 border-b border-cream-soft bg-cream-soft/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-forest-black">Disbursements & Payment History</h3>
                  <p className="text-xs text-muted-green">All recorded financial ledger entries for LendX</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neon-green/10 text-forest-black border border-neon-green/30">
                  {transactions.length} Total Recorded
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cream-soft bg-cream-soft/30">
                      <th className="table-header">Transaction ID</th>
                      <th className="table-header">Loan ID</th>
                      <th className="table-header">Borrower</th>
                      <th className="table-header">Amount</th>
                      <th className="table-header">Type</th>
                      <th className="table-header">Payment Method</th>
                      <th className="table-header">Date & Time</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-muted-green">
                          No transactions recorded yet. Approved loans will show here upon disbursement.
                        </td>
                      </tr>
                    ) : transactions.map(tx => (
                      <tr key={tx.id} className="border-b border-cream-soft/50 hover:bg-cream-soft/30 transition-colors">
                        <td className="table-cell">
                          <span className="font-mono text-xs font-bold text-neon-green bg-forest-black px-2 py-1 rounded-md">
                            {tx.transaction_id}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className="font-mono text-xs text-muted-green">
                            {tx.loan_id.slice(0, 10)}…
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="font-semibold text-forest-black text-sm">{tx.borrower_name || 'Borrower'}</div>
                          <div className="text-xs text-muted-green">{tx.borrower_email}</div>
                        </td>
                        <td className="table-cell font-bold text-forest-black">
                          ₹{Number(tx.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="table-cell">
                          <span className={`badge text-[11px] ${tx.payment_type === 'disbursement' ? 'badge-sky' : 'badge-green'}`}>
                            {tx.payment_type === 'disbursement' ? 'Disbursement' : 'Repayment'}
                          </span>
                        </td>
                        <td className="table-cell text-xs text-forest-black font-medium max-w-40 truncate">
                          {tx.payment_method}
                        </td>
                        <td className="table-cell text-xs text-muted-green">
                          {new Date(tx.created_at).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="table-cell">
                          <span className="badge-green text-xs">
                            ✓ {tx.status}
                          </span>
                        </td>
                        <td className="table-cell">
                          <button
                            onClick={() => setSelectedReceiptTx(tx)}
                            className="text-xs btn-secondary py-1 px-2.5 flex items-center gap-1 font-semibold"
                          >
                            <FileText size={12} /> Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Borrowers tab */}
          {activeTab === 'borrowers' && (
            <div className="card overflow-hidden animate-slide-up">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cream-soft bg-cream-soft/50">
                      <th className="table-header">Borrower</th>
                      <th className="table-header">Business</th>
                      <th className="table-header">Location</th>
                      <th className="table-header">Income (est)</th>
                      <th className="table-header">Score</th>
                      <th className="table-header">Loans</th>
                      <th className="table-header">Vouches</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrowers.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-muted-green">No borrowers yet</td></tr>
                    ) : borrowers.map(b => (
                      <tr key={b.id} className="border-b border-cream-soft/50 hover:bg-cream-soft/30 transition-colors">
                        <td className="table-cell">
                          <div className="font-semibold text-forest-black">{b.full_name}</div>
                          <div className="text-xs text-muted-green">{b.email}</div>
                        </td>
                        <td className="table-cell">
                          <div className="text-sm">{b.business_name || '—'}</div>
                          <div className="text-xs text-muted-green">{b.business_type || '—'}</div>
                        </td>
                        <td className="table-cell text-sm text-muted-green">{b.location || '—'}</td>
                        <td className="table-cell text-sm">₹{b.monthly_income_est ? b.monthly_income_est.toLocaleString('en-IN') : '—'}</td>
                        <td className="table-cell">
                          <span className={`font-bold ${!b.latest_score ? 'text-muted-green' : b.latest_score >= 700 ? 'text-neon-green' : b.latest_score >= 550 ? 'text-yellow-600' : 'text-red-500'}`}>
                            {b.latest_score || '—'}
                          </span>
                        </td>
                        <td className="table-cell text-center">{b.total_loans}</td>
                        <td className="table-cell text-center">{b.vouch_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disburse Modal */}
      {disburseTarget && (
        <DisburseModal
          loan={disburseTarget}
          borrowerName={disburseTarget.full_name || 'Borrower'}
          onSuccess={(result: SuccessResult) => {
            setDisburseTarget(null);
            setDisburseBanner(
              `✓ Loan disbursed to ${disburseTarget.full_name}. TXN: ${result.transaction_id}`
            );
            setTimeout(() => setDisburseBanner(''), 8000);
            fetchAll();
          }}
          onClose={() => setDisburseTarget(null)}
        />
      )}

      {/* Transaction Receipt Modal from History */}
      {selectedReceiptTx && (
        <PaymentReceipt
          result={{
            transaction_id: selectedReceiptTx.transaction_id,
            payment_method: selectedReceiptTx.payment_method,
            amount: selectedReceiptTx.amount,
            timestamp: selectedReceiptTx.created_at,
            payment_id: selectedReceiptTx.id,
          }}
          loanId={selectedReceiptTx.loan_id}
          paymentType={selectedReceiptTx.payment_type}
          borrowerName={selectedReceiptTx.borrower_name || 'Borrower'}
          onClose={() => setSelectedReceiptTx(null)}
        />
      )}
    </div>
  );
}
