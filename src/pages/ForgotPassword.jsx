import { db } from '@/lib/supabase/db';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { motion } from 'framer-motion';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Enter your email address.'); return; }
    setLoading(true);
    try {
      await db.auth.resetPasswordRequest(email);
      setSent(true);
    } catch {
      setSent(true); // Always show success (API hides whether email exists)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">N</div>
            <span className="font-heading font-bold text-lg text-white">NEET Command</span>
          </Link>
          <h1 className="font-heading font-bold text-3xl text-white mb-2">Reset password</h1>
          <p className="text-white/40 text-sm">We'll send a reset link to your email</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-8">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Email address</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-60">
                {loading ? 'Sending...' : 'Send Reset Link →'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
              <h3 className="font-heading font-bold text-white text-lg mb-2">Check your inbox</h3>
              <p className="text-white/40 text-sm mb-6">
                If an account exists for <span className="text-white/60">{email}</span>, you'll receive a reset link shortly.
              </p>
              <Link to="/login" className="btn-primary inline-flex justify-center text-sm px-8 py-2.5">Back to Login</Link>
            </div>
          )}
        </motion.div>

        <p className="text-center text-white/30 text-sm mt-6">
          Remembered it?{' '}
          <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}