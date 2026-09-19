import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, ArrowRight, Building2, Briefcase } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = loginSchema.extend({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['borrower', 'admin']),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'borrower' }
  });

  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    setError('');
    try {
      await register(data);
      navigate(data.role === 'admin' ? '/admin' : '/onboarding');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-64 h-64 bg-neon-green/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-48 h-48 bg-sky/5 rounded-full blur-3xl" />
        </div>

        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neon-gradient rounded-lg flex items-center justify-center">
            <span className="text-forest-black font-black text-sm">L</span>
          </div>
          <span className="text-cream font-black text-xl">LendX</span>
        </Link>

        <div>
          <h2 className="text-5xl font-black text-cream mb-6 leading-tight">
            YOUR SCORE.<br />
            <span className="text-gradient">YOUR STORY.</span><br />
            YOUR FUNDING.
          </h2>
          <p className="text-cream/60 text-lg leading-relaxed mb-8">
            Access micro-loans based on your actual financial behavior —
            not a credit report you've never seen.
          </p>
          <div className="space-y-3">
            {[
              '✅ Score in minutes, not days',
              '✅ Full factor breakdown — no black box',
              '✅ Rate improves as you repay',
              '✅ Community vouching system',
            ].map(item => (
              <div key={item} className="text-cream/70 text-sm">{item}</div>
            ))}
          </div>
        </div>

        <div className="text-cream/30 text-sm">© 2026 LendX · Privacy-first lending</div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-neon-gradient rounded-lg flex items-center justify-center">
              <span className="text-forest-black font-black text-sm">L</span>
            </div>
            <span className="text-cream font-black text-xl">LendX</span>
          </Link>

          <div className="card p-8">
            {/* Tabs */}
            <div className="flex rounded-xl bg-cream-soft p-1 mb-8">
              <button
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${isLogin ? 'bg-forest-black text-cream shadow-sm' : 'text-muted-green hover:text-forest-black'}`}
                onClick={() => { setIsLogin(true); setError(''); }}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${!isLogin ? 'bg-forest-black text-cream shadow-sm' : 'text-muted-green hover:text-forest-black'}`}
                onClick={() => { setIsLogin(false); setError(''); }}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Login Form */}
            {isLogin ? (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                <div>
                  <label className="label">Email address</label>
                  <input {...loginForm.register('email')} type="email" className="input" placeholder="you@example.com" />
                  {loginForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      {...loginForm.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="••••••••"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-green hover:text-forest-black"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="pt-1 text-xs text-muted-green">
                  Demo: <strong>admin@lendx.com</strong> / <strong>admin123</strong>
                </div>

                <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-3.5">
                  {isLoading ? <span className="animate-spin w-4 h-4 border-2 border-forest-black/30 border-t-forest-black rounded-full" /> : <>Sign In <ArrowRight size={18} /></>}
                </button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-5">
                <div>
                  <label className="label">Full name</label>
                  <input {...registerForm.register('full_name')} className="input" placeholder="Rahul Sharma" />
                  {registerForm.formState.errors.full_name && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Email address</label>
                  <input {...registerForm.register('email')} type="email" className="input" placeholder="you@example.com" />
                  {registerForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      {...registerForm.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="input pr-10"
                      placeholder="Min. 6 characters"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-green hover:text-forest-black"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Role select */}
                <div>
                  <label className="label">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'borrower', label: 'Borrower', icon: <Briefcase size={20} />, desc: 'I need a loan' },
                      { value: 'admin', label: 'Lender / Admin', icon: <Building2 size={20} />, desc: 'I manage loans' },
                    ].map((opt) => {
                      const selected = registerForm.watch('role') === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => registerForm.setValue('role', opt.value as 'borrower' | 'admin')}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${selected ? 'border-neon-green bg-neon-green/5' : 'border-cream-soft hover:border-muted-green'}`}
                        >
                          <div className={`mb-2 ${selected ? 'text-neon-green' : 'text-muted-green'}`}>{opt.icon}</div>
                          <div className="font-semibold text-forest-black text-sm">{opt.label}</div>
                          <div className="text-xs text-muted-green">{opt.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-3.5">
                  {isLoading ? <span className="animate-spin w-4 h-4 border-2 border-forest-black/30 border-t-forest-black rounded-full" /> : <>Create Account <ArrowRight size={18} /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
