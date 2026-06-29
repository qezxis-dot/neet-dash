import { db } from '@/lib/supabase/db';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { motion } from 'framer-motion';

export default function Register() {
  const [step, setStep] = useState('register'); // register | otp
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', full_name: '' });
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!form.full_name.trim()) return 'Full name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const validationErr = validate();
    if (validationErr) { setError(validationErr); return; }
    setLoading(true);
    try {
      const result = await db.auth.register({ email: form.email, password: form.password, full_name: form.full_name });
      // If session is returned immediately, email confirmation is off - go to dashboard
      if (result?.session) {
        window.location.href = '/dashboard';
      } else {
        setStep('otp');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const msg = typeof err === 'string' ? err : err?.message || err?.error_description || err?.msg || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length < 4) { setError('Enter the OTP sent to your email.'); return; }
    setLoading(true);
    try {
      const { access_token } = await db.auth.verifyOtp({ email: form.email, otpCode: otp });
      db.auth.setToken(access_token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await db.auth.resendOtp(form.email);
    } catch {}
  };

  const handleGoogle = () => {
    db.auth.loginWithProvider('google', '/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden py-12">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="NEET Command" className="w-10 h-10 rounded-xl flex-shrink-0" />
            <span className="font-heading font-bold text-lg text-white">NEET Command</span>
          </Link>
          <h1 className="font-heading font-bold text-3xl text-white mb-2">
            {step === 'otp' ? 'Verify your email' : 'Create your account'}
          </h1>
          <p className="text-white/40 text-sm">
            {step === 'otp' ? `We sent a code to ${form.email}` : 'Start your NEET journey today — free'}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-8">
          {step === 'register' ? (
            <>
              <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-white/3 text-white/80 text-sm font-medium hover:bg-white/6 transition-all mb-6">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-white/8" /><span className="text-white/25 text-xs">or</span><div className="flex-1 h-px bg-white/8" />
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Full Name</label>
                  <input type="text" className="input-field" placeholder="Aryan Sharma" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Email address</label>
                  <input type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} className="input-field pr-12" placeholder="Min. 8 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs">{showPass ? 'HIDE' : 'SHOW'}</button>
                  </div>
                  {form.password && (
                    <div className="flex gap-1 mt-2">
                      {[1,2,3,4].map(n => (
                        <div key={n} className={`flex-1 h-1 rounded-full transition-colors ${
                          form.password.length >= n * 3 ? (form.password.length >= 12 ? 'bg-emerald-500' : form.password.length >= 8 ? 'bg-yellow-500' : 'bg-red-500') : 'bg-white/10'
                        }`} />
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Confirm Password</label>
                  <input type="password" className="input-field" placeholder="Confirm your password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">Passwords don't match</p>
                  )}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-60">
                  {loading ? 'Creating account...' : 'Create Account →'}
                </button>
                <p className="text-center text-white/25 text-xs">
                  By creating an account you agree to our{' '}
                  <a href="#" className="text-purple-400 hover:underline">Terms</a> and{' '}
                  <a href="#" className="text-purple-400 hover:underline">Privacy Policy</a>.
                </p>
              </form>
            </>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4 text-3xl">📧</div>
                <p className="text-white/50 text-sm">Check your inbox and enter the 6-digit code below.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5 text-center">Verification Code</label>
                <input
                  type="text"
                  className="input-field text-center text-2xl font-mono tracking-widest"
                  placeholder="• • • • • •"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-60">
                {loading ? 'Verifying...' : 'Verify & Enter Dashboard →'}
              </button>
              <p className="text-center text-white/30 text-sm">
                Didn't receive it?{' '}
                <button type="button" onClick={handleResend} className="text-purple-400 hover:underline">Resend code</button>
              </p>
            </form>
          )}
        </motion.div>

        <p className="text-center text-white/30 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
