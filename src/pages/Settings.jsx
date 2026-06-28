import { db } from '@/lib/supabase/db';

import React, { useState, useEffect } from 'react';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ daily_goal_hours: 8, notifications_enabled: true });

  useEffect(() => {
    const load = async () => {
      const u = await db.auth.me();
      setUser(u);
      const profs = await db.entities.UserProfile.filter({ user_id: u.id });
      if (profs[0]) {
        setProfile(profs[0]);
        setForm({ daily_goal_hours: profs[0].daily_goal_hours || 8, notifications_enabled: profs[0].notifications_enabled !== false });
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    if (!profile) return;
    await db.entities.UserProfile.update(profile.id, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <div>
        <h2 className="font-heading font-bold text-2xl text-foreground">Settings</h2>
        <p className="text-muted-foreground text-sm">Customize your study experience</p>
      </div>

      <div className="glass-card p-6 space-y-5">
        <h3 className="font-heading font-semibold text-foreground">Study Preferences</h3>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Daily Study Goal (hours)</label>
          <input type="range" min="1" max="16" className="w-full accent-purple-500" value={form.daily_goal_hours} onChange={e => setForm(p => ({ ...p, daily_goal_hours: Number(e.target.value) }))} />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1h</span>
            <span className="font-bold text-purple-600">{form.daily_goal_hours} hours</span>
            <span>16h</span>
          </div>
        </div>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-foreground font-semibold">Enable Notifications</span>
          <div onClick={() => setForm(p => ({ ...p, notifications_enabled: !p.notifications_enabled }))}
            className={`w-12 h-6 rounded-full transition-all duration-300 relative cursor-pointer ${form.notifications_enabled ? 'bg-purple-500' : 'bg-gray-200'}`}>
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all duration-300 shadow ${form.notifications_enabled ? 'left-6' : 'left-0.5'}`} />
          </div>
        </label>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground">Account</h3>
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-purple-50 border border-purple-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
            {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">{user?.full_name || 'Student'}</div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
          </div>
        </div>
        <button onClick={() => db.auth.logout('/')} className="w-full py-3 rounded-2xl text-sm font-bold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">
          Sign Out
        </button>
      </div>

      <button onClick={save} className="btn-primary w-full justify-center">
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}