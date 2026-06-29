import { db } from '@/lib/supabase/db';

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

export default function ResetPassword() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get('token');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (!token) { setError('Invalid or expired reset link.'); return; }
    setLoading(true);
    try {
      await db.auth.resetPassword({ resetToken: token, newPassword: form.password });
      setDone(true);
      setTimeout(() => { window.location.href = '/login'; }, 2500);
    } catch (err) {
      setError(err?.message || 'Failed to reset password. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="NEET Command" className="w-10 h-10 rounded-xl flex-shrink-0" />
            <span className="font-heading font-bold text-lg text-white">NEET Command</span>
          </Link>
          <h1 className="font-heading font-bold text-3xl text-white mb-2">New password</h1>
          <p className="text-white/40 text-sm">Choose a strong password to secure your account</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-8">
          {!done ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input-field pr-12" placeholder="Min. 8 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs">{showPass ? 'HIDE' : 'SHOW'}</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Confirm Password</label>
                <input type="password" className="input-field" placeholder="Confirm new password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-60">
                {loading ? 'Resetting...' : 'Reset Password →'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-3xl">🎉</div>
              <h3 className="font-heading font-bold text-white text-lg mb-2">Password reset!</h3>
              <p className="text-white/40 text-sm">Redirecting you to login...</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
