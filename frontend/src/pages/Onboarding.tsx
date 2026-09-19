import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Building2, MapPin, TrendingUp, Phone, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

const schema = z.object({
  business_name: z.string().min(2, 'Business name is required'),
  business_type: z.string().min(1, 'Please select a business type'),
  location: z.string().min(2, 'Location is required'),
  monthly_income_est: z.coerce.number().min(1000, 'Monthly income must be at least ₹1,000'),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const BUSINESS_TYPES = [
  'Street Vendor', 'Gig Worker / Freelancer', 'Home-based Business',
  'Small Retail Shop', 'Food & Beverages', 'Transport / Logistics',
  'Agriculture / Farming', 'Handicraft / Artisan', 'Service Provider', 'Other',
];

const STEPS = ['Business Info', 'Location & Income', 'Contact'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const watchedBusinessType = watch('business_type');

  const nextStep = async () => {
    const fieldsPerStep = [
      ['business_name', 'business_type'],
      ['location', 'monthly_income_est'],
      ['phone'],
    ] as (keyof FormData)[][];

    const valid = await trigger(fieldsPerStep[step]);
    if (valid) setStep(s => s + 1);
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError('');
    try {
      await profileApi.create(data);
      navigate('/connect');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-soft">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-forest-black mb-2">Tell Us About Your Business</h1>
            <p className="text-muted-green">This helps us create a personalized credit profile for you.</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-4 mb-10">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-2">
                  <div className={i < step ? 'step-done' : i === step ? 'step-active' : 'step-pending'}>
                    {i < step ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-forest-black' : 'text-muted-green'}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px max-w-16 ${i < step ? 'bg-neon-green' : 'bg-cream-soft'}`} />}
              </React.Fragment>
            ))}
          </div>

          <div className="card p-8">
            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 0: Business Info */}
              {step === 0 && (
                <div className="space-y-6 animate-slide-up">
                  <div>
                    <label className="label">Business / Trade Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-green" size={18} />
                      <input {...register('business_name')} className="input pl-10" placeholder="e.g. Sharma Textiles, Quick Eats" />
                    </div>
                    {errors.business_name && <p className="text-red-500 text-xs mt-1">{errors.business_name.message}</p>}
                  </div>

                  <div>
                    <label className="label">Business Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {BUSINESS_TYPES.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setValue('business_type', type)}
                          className={`p-3 rounded-xl text-sm text-left font-medium transition-all border-2 ${
                            watchedBusinessType === type
                              ? 'border-neon-green bg-neon-green/5 text-forest-black'
                              : 'border-cream-soft text-muted-green hover:border-muted-green'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    {errors.business_type && <p className="text-red-500 text-xs mt-1">{errors.business_type.message}</p>}
                  </div>
                </div>
              )}

              {/* Step 1: Location & Income */}
              {step === 1 && (
                <div className="space-y-6 animate-slide-up">
                  <div>
                    <label className="label">Business Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-green" size={18} />
                      <input {...register('location')} className="input pl-10" placeholder="e.g. Chandni Chowk, Delhi" />
                    </div>
                    {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
                  </div>

                  <div>
                    <label className="label">Estimated Monthly Income (₹)</label>
                    <div className="relative">
                      <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-green" size={18} />
                      <input {...register('monthly_income_est')} type="number" className="input pl-10" placeholder="e.g. 25000" />
                    </div>
                    {errors.monthly_income_est && <p className="text-red-500 text-xs mt-1">{errors.monthly_income_est.message}</p>}
                    <p className="text-xs text-muted-green mt-1">This is an estimate — we use it as one signal, not the only one.</p>
                  </div>

                  <div className="card p-4 bg-cream-soft border border-cream">
                    <div className="flex items-start gap-3">
                      <div className="text-neon-green mt-0.5">💡</div>
                      <p className="text-sm text-muted-green">
                        The more accurate your income estimate, the more favorable your scoring factors may be calculated.
                        All data is aggregated — raw figures are never stored.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Contact */}
              {step === 2 && (
                <div className="space-y-6 animate-slide-up">
                  <div>
                    <label className="label">Mobile Number (optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-green" size={18} />
                      <input {...register('phone')} className="input pl-10" placeholder="+91 98765 43210" type="tel" />
                    </div>
                    <p className="text-xs text-muted-green mt-1">For loan status updates and repayment reminders.</p>
                  </div>

                  <div className="card p-5 border-2 border-neon-green/30 bg-neon-green/5">
                    <div className="text-lg font-bold text-forest-black mb-3">Review Your Details</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-green">Name</span><span className="font-semibold text-forest-black">{user?.full_name}</span></div>
                      <div className="flex justify-between"><span className="text-muted-green">Business Type</span><span className="font-semibold text-forest-black">{watch('business_type')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-green">Location</span><span className="font-semibold text-forest-black">{watch('location')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-green">Est. Monthly Income</span><span className="font-semibold text-forest-black">₹{Number(watch('monthly_income_est') || 0).toLocaleString('en-IN')}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-cream-soft">
                {step > 0 ? (
                  <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary">
                    <ChevronLeft size={18} /> Back
                  </button>
                ) : <div />}

                {step < STEPS.length - 1 ? (
                  <button type="button" onClick={nextStep} className="btn-primary">
                    Next <ChevronRight size={18} />
                  </button>
                ) : (
                  <button type="submit" disabled={isLoading} className="btn-primary">
                    {isLoading
                      ? <span className="animate-spin w-4 h-4 border-2 border-forest-black/30 border-t-forest-black rounded-full" />
                      : <>Save & Continue <ChevronRight size={18} /></>
                    }
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
