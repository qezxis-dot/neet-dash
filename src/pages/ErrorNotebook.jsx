import { db } from '@/lib/supabase/db';

import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

const ERROR_TYPES = {
  concept_error: { label: 'Concept Error', color: 'badge-red', emoji: '🧠' },
  formula_error: { label: 'Formula Error', color: 'badge-orange', emoji: '⚗️' },
  calculation_error: { label: 'Calculation', color: 'badge-blue', emoji: '🔢' },
  guess: { label: 'Guessed', color: 'badge-purple', emoji: '🎲' },
  silly_mistake: { label: 'Silly Mistake', color: 'badge-green', emoji: '😅' },
  time_management: { label: 'Time Issue', color: 'badge-orange', emoji: '⏰' },
};

export default function ErrorNotebook() {
  const [errors, setErrors] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [revisedFilter, setRevisedFilter] = useState('all');
  const [form, setForm] = useState({ question: '', topic: '', subject: 'Physics', chapter: '', error_type: 'concept_error', reason: '', correct_answer: '', my_answer: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const u = await db.auth.me();
      setUser(u);
      const es = await db.entities.ErrorNote.filter({ user_id: u.id }, '-created_date');
      setErrors(es);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = errors.filter(e => {
    if (subjectFilter !== 'All' && e.subject !== subjectFilter) return false;
    if (revisedFilter === 'pending' && e.is_revised) return false;
    if (revisedFilter === 'revised' && !e.is_revised) return false;
    return true;
  });

  const saveError = async () => {
    if (!form.question.trim()) return;
    setSaving(true);
    const created = await db.entities.ErrorNote.create({ ...form, user_id: user.id });
    setErrors(prev => [created, ...prev]);
    setShowForm(false);
    setForm({ question: '', topic: '', subject: 'Physics', chapter: '', error_type: 'concept_error', reason: '', correct_answer: '', my_answer: '' });
    setSaving(false);
  };

  const markRevised = async (e) => {
    const updated = await db.entities.ErrorNote.update(e.id, { is_revised: !e.is_revised, revision_count: (e.revision_count || 0) + (e.is_revised ? 0 : 1) });
    setErrors(prev => prev.map(x => x.id === e.id ? updated : x));
  };

  const deleteError = async (e) => {
    if (!confirm('Delete this error note?')) return;
    await db.entities.ErrorNote.delete(e.id);
    setErrors(prev => prev.filter(x => x.id !== e.id));
  };

  const stats = {
    total: errors.length,
    revised: errors.filter(e => e.is_revised).length,
    bySubject: { Physics: errors.filter(e => e.subject === 'Physics').length, Chemistry: errors.filter(e => e.subject === 'Chemistry').length, Biology: errors.filter(e => e.subject === 'Biology').length },
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">Error Notebook</h2>
          <p className="text-muted-foreground text-sm">{stats.total} errors logged • {stats.revised} revised</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Log Error</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Errors', value: stats.total, color: 'text-red-500' },
          { label: 'Revised', value: stats.revised, color: 'text-emerald-600' },
          { label: 'Pending', value: stats.total - stats.revised, color: 'text-orange-500' },
          { label: 'Accuracy Need', value: `${stats.total > 0 ? Math.round((stats.revised / stats.total) * 100) : 0}%`, color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`text-2xl font-heading font-bold ${s.color}`}>{s.value}</div>
            <div className="text-muted-foreground text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {['All', 'Physics', 'Chemistry', 'Biology'].map(s => (
          <button key={s} onClick={() => setSubjectFilter(s)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${subjectFilter === s ? 'btn-primary' : 'btn-secondary'}`}>
            {s}
          </button>
        ))}
        <div className="flex gap-2 ml-auto">
          {[['all', 'All'], ['pending', 'Pending'], ['revised', 'Revised']].map(([k, l]) => (
            <button key={k} onClick={() => setRevisedFilter(k)}
              className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all ${revisedFilter === k ? 'btn-primary' : 'btn-secondary'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <div className="text-4xl mb-3">🧠</div>
          <p className="text-muted-foreground">No errors logged yet — or none match your filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e, i) => {
            const et = ERROR_TYPES[e.error_type] || ERROR_TYPES.concept_error;
            return (
              <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`glass-card p-5 border-l-4 ${e.is_revised ? 'border-l-emerald-400' : 'border-l-red-400'}`}>
                <div className="flex items-start gap-4">
                  <div className="text-2xl flex-shrink-0">{et.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={et.color}>{et.label}</span>
                      <span className="badge-blue">{e.subject}</span>
                      {e.chapter && <span className="text-muted-foreground text-xs">{e.chapter}</span>}
                      {e.is_revised && <span className="badge-green">✓ Revised {e.revision_count}x</span>}
                    </div>
                    <p className="text-foreground text-sm font-medium mb-2">{e.question}</p>
                    {e.reason && <p className="text-muted-foreground text-xs mb-1"><span className="font-semibold text-foreground/70">Why wrong:</span> {e.reason}</p>}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {e.my_answer && <span>My ans: <span className="text-red-500 font-semibold">{e.my_answer}</span></span>}
                      {e.correct_answer && <span>Correct: <span className="text-emerald-600 font-semibold">{e.correct_answer}</span></span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => markRevised(e)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${e.is_revised ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100'}`}>
                      {e.is_revised ? '✓ Done' : 'Mark Done'}
                    </button>
                    <button onClick={() => deleteError(e)} className="p-1.5 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">🗑️</button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal-card max-w-xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-heading font-bold text-foreground text-lg mb-5">Log an Error</h3>
              <div className="space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin pr-1">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Question / Topic *</label>
                  <textarea className="input-field" rows={2} placeholder="Describe the question or concept you got wrong..." value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Subject</label>
                    <select className="input-field" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
                      {['Physics', 'Chemistry', 'Biology'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Chapter</label>
                    <input className="input-field" placeholder="Chapter name" value={form.chapter} onChange={e => setForm(p => ({ ...p, chapter: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Error Type</label>
                  <select className="input-field" value={form.error_type} onChange={e => setForm(p => ({ ...p, error_type: e.target.value }))}>
                    {Object.entries(ERROR_TYPES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Why did you get it wrong?</label>
                  <textarea className="input-field" rows={2} placeholder="Explain your mistake..." value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">My Answer</label>
                    <input className="input-field" placeholder="What I answered" value={form.my_answer} onChange={e => setForm(p => ({ ...p, my_answer: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Correct Answer</label>
                    <input className="input-field" placeholder="Correct answer" value={form.correct_answer} onChange={e => setForm(p => ({ ...p, correct_answer: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveError} disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving...' : 'Log Error'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}