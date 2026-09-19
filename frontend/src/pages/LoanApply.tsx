import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loanApi, scoreApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { ArrowRight, Calculator, Info, CheckCircle2 } from 'lucide-react';

const schema = z.object({
  amount: z.coerce.number().min(5000, 'Minimum loan amount is ₹5,000').max(500000, 'Maximum loan amount is ₹5,00,000'),
  tenure_months: z.coerce.number().min(1).max(36),
  purpose: z.string().min(5, 'Please describe your loan purpose'),
});

type FormData = z.infer<typeof schema>;

const PURPOSES = [
  'Business inventory / stock',
  'Equipment purchase',
  'Working capital',
  'Shop renovation',
  'Raw materials',
  'Marketing / expansion',
  'Emergency business expense',
  'Other',
];

export default function LoanApply() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [score, setScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 25000, tenure_months: 6, purpose: '' },
  });

  const watchAmount = watch('amount');
  const watchTenure = watch('tenure_months');
  const watchPurpose = watch('purpose');

  useEffect(() => {
    if (user) {
      scoreApi.get(user.id).then(res => setScore(res.data.score)).catch(() => {});
    }
  }, [user]);

  const interestRate = score ? +(24 - ((score - 300) / 600) * 16).toFixed(2) : 18;
  const monthlyRate = interestRate / 100 / 12;
  const emi = watchAmount && watchTenure > 0
    ? +(watchAmount * monthlyRate * Math.pow(1 + monthlyRate, watchTenure) / (Math.pow(1 + monthlyRate, watchTenure) - 1)).toFixed(2)
    : 0;
  const totalRepayable = +(emi * watchTenure).toFixed(2);
  const totalInterest = +(totalRepayable - (watchAmount || 0)).toFixed(2);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await loanApi.apply(data);
      setSuccess(true);
      setTimeout(() => navigate(`/loans/${res.data.loan.id}`), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-cream-soft">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-[80vh]">
          <div className="card p-12 text-center max-w-md animate-slide-up">
            <div className="w-20 h-20 rounded-full bg-neon-green/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-neon-green" />
            </div>
            <h2 className="text-2xl font-black text-forest-black mb-3">Application Submitted!</h2>
            <p className="text-muted-green mb-2">Your loan application is under review.</p>
            <p className="text-sm text-muted-green">Redirecting to loan status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-soft">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-forest-black mb-3">Apply for a Micro-Loan</h1>
            <p className="text-muted-green">Transparent pricing. No hidden fees. Rate based on your LendX score.</p>
          </div>

          {/* Score-based rate banner */}
          {score && (
            <div className="card p-4 mb-8 border-l-4 border-neon-green bg-neon-green/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info size={18} className="text-neon-green" />
                <div>
                  <span className="font-semibold text-forest-black text-sm">Your score: {score}</span>
                  <span className="text-muted-green text-sm ml-2">→ Qualifying rate: <strong className="text-neon-green">{interestRate}% p.a.</strong></span>
                </div>
              </div>
              <div className="text-xs text-muted-green">Rate improves as you repay</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="card p-8">
                {error && (
                  <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Amount slider */}
                  <div>
                    <label className="label">Loan Amount</label>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-green">₹5,000</span>
                      <span className="font-black text-2xl text-forest-black">₹{Number(watchAmount || 0).toLocaleString('en-IN')}</span>
                      <span className="text-muted-green">₹5,00,000</span>
                    </div>
                    <input
                      {...register('amount')}
                      type="range"
                      min={5000}
                      max={500000}
                      step={1000}
                      className="w-full h-2 bg-cream-soft rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: '#55DD4A' }}
                    />
                    {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
                  </div>

                  {/* Tenure */}
                  <div>
                    <label className="label">Repayment Tenure</label>
                    <div className="grid grid-cols-6 gap-2">
                      {[3, 6, 9, 12, 18, 24].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setValue('tenure_months', t)}
                          className={`py-2 rounded-xl text-sm font-semibold text-center transition-all border-2 ${
                            watchTenure === t
                              ? 'border-neon-green bg-neon-green/10 text-forest-black'
                              : 'border-cream-soft text-muted-green hover:border-muted-green'
                          }`}
                        >
                          {t}mo
                        </button>
                      ))}
                    </div>
                    {errors.tenure_months && <p className="text-red-500 text-xs mt-1">{errors.tenure_months.message}</p>}
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="label">Loan Purpose</label>
                    <div className="grid grid-cols-1 gap-2 mb-3">
                      {PURPOSES.map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setValue('purpose', p)}
                          className={`py-2.5 px-4 rounded-xl text-sm font-medium text-left transition-all border-2 ${
                            watchPurpose === p
                              ? 'border-neon-green bg-neon-green/5 text-forest-black'
                              : 'border-cream-soft text-muted-green hover:border-muted-green'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose.message}</p>}
                  </div>

                  <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-4 text-base">
                    {isSubmitting
                      ? <span className="animate-spin w-4 h-4 border-2 border-forest-black/30 border-t-forest-black rounded-full" />
                      : <>Submit Application <ArrowRight size={18} /></>
                    }
                  </button>
                </form>
              </div>
            </div>

            {/* Loan calculator summary */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card p-6 border-2 border-neon-green/30">
                <div className="flex items-center gap-2 mb-5">
                  <Calculator size={18} className="text-neon-green" />
                  <h3 className="font-bold text-forest-black">Loan Summary</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-cream-soft">
                    <span className="text-sm text-muted-green">Loan amount</span>
                    <span className="font-bold text-forest-black">₹{Number(watchAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-cream-soft">
                    <span className="text-sm text-muted-green">Interest rate</span>
                    <span className="font-bold text-neon-green">{interestRate}% p.a.</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-cream-soft">
                    <span className="text-sm text-muted-green">Tenure</span>
                    <span className="font-bold text-forest-black">{watchTenure} months</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-cream-soft">
                    <span className="text-sm text-muted-green">Monthly EMI</span>
                    <span className="font-bold text-forest-black text-lg">₹{emi.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-cream-soft">
                    <span className="text-sm text-muted-green">Total interest</span>
                    <span className="font-bold text-forest-black">₹{totalInterest.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-sm font-semibold text-forest-black">Total repayable</span>
                    <span className="font-black text-forest-black text-lg">₹{totalRepayable.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="card p-4 bg-neon-green/5 border border-neon-green/20">
                <div className="text-sm font-semibold text-forest-black mb-2">💡 Dynamic Repricing</div>
                <p className="text-xs text-muted-green">
                  Your interest rate can decrease as you make on-time repayments. Good behavior is rewarded — not just noted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
