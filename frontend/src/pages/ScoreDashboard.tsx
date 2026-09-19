import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { scoreApi, loanApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import ScoreGauge from '../components/ScoreGauge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { RefreshCw, ArrowRight, TrendingUp, Info, CreditCard, Clock } from 'lucide-react';

interface BreakdownFactor {
  key: string;
  label: string;
  icon: string;
  weight: number;
  weightPercent: number;
  rawValue: number;
  normalized: number;
  contribution: number;
  score: number;
  description: string;
  dataConnected: boolean;
}

interface ScoreData {
  score: number;
  breakdown: BreakdownFactor[];
  calculated_at: string;
}

function getScoreLabel(score: number) {
  if (score < 450) return { label: 'Poor', color: 'text-red-500', bg: 'bg-red-100' };
  if (score < 600) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  if (score < 750) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
  return { label: 'Excellent', color: 'text-neon-green', bg: 'bg-neon-green/10' };
}

function getFactorColor(score: number) {
  if (score < 40) return '#EF4444';
  if (score < 60) return '#F59E0B';
  if (score < 80) return '#3B82F6';
  return '#55DD4A';
}

export default function ScoreDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [history, setHistory] = useState<{ score: number; calculated_at: string }[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'breakdown' | 'history'>('breakdown');

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [scoreRes, histRes, loansRes] = await Promise.all([
        scoreApi.get(user!.id),
        scoreApi.getHistory(user!.id),
        loanApi.getUserLoans(user!.id),
      ]);
      setScoreData(scoreRes.data);
      setHistory(histRes.data.history);
      setLoans(loansRes.data.loans);
    } catch (e) {
      // score not yet calculated
    } finally {
      setIsLoading(false);
    }
  };

  const recalculate = async () => {
    setIsRecalculating(true);
    try {
      await scoreApi.calculate();
      await fetchAll();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecalculating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-soft">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
            <p className="text-muted-green">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="min-h-screen bg-cream-soft">
        <Navbar />
        <div className="pt-24 px-6">
          <div className="max-w-2xl mx-auto text-center py-24">
            <div className="text-6xl mb-6">📊</div>
            <h1 className="text-3xl font-black text-forest-black mb-4">No Score Yet</h1>
            <p className="text-muted-green mb-8">Connect your data sources and calculate your credit score to get started.</p>
            <Link to="/connect" className="btn-primary text-lg py-4 px-8">
              Connect Data & Get Score <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { label: scoreLabel, color: scoreColor, bg: scoreBg } = getScoreLabel(scoreData.score);
  const historyChartData = history.map(h => ({
    date: new Date(h.calculated_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    score: h.score,
  }));

  const activeLoans = loans.filter(l => ['active', 'disbursed', 'approved', 'under_review', 'pending'].includes(l.status));

  return (
    <div className="min-h-screen bg-cream-soft">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-content mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-forest-black mb-1">My Credit Dashboard</h1>
              <p className="text-muted-green text-sm">Last updated: {new Date(scoreData.calculated_at).toLocaleString('en-IN')}</p>
            </div>
            <button onClick={recalculate} disabled={isRecalculating} className="btn-secondary text-sm gap-2">
              <RefreshCw size={16} className={isRecalculating ? 'animate-spin' : ''} />
              {isRecalculating ? 'Recalculating...' : 'Recalculate'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Score card */}
            <div className="lg:col-span-1 space-y-6">
              {/* Score gauge */}
              <div className="card p-8 text-center">
                <ScoreGauge score={scoreData.score} size={240} />
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mt-4 ${scoreBg} ${scoreColor}`}>
                  {scoreLabel} Credit Profile
                </div>
                <div className="mt-4 text-sm text-muted-green">
                  Range: 300 (Poor) → 900 (Excellent)
                </div>
              </div>

              {/* Quick stats */}
              <div className="card p-6 space-y-4">
                <h3 className="font-bold text-forest-black">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-green">Data sources</span>
                    <span className="font-semibold text-forest-black">
                      {scoreData.breakdown.filter(b => b.dataConnected).length}/5
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-green">Eligible rate</span>
                    <span className="font-semibold text-neon-green">
                      {(24 - ((scoreData.score - 300) / 600) * 16).toFixed(1)}% p.a.
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-green">Score changes</span>
                    <span className="font-semibold text-forest-black">{history.length}</span>
                  </div>
                </div>
              </div>

              {/* Apply CTA */}
              <Link to="/apply" className="btn-primary w-full justify-center py-4 text-base">
                Apply for a Loan <ArrowRight size={18} />
              </Link>

              {/* Active loans */}
              {activeLoans.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-bold text-forest-black mb-4 flex items-center gap-2">
                    <CreditCard size={18} /> Active Loans
                  </h3>
                  <div className="space-y-3">
                    {activeLoans.slice(0, 3).map(loan => (
                      <Link key={loan.id} to={`/loans/${loan.id}`} className="block p-3 rounded-xl bg-cream-soft hover:bg-cream transition-colors">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-forest-black text-sm">₹{loan.amount.toLocaleString('en-IN')}</div>
                            <div className="text-xs text-muted-green">{loan.tenure_months} months · {loan.purpose}</div>
                          </div>
                          <span className={`badge text-xs ${
                            loan.status === 'active' ? 'badge-green' :
                            loan.status === 'pending' ? 'badge-yellow' :
                            loan.status === 'approved' ? 'badge-sky' : 'badge-green'
                          }`}>{loan.status}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Tabs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tab selector */}
              <div className="flex rounded-xl bg-cream-soft p-1 w-fit">
                <button
                  className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'breakdown' ? 'bg-forest-black text-cream shadow-sm' : 'text-muted-green hover:text-forest-black'}`}
                  onClick={() => setActiveTab('breakdown')}
                >
                  Score Breakdown
                </button>
                <button
                  className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'history' ? 'bg-forest-black text-cream shadow-sm' : 'text-muted-green hover:text-forest-black'}`}
                  onClick={() => setActiveTab('history')}
                >
                  Score History
                </button>
              </div>

              {/* Breakdown tab */}
              {activeTab === 'breakdown' && (
                <div className="space-y-4 animate-slide-up">
                  <div className="card p-4 flex items-center gap-3 border-l-4 border-neon-green bg-neon-green/5">
                    <Info size={18} className="text-neon-green flex-shrink-0" />
                    <p className="text-sm text-forest-black">
                      Your score is built from 5 transparent factors. Connect more data sources to improve your score.
                    </p>
                  </div>

                  {scoreData.breakdown.map((factor) => (
                    <div key={factor.key} className="card p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{factor.icon}</span>
                          <div>
                            <h4 className="font-bold text-forest-black">{factor.label}</h4>
                            <p className="text-xs text-muted-green">{factor.description}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-black text-2xl text-forest-black">{factor.score}</div>
                          <div className="text-xs text-muted-green">/100</div>
                        </div>
                      </div>

                      <div className="progress-bar mb-2">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${factor.score}%`,
                            backgroundColor: getFactorColor(factor.score),
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-green mt-2">
                        <span>Weight: <strong className="text-forest-black">{factor.weightPercent}%</strong></span>
                        <span>Contribution: <strong className="text-forest-black">+{Math.round(factor.contribution * 600)} pts</strong></span>
                        {!factor.dataConnected && (
                          <Link to="/connect" className="text-neon-green font-semibold hover:underline">
                            Connect data →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* History tab */}
              {activeTab === 'history' && (
                <div className="card p-6 animate-slide-up">
                  <h3 className="font-bold text-forest-black mb-6 flex items-center gap-2">
                    <TrendingUp size={18} /> Score Evolution
                  </h3>
                  {historyChartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={historyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F4F1E8" />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#566053' }} />
                        <YAxis domain={[300, 900]} tick={{ fontSize: 12, fill: '#566053' }} />
                        <Tooltip
                          contentStyle={{ background: '#122315', border: 'none', borderRadius: '12px', color: '#F3EDE4' }}
                          labelStyle={{ color: '#55DD4A' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#55DD4A"
                          strokeWidth={3}
                          dot={{ fill: '#55DD4A', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: '#D8FF62' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-green">
                      <Clock size={40} className="mx-auto mb-4 opacity-40" />
                      <p>Score history will appear here as you recalculate over time.</p>
                      <button onClick={recalculate} className="btn-primary mt-4">
                        Recalculate Score <RefreshCw size={16} />
                      </button>
                    </div>
                  )}

                  {/* History table */}
                  {history.length > 0 && (
                    <div className="mt-6 border-t border-cream-soft pt-6">
                      <div className="space-y-2">
                        {history.slice().reverse().slice(0, 8).map((h, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-cream-soft last:border-0">
                            <span className="text-sm text-muted-green">{new Date(h.calculated_at).toLocaleString('en-IN')}</span>
                            <span className={`font-bold ${getScoreLabel(h.score).color}`}>{h.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
