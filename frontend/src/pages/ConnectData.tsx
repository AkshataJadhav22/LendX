import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataApi, scoreApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { CheckCircle2, Loader2, ArrowRight, Smartphone, Zap, FileText, Users, Lock } from 'lucide-react';

const DATA_SOURCES = [
  {
    key: 'upi',
    title: 'UPI Transaction History',
    desc: 'Simulates linking your UPI (PhonePe, GPay, Paytm) transaction feed for the last 6 months.',
    icon: <Smartphone size={28} />,
    color: 'from-neon-green/10 to-lime/5',
    borderColor: 'border-neon-green/30',
    impact: '25% weight',
    apiCall: () => dataApi.connectUpi(),
  },
  {
    key: 'utility',
    title: 'Utility Bill Payments',
    desc: 'Links your electricity, water, and gas payment history to verify payment reliability.',
    icon: <Zap size={28} />,
    color: 'from-sky/10 to-sky/5',
    borderColor: 'border-sky/30',
    impact: '20% weight',
    apiCall: () => dataApi.connectUtility(),
  },
  {
    key: 'gst',
    title: 'GST Filing History',
    desc: 'Verifies your GST filing consistency as a measure of business formalization.',
    icon: <FileText size={28} />,
    color: 'from-lime/10 to-neon-green/5',
    borderColor: 'border-lime/30',
    impact: '15% weight',
    apiCall: () => dataApi.connectGst(),
  },
  {
    key: 'vouch',
    title: 'Social Vouching Network',
    desc: 'Pulls your current peer vouch count from the LendX community to include in scoring.',
    icon: <Users size={28} />,
    color: 'from-neon-green/5 to-sky/5',
    borderColor: 'border-neon-green/20',
    impact: '15% weight',
    apiCall: () => dataApi.connectSocialVouch(),
  },
];

export default function ConnectData() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [connectedData, setConnectedData] = useState<Record<string, any>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (user) {
      dataApi.getSources(user.id).then(res => {
        const sources = res.data.sources;
        const con: Record<string, boolean> = {};
        const data: Record<string, any> = {};
        for (const key of Object.keys(sources)) {
          con[key] = true;
          data[key] = sources[key];
        }
        setConnected(con);
        setConnectedData(data);
      }).catch(() => {});
    }
  }, [user]);

  const handleConnect = async (source: typeof DATA_SOURCES[0]) => {
    setLoading(l => ({ ...l, [source.key]: true }));
    try {
      const res = await source.apiCall();
      setConnected(c => ({ ...c, [source.key]: true }));
      setConnectedData(d => ({ ...d, [source.key]: res.data.data }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(l => ({ ...l, [source.key]: false }));
    }
  };

  const connectedCount = Object.values(connected).filter(Boolean).length;
  const allConnected = connectedCount === DATA_SOURCES.length;

  const handleCalculateScore = async () => {
    setIsCalculating(true);
    try {
      await scoreApi.calculate();
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-soft">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest-black/5 text-forest-black text-sm font-semibold mb-6">
              <Lock size={14} className="text-neon-green" /> Privacy-First Data Aggregation
            </div>
            <h1 className="text-4xl font-black text-forest-black mb-3">Connect Your Data Sources</h1>
            <p className="text-muted-green text-lg max-w-xl mx-auto">
              Each source strengthens your credit profile. Raw data is never stored — only aggregated signals.
            </p>
          </div>

          {/* Progress */}
          <div className="card p-5 mb-8 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-forest-black">{connectedCount} of {DATA_SOURCES.length} sources connected</span>
                <span className="text-muted-green">{Math.round((connectedCount / DATA_SOURCES.length) * 100)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill bg-neon-green" style={{ width: `${(connectedCount / DATA_SOURCES.length) * 100}%` }} />
              </div>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${allConnected ? 'bg-neon-green text-forest-black' : 'bg-cream-soft text-muted-green'}`}>
              {connectedCount}/{DATA_SOURCES.length}
            </div>
          </div>

          {/* Data source cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {DATA_SOURCES.map(source => {
              const isConnected = connected[source.key];
              const isLoading = loading[source.key];
              const data = connectedData[source.key];

              return (
                <div key={source.key} className={`card p-6 bg-gradient-to-br ${source.color} border-2 transition-all ${isConnected ? source.borderColor : 'border-transparent'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${isConnected ? 'bg-neon-green text-forest-black' : 'bg-cream-soft text-muted-green'}`}>
                      {source.icon}
                    </div>
                    {isConnected && (
                      <div className="badge-green animate-fade-in">
                        <CheckCircle2 size={12} /> Connected
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-forest-black mb-2">{source.title}</h3>
                  <p className="text-sm text-muted-green mb-4 leading-relaxed">{source.desc}</p>

                  {/* Connected data preview */}
                  {isConnected && data && (
                    <div className="bg-cream-white/80 rounded-xl p-3 mb-4 text-xs space-y-1 animate-fade-in">
                      {source.key === 'upi' && <>
                        <div className="flex justify-between"><span className="text-muted-green">Avg monthly txns</span><span className="font-semibold">₹{data.avgMonthly?.toLocaleString('en-IN')}</span></div>
                        <div className="flex justify-between"><span className="text-muted-green">Consistency score</span><span className="font-semibold text-neon-green">{Math.round((data.consistency || 0) * 100)}%</span></div>
                      </>}
                      {source.key === 'utility' && <>
                        <div className="flex justify-between"><span className="text-muted-green">Bills checked</span><span className="font-semibold">{data.totalBills}</span></div>
                        <div className="flex justify-between"><span className="text-muted-green">On-time ratio</span><span className="font-semibold text-neon-green">{Math.round((data.onTimeRatio || 0) * 100)}%</span></div>
                      </>}
                      {source.key === 'gst' && <>
                        <div className="flex justify-between"><span className="text-muted-green">GST filed</span><span className="font-semibold">{data.filed ? 'Yes' : 'No'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-green">Compliance score</span><span className="font-semibold text-neon-green">{Math.round((data.consistency || 0) * 100)}%</span></div>
                      </>}
                      {source.key === 'vouch' && <>
                        <div className="flex justify-between"><span className="text-muted-green">Vouches received</span><span className="font-semibold">{data.vouchCount || 0}</span></div>
                        <div className="flex justify-between"><span className="text-muted-green">Trust signal</span><span className="font-semibold text-neon-green">{Math.round((data.normalizedVouch || 0) * 100)}%</span></div>
                      </>}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-green bg-cream-soft px-2 py-1 rounded-full">
                      Score impact: {source.impact}
                    </span>
                    <button
                      onClick={() => handleConnect(source)}
                      disabled={isLoading || isConnected}
                      className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                        isConnected
                          ? 'text-neon-green cursor-default'
                          : 'btn-primary text-xs py-2 px-4'
                      }`}
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : isConnected ? '✓ Connected' : 'Connect'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Privacy note */}
          <div className="card p-4 mb-8 flex items-start gap-3 border border-cream">
            <Lock size={18} className="text-neon-green mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-green">
              <strong className="text-forest-black">Your privacy is protected.</strong> LendX never stores raw transaction data.
              We process all signals locally and store only aggregated, privacy-safe indicators.
              You can revoke access at any time.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={handleCalculateScore}
              disabled={connectedCount === 0 || isCalculating}
              className={`btn-primary text-lg py-4 px-10 ${connectedCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isCalculating
                ? <><Loader2 size={20} className="animate-spin" /> Calculating Score...</>
                : <>Calculate My Score <ArrowRight size={20} /></>
              }
            </button>
            <p className="text-sm text-muted-green mt-3">
              {connectedCount === 0 ? 'Connect at least one source to continue' : `Using ${connectedCount} data source${connectedCount > 1 ? 's' : ''} for your score`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
