import { db } from '@/lib/supabase/db';

import React, { useState, useEffect } from 'react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: '', bio: '', target_year: 2025, target_score: 700, daily_goal_hours: 8 });

  useEffect(() => {
    const load = async () => {
      const u = await db.auth.me();
      setUser(u);
      const profs = await db.entities.UserProfile.filter({ user_id: u.id });
      if (profs[0]) {
        setProfile(profs[0]);
        setForm({ username: profs[0].username || '', bio: profs[0].bio || '', target_year: profs[0].target_year || 2025, target_score: profs[0].target_score || 700, daily_goal_hours: profs[0].daily_goal_hours || 8 });
      }
      setLoading(false);
    };
    load();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    if (profile) {
      const updated = await db.entities.UserProfile.update(profile.id, form);
      setProfile(updated);
    } else {
      const created = await db.entities.UserProfile.create({ ...form, user_id: user.id });
      setProfile(created);
    }
    setSaving(false);
  };

  const LEVEL_NAMES = ['Beginner', 'Aspirant', 'Learner', 'Scholar', 'Expert', 'Master', 'Champion', 'Genius', 'Legend', 'NEET God'];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" /></div>;

  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const xpToNext = level * 500;
  const xpPct = Math.min((xp % xpToNext) / xpToNext * 100, 100);

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="font-heading font-bold text-2xl text-foreground">Profile</h2>
        <p className="text-muted-foreground text-sm">Manage your account and study settings</p>
      </div>

      {/* Avatar & level */}
      <div className="glass-card p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0">
          {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-heading font-bold text-foreground text-xl">{user?.full_name || 'Student'}</div>
          <div className="text-muted-foreground text-sm">{user?.email}</div>
          <div className="flex items-center gap-3 mt-2">
            <span className="badge-purple">⚡ Level {level} — {LEVEL_NAMES[Math.min(level - 1, 9)]}</span>
            <span className="text-muted-foreground text-xs">{xp.toLocaleString()} XP total</span>
          </div>
          <div className="xp-bar mt-2 max-w-xs">
            <div className="xp-fill" style={{ width: `${xpPct}%` }} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">{xp % xpToNext} / {xpToNext} XP to next level</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Study Streak', value: `${profile?.study_streak || 0}d`, icon: '🔥' },
          { label: 'MCQs Solved', value: (profile?.mcqs_solved || 0).toLocaleString(), icon: '✅' },
          { label: 'Total Hours', value: `${Math.round((profile?.total_study_hours || 0))}h`, icon: '⏱️' },
        ].map((s, i) => (
          <div key={i} className="stat-card text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-heading font-bold text-foreground text-lg">{s.value}</div>
            <div className="text-muted-foreground text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground text-base">Study Settings</h3>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Username</label>
          <input className="input-field" placeholder="Your display name" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Bio</label>
          <textarea className="input-field" rows={2} placeholder="A short bio..." value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Target Year</label>
            <select className="input-field" value={form.target_year} onChange={e => setForm(p => ({ ...p, target_year: Number(e.target.value) }))}>
              {[2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Target Score</label>
            <input type="number" min="1" max="720" className="input-field" value={form.target_score} onChange={e => setForm(p => ({ ...p, target_score: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Daily Goal (hrs)</label>
            <input type="number" min="1" max="16" className="input-field" value={form.daily_goal_hours} onChange={e => setForm(p => ({ ...p, daily_goal_hours: Number(e.target.value) }))} />
          </div>
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-primary w-full justify-center">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-heading font-semibold text-foreground text-base mb-4">Account</h3>
        <button onClick={() => db.auth.logout('/')} className="w-full py-3 rounded-2xl text-sm font-bold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
}