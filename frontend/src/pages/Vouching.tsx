import React, { useState, useEffect } from 'react';
import { vouchApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Search, Users, CheckCircle2, MessageSquare, Star, UserPlus } from 'lucide-react';

export default function Vouching() {
  const { user } = useAuth();
  const [receivedVouches, setReceivedVouches] = useState<any[]>([]);
  const [givenVouches, setGivenVouches] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [vouchNote, setVouchNote] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'give' | 'received' | 'given'>('give');

  useEffect(() => {
    if (user) {
      vouchApi.getReceived(user.id).then(r => setReceivedVouches(r.data.vouches));
      vouchApi.getGiven(user.id).then(r => setGivenVouches(r.data.vouches));
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.length >= 3) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        vouchApi.searchBorrowers(searchQuery)
          .then(r => setSearchResults(r.data.borrowers))
          .catch(() => setSearchResults([]))
          .finally(() => setIsSearching(false));
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleVouch = async (voucheeId: string) => {
    setSubmitting(voucheeId);
    try {
      await vouchApi.submit({ vouchee_id: voucheeId, note: vouchNote[voucheeId] || '' });
      setSuccessMsg('Vouch submitted successfully! ✅');
      setTimeout(() => setSuccessMsg(''), 3000);
      setSearchResults(prev => prev.filter(b => b.id !== voucheeId));
      // Refresh given vouches
      if (user) vouchApi.getGiven(user.id).then(r => setGivenVouches(r.data.vouches));
    } catch (e: any) {
      setSuccessMsg(e?.response?.data?.error || 'Error submitting vouch');
      setTimeout(() => setSuccessMsg(''), 3000);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream-soft">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full bg-neon-green/10 flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-neon-green" />
            </div>
            <h1 className="text-4xl font-black text-forest-black mb-3">Community Vouching</h1>
            <p className="text-muted-green text-lg max-w-lg mx-auto">
              Vouch for trusted members of your network. Your endorsement helps them build credit — and builds community trust.
            </p>
          </div>

          {/* Vouch count banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Vouches Received', value: receivedVouches.length, icon: <Star size={20} />, color: 'text-neon-green' },
              { label: 'Vouches Given', value: givenVouches.length, icon: <CheckCircle2 size={20} />, color: 'text-sky' },
              { label: 'Score Impact', value: `${Math.min(receivedVouches.length, 5) * 20}%`, icon: <Users size={20} />, color: 'text-lime' },
            ].map(stat => (
              <div key={stat.label} className="card p-5 text-center">
                <div className={`flex justify-center mb-2 ${stat.color}`}>{stat.icon}</div>
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-muted-green">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Success message */}
          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-neon-green/10 border border-neon-green/30 text-forest-black font-semibold text-sm animate-fade-in">
              {successMsg}
            </div>
          )}

          {/* Tabs */}
          <div className="flex rounded-xl bg-cream-soft p-1 w-fit mb-8">
            {[
              { key: 'give', label: 'Give a Vouch' },
              { key: 'received', label: `Received (${receivedVouches.length})` },
              { key: 'given', label: `Given (${givenVouches.length})` },
            ].map(tab => (
              <button
                key={tab.key}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === tab.key ? 'bg-forest-black text-cream shadow-sm' : 'text-muted-green hover:text-forest-black'}`}
                onClick={() => setActiveTab(tab.key as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Give Vouch tab */}
          {activeTab === 'give' && (
            <div className="space-y-6 animate-slide-up">
              <div className="card p-6">
                <h3 className="font-bold text-forest-black mb-4 flex items-center gap-2">
                  <Search size={18} /> Search Borrowers
                </h3>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-green" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="input pl-10"
                    placeholder="Search by email (min. 3 characters)"
                  />
                </div>

                {isSearching && (
                  <div className="flex items-center gap-2 text-muted-green text-sm py-4">
                    <div className="w-4 h-4 border-2 border-muted-green/30 border-t-muted-green rounded-full animate-spin" />
                    Searching...
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    {searchResults.map(borrower => (
                      <div key={borrower.id} className="border-2 border-cream-soft rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-bold text-forest-black">{borrower.full_name}</div>
                            <div className="text-sm text-muted-green">{borrower.email}</div>
                            {borrower.business_name && (
                              <div className="text-xs badge-green mt-1">{borrower.business_name}</div>
                            )}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center font-bold text-neon-green">
                            {borrower.full_name[0]}
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="text-xs font-semibold text-muted-green mb-1 block">Add a note (optional)</label>
                          <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 text-muted-green" size={14} />
                            <textarea
                              value={vouchNote[borrower.id] || ''}
                              onChange={e => setVouchNote(n => ({ ...n, [borrower.id]: e.target.value }))}
                              className="input pl-9 text-sm resize-none"
                              rows={2}
                              placeholder="I vouch for this person because..."
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleVouch(borrower.id)}
                          disabled={submitting === borrower.id}
                          className="btn-primary text-sm py-2.5 px-5"
                        >
                          {submitting === borrower.id
                            ? <span className="animate-spin w-4 h-4 border-2 border-forest-black/30 border-t-forest-black rounded-full" />
                            : <><UserPlus size={16} /> Vouch for {borrower.full_name.split(' ')[0]}</>
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery.length >= 3 && !isSearching && searchResults.length === 0 && (
                  <div className="text-center py-8 text-muted-green">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No borrowers found for "{searchQuery}"</p>
                  </div>
                )}

                {searchQuery.length < 3 && (
                  <div className="text-center py-8 text-muted-green/50 text-sm">
                    Type at least 3 characters to search for borrowers
                  </div>
                )}
              </div>

              <div className="card p-5 bg-neon-green/5 border border-neon-green/20">
                <div className="font-semibold text-forest-black mb-2">🤝 How Vouching Works</div>
                <ul className="text-sm text-muted-green space-y-1">
                  <li>• Each vouch you give counts towards the recipient's Community Trust factor</li>
                  <li>• Up to 5 vouches count towards scoring (max 15% impact)</li>
                  <li>• You can only vouch for each person once</li>
                  <li>• Vouches are public and visible to lenders</li>
                </ul>
              </div>
            </div>
          )}

          {/* Received tab */}
          {activeTab === 'received' && (
            <div className="space-y-4 animate-slide-up">
              {receivedVouches.length === 0 ? (
                <div className="card p-12 text-center">
                  <Star size={40} className="mx-auto mb-4 text-muted-green opacity-30" />
                  <p className="text-muted-green">No vouches received yet. Share your profile with your network!</p>
                </div>
              ) : receivedVouches.map(v => (
                <div key={v.id} className="card p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center font-bold text-neon-green flex-shrink-0">
                    {v.voucher_name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-forest-black">{v.voucher_name}</div>
                    <div className="text-sm text-muted-green mb-2">{v.voucher_email}</div>
                    {v.note && <div className="text-sm text-forest-black italic bg-cream-soft rounded-lg px-3 py-2">"{v.note}"</div>}
                    <div className="text-xs text-muted-green mt-2">{new Date(v.created_at).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div className="badge-green flex-shrink-0"><Star size={12} /> Vouched</div>
                </div>
              ))}
            </div>
          )}

          {/* Given tab */}
          {activeTab === 'given' && (
            <div className="space-y-4 animate-slide-up">
              {givenVouches.length === 0 ? (
                <div className="card p-12 text-center">
                  <CheckCircle2 size={40} className="mx-auto mb-4 text-muted-green opacity-30" />
                  <p className="text-muted-green">You haven't vouched for anyone yet.</p>
                  <button onClick={() => setActiveTab('give')} className="btn-primary mt-4">
                    Give a Vouch <UserPlus size={16} />
                  </button>
                </div>
              ) : givenVouches.map(v => (
                <div key={v.id} className="card p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-sky/10 flex items-center justify-center font-bold text-sky flex-shrink-0">
                    {v.vouchee_name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-forest-black">{v.vouchee_name}</div>
                    <div className="text-sm text-muted-green mb-2">{v.vouchee_email}</div>
                    {v.note && <div className="text-sm text-forest-black italic bg-cream-soft rounded-lg px-3 py-2">"{v.note}"</div>}
                    <div className="text-xs text-muted-green mt-2">Vouched on {new Date(v.created_at).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div className="badge-sky flex-shrink-0"><CheckCircle2 size={12} /> Vouched</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
