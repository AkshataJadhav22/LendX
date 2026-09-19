import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowRight, Shield, Zap, TrendingUp, Users, ChevronRight, CheckCircle2, BarChart3, Star } from 'lucide-react';

const features = [
  {
    icon: '💳',
    title: 'Alternative Credit Scoring',
    desc: 'We assess UPI transactions, utility bills, GST filings, and peer vouches — not just a CIBIL score.',
    color: 'from-neon-green/20 to-lime/10',
  },
  {
    icon: '🔍',
    title: 'Full Transparency',
    desc: 'Every score comes with a factor-by-factor breakdown. No black boxes, ever.',
    color: 'from-sky/20 to-sky/5',
  },
  {
    icon: '🤝',
    title: 'Community Vouching',
    desc: 'Trust is built together. Peer vouches from verified users boost your score and access.',
    color: 'from-lime/20 to-neon-green/5',
  },
  {
    icon: '📈',
    title: 'Dynamic Repricing',
    desc: 'Your interest rate drops as you repay on time. Good behavior is rewarded, not punished.',
    color: 'from-neon-green/20 to-sky/10',
  },
];

const steps = [
  { num: '01', title: 'Create your account', desc: 'Sign up in under 2 minutes with your email.' },
  { num: '02', title: 'Connect your data', desc: 'Link UPI, utility bills, GST — no paperwork.' },
  { num: '03', title: 'Get your score', desc: 'Receive a transparent, explainable credit score.' },
  { num: '04', title: 'Access funding', desc: 'Apply for micro-loans tailored to your business.' },
];

const stats = [
  { value: '₹2.4Cr+', label: 'Disbursed to date' },
  { value: '12,000+', label: 'Borrowers funded' },
  { value: '8.2%', label: 'Starting interest rate' },
  { value: '94%', label: 'On-time repayment rate' },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="section-dark relative overflow-hidden pt-32">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-20 w-64 h-64 bg-sky/5 rounded-full blur-3xl" />
          <div className="absolute top-40 left-1/2 w-px h-64 bg-gradient-to-b from-neon-green/20 to-transparent" />
        </div>

        <div className="max-w-content mx-auto px-6 relative">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-sm font-semibold mb-8 animate-fade-in">
              <Zap size={14} />
              Alternative Credit · Explainable Scoring · Zero Hidden Fees
            </div>

            {/* Headline */}
            <h1 className="text-hero text-cream mb-6 animate-slide-up" style={{ lineHeight: '1' }}>
              LENDING FOR<br />
              <span className="text-gradient">REAL INDIA.</span><br />
              NOT JUST THE<br />
              CREDIT-SCORED.
            </h1>

            <p className="text-cream/70 text-xl max-w-2xl mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
              LendX helps street vendors, gig workers, and micro-entrepreneurs access working capital using
              digital payments, utility data, and community trust — not a CIBIL score.
            </p>

            <div className="flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/auth" className="btn-primary text-base py-4 px-8">
                Apply for a Loan <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works" className="btn-outline-light text-base py-4 px-8">
                See How It Works
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 mt-12 pt-8 border-t border-forest-deep animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {['Privacy-First Data', 'No Hidden Fees', 'Explainable Score', 'Instant Decisions'].map((badge) => (
                <div key={badge} className="flex items-center gap-2 text-cream/60 text-sm">
                  <CheckCircle2 size={16} className="text-neon-green" />
                  {badge}
                </div>
              ))}
            </div>
          </div>

          {/* Floating Score Card */}
          <div className="absolute right-6 top-8 hidden xl:block animate-float">
            <div className="card p-6 w-64">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-muted-green uppercase tracking-wide">Credit Score</span>
                <span className="badge-green">Excellent</span>
              </div>
              <div className="text-5xl font-black text-forest-black mb-2">742</div>
              <div className="text-xs text-muted-green mb-4">↑ 28 points this month</div>
              <div className="space-y-2">
                {['UPI Activity', 'Bill Payments', 'Peer Vouches'].map((item, i) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="flex-1 progress-bar">
                      <div className="progress-fill bg-neon-green" style={{ width: `${[85, 92, 70][i]}%` }} />
                    </div>
                    <span className="text-xs text-muted-green w-8">{[85, 92, 70][i]}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Illustrated divider */}
        <div className="mt-20">
          <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16">
            <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,30 1440,40 L1440,80 L0,80 Z" fill="#F4F1E8" />
          </svg>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-cream-soft py-12">
        <div className="max-w-content mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-forest-black mb-1">{stat.value}</div>
                <div className="text-sm text-muted-green font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section-white">
        <div className="max-w-content mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest-black/5 text-forest-black text-sm font-semibold mb-6">
              <Star size={14} className="text-neon-green" /> What Makes Us Different
            </div>
            <h2 className="text-section text-forest-black mb-4">BUILT FOR THE<br /><span className="text-gradient">INFORMAL ECONOMY</span></h2>
            <p className="text-muted-green text-lg max-w-2xl mx-auto">
              Traditional banks ignore millions of creditworthy entrepreneurs. We don't.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className={`card p-8 bg-gradient-to-br ${f.color} border-cream-soft`}>
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-forest-black mb-2">{f.title}</h3>
                <p className="text-muted-green leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section-dark">
        <div className="max-w-content mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-section text-cream mb-4">HOW IT<br /><span className="text-gradient">WORKS</span></h2>
            <p className="text-cream/60 text-lg max-w-xl mx-auto">
              From sign-up to disbursement in under 24 hours.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                <div className="text-6xl font-black text-neon-green/20 mb-4">{step.num}</div>
                <h3 className="text-xl font-bold text-cream mb-2">{step.title}</h3>
                <p className="text-cream/60 text-sm leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-4 text-neon-green/30" size={24} />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-20">
          <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16">
            <path d="M0,40 C480,0 960,80 1440,40 L1440,80 L0,80 Z" fill="#F4F1E8" />
          </svg>
        </div>
      </section>

      {/* Scoring explainer */}
      <section id="scoring" className="section-light">
        <div className="max-w-content mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-section text-forest-black mb-6">YOUR SCORE,<br /><span className="text-gradient">EXPLAINED.</span></h2>
              <p className="text-muted-green text-lg leading-relaxed mb-8">
                We don't hand you a number and walk away. Every LendX score includes a full breakdown
                showing exactly how each factor contributed. Because you deserve to understand your own creditworthiness.
              </p>
              <Link to="/auth" className="btn-primary">
                Check My Score <ArrowRight size={18} />
              </Link>
            </div>

            {/* Score breakdown preview */}
            <div className="card p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm text-muted-green font-medium mb-1">Your Credit Score</div>
                  <div className="text-5xl font-black text-forest-black">742</div>
                </div>
                <span className="badge-green text-sm px-4 py-2">Excellent</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: '💳 Transaction Consistency', pct: 88, weight: '25%' },
                  { label: '⚡ Bill Payment Reliability', pct: 95, weight: '20%' },
                  { label: '📋 Business Formalization', pct: 72, weight: '15%' },
                  { label: '🤝 Community Trust', pct: 60, weight: '15%' },
                  { label: '📈 Repayment History', pct: 85, weight: '25%' },
                ].map((factor) => (
                  <div key={factor.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-forest-black">{factor.label}</span>
                      <span className="text-muted-green text-xs">{factor.weight} weight · {factor.pct}/100</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill bg-neon-green" style={{ width: `${factor.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-dark">
        <div className="max-w-content mx-auto px-6 text-center">
          <h2 className="text-section text-cream mb-6">READY TO GET<br /><span className="text-gradient">FUNDED?</span></h2>
          <p className="text-cream/60 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of micro-entrepreneurs who've accessed fair, transparent micro-loans through LendX.
          </p>
          <Link to="/auth" className="btn-primary text-lg py-5 px-10">
            Start Your Application <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-forest-black border-t border-forest-deep py-12">
        <div className="max-w-content mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-neon-gradient rounded-lg flex items-center justify-center">
                  <span className="text-forest-black font-black text-sm">L</span>
                </div>
                <span className="text-cream font-black text-xl">LendX</span>
              </div>
              <p className="text-cream/40 text-sm leading-relaxed">
                Fair lending for the informal economy. Powered by alternative data.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Score Dashboard', 'Loan Application', 'Repayments', 'Vouching'] },
              { title: 'Company', links: ['About', 'Privacy Policy', 'Terms of Service', 'Contact'] },
              { title: 'Resources', links: ['How Scoring Works', 'Blog', 'FAQ', 'Support'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-cream font-semibold text-sm uppercase tracking-wider mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}><a href="#" className="text-cream/40 hover:text-cream/80 text-sm transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-forest-deep pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-cream/30 text-sm">© 2026 LendX. All rights reserved.</p>
            <p className="text-cream/30 text-sm">Privacy-first. Explainable. Fair.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
