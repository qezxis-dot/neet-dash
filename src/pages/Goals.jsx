import { db } from '@/lib/supabase/db';

import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('active');
  const [form, setForm] = useState({ title: '', description: '', goal_type: 'daily', target_value: '', current_value: 0, unit: '', subject: '', deadline: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const u = await db.auth.me();
      setUser(u);
      const gs = await db.entities.Goal.filter({ user_id: u.id }, '-created_date');
      setGoals(gs);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = goals.filter(g => {
    if (filter === 'active') return !g.is_completed;
    if (filter === 'completed') return g.is_completed;
    return true;
  });

  const saveGoal = async () => {
    if (!form.title.trim() || !form.target_value) return;
    setSaving(true);
    const created = await db.entities.Goal.create({ ...form, target_value: Number(form.target_value), current_value: Number(form.current_value) || 0, user_id: user.id });
    setGoals(prev => [created, ...prev]);
    setShowForm(false);
    setForm({ title: '', description: '', goal_type: 'daily', target_value: '', current_value: 0, unit: '', subject: '', deadline: '' });
    setSaving(false);
  };

  const updateProgress = async (goal, delta) => {
    const newVal = Math.min(Math.max((goal.current_value || 0) + delta, 0), goal.target_value);
    const isCompleted = newVal >= goal.target_value;
    const updated = await db.entities.Goal.update(goal.id, { current_value: newVal, is_completed: isCompleted, completion_date: isCompleted ? new Date().toISOString().split('T')[0] : null });
    setGoals(prev => prev.map(g => g.id === goal.id ? updated : g));
  };

  const deleteGoal = async (g) => {
    if (!confirm('Delete this goal?')) return;
    await db.entities.Goal.delete(g.id);
    setGoals(prev => prev.filter(x => x.id !== g.id));
  };

  const TYPE_COLORS = { daily: 'badge-blue', weekly: 'badge-purple', monthly: 'badge-orange', target: 'badge-green' };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">Goals</h2>
          <p className="text-muted-foreground text-sm">{goals.filter(g => !g.is_completed).length} active • {goals.filter(g => g.is_completed).length} completed</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ New Goal</button>
      </div>

      <div className="flex gap-2">
        {[['active', 'Active 🎯'], ['completed', 'Completed ✅'], ['all', 'All']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${filter === k ? 'btn-primary' : 'btn-secondary'}`}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-muted-foreground mb-4">No goals here. Set a goal to stay on track!</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ New Goal</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((g, i) => {
            const pct = Math.min(((g.current_value || 0) / g.target_value) * 100, 100);
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={`glass-card p-5 ${g.is_completed ? 'border-emerald-200 bg-emerald-50/40' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-heading font-bold text-foreground text-sm">{g.title}</h3>
                      {g.is_completed && <span className="text-emerald-500 text-sm">✓</span>}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className={TYPE_COLORS[g.goal_type] || 'badge-purple'}>{g.goal_type}</span>
                      {g.subject && <span className="badge-blue">{g.subject}</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteGoal(g)} className="p-1.5 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors ml-2">🗑️</button>
                </div>

                {g.description && <p className="text-muted-foreground text-xs mb-3">{g.description}</p>}

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-semibold">Progress</span>
                    <span className="text-foreground font-bold">{g.current_value || 0} / {g.target_value} {g.unit}</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`h-full rounded-full transition-all duration-700 ${g.is_completed ? 'bg-emerald-400' : ''}`}
                      style={{ width: `${pct}%`, background: g.is_completed ? undefined : 'linear-gradient(90deg, #a78bfa, #6366f1)' }} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{Math.round(pct)}% complete</div>
                </div>

                {!g.is_completed && (
                  <div className="flex gap-2">
                    <button onClick={() => updateProgress(g, -1)} className="flex-1 py-1.5 rounded-xl text-xs font-bold btn-secondary">−1</button>
                    <button onClick={() => updateProgress(g, 1)} className="flex-1 py-1.5 rounded-xl text-xs font-bold btn-primary justify-center">+1</button>
                    <button onClick={() => updateProgress(g, g.target_value - (g.current_value || 0))} className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-colors">Done</button>
                  </div>
                )}

                {g.deadline && <div className="text-xs text-muted-foreground mt-2">📅 Deadline: {g.deadline}</div>}
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal-card" onClick={e => e.stopPropagation()}>
              <h3 className="font-heading font-bold text-foreground text-lg mb-5">New Goal</h3>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Goal Title *</label>
                  <input className="input-field" placeholder="e.g. Solve 50 MCQs today" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Type</label>
                    <select className="input-field" value={form.goal_type} onChange={e => setForm(p => ({ ...p, goal_type: e.target.value }))}>
                      {['daily', 'weekly', 'monthly', 'target'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Subject</label>
                    <select className="input-field" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
                      <option value="">All Subjects</option>
                      {['Physics', 'Chemistry', 'Biology'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Target Value *</label>
                    <input type="number" className="input-field" placeholder="e.g. 50" value={form.target_value} onChange={e => setForm(p => ({ ...p, target_value: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Unit</label>
                    <input className="input-field" placeholder="e.g. MCQs, hours, pages" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Deadline (optional)</label>
                  <input type="date" className="input-field" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Description</label>
                  <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveGoal} disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving...' : 'Create Goal'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}