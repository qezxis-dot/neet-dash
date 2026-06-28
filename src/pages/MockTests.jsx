import { db } from '@/lib/supabase/db';

import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function MockTests() {
  const [tests, setTests] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    test_name: '', date: new Date().toISOString().split('T')[0],
    physics_correct: 0, physics_wrong: 0, chemistry_correct: 0, chemistry_wrong: 0,
    biology_correct: 0, biology_wrong: 0, time_taken: 180, notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const u = await db.auth.me();
      setUser(u);
      const ts = await db.entities.MockTest.filter({ user_id: u.id }, '-date');
      setTests(ts);
      setLoading(false);
    };
    load();
  }, []);

  const calcMarks = () => {
    const correct = parseInt(form.physics_correct) + parseInt(form.chemistry_correct) + parseInt(form.biology_correct);
    const wrong = parseInt(form.physics_wrong) + parseInt(form.chemistry_wrong) + parseInt(form.biology_wrong);
    const marks = correct * 4 - wrong * 1;
    const attempted = correct + wrong;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const physicsMarks = parseInt(form.physics_correct) * 4 - parseInt(form.physics_wrong);
    const chemistryMarks = parseInt(form.chemistry_correct) * 4 - parseInt(form.chemistry_wrong);
    const biologyMarks = parseInt(form.biology_correct) * 4 - parseInt(form.biology_wrong);
    return { marks, accuracy, physicsMarks, chemistryMarks, biologyMarks };
  };

  const saveTest = async () => {
    setSaving(true);
    const calc = calcMarks();
    try {
      const data = {
        ...form,
        physics_marks: calc.physicsMarks, chemistry_marks: calc.chemistryMarks, biology_marks: calc.biologyMarks,
        total_marks: calc.marks, max_marks: 720, accuracy: calc.accuracy, user_id: user.id,
        physics_correct: parseInt(form.physics_correct), physics_wrong: parseInt(form.physics_wrong),
        chemistry_correct: parseInt(form.chemistry_correct), chemistry_wrong: parseInt(form.chemistry_wrong),
        biology_correct: parseInt(form.biology_correct), biology_wrong: parseInt(form.biology_wrong),
      };
      const created = await db.entities.MockTest.create(data);
      setTests(prev => [created, ...prev]);
      setShowForm(false);
      setForm({ test_name: '', date: new Date().toISOString().split('T')[0], physics_correct: 0, physics_wrong: 0, chemistry_correct: 0, chemistry_wrong: 0, biology_correct: 0, biology_wrong: 0, time_taken: 180, notes: '' });
    } finally {
      setSaving(false);
    }
  };

  const deleteTest = async (t) => {
    if (!confirm('Delete this test?')) return;
    await db.entities.MockTest.delete(t.id);
    setTests(prev => prev.filter(x => x.id !== t.id));
  };

  // Analytics
  const avg = (arr, key) => arr.length > 0 ? Math.round(arr.reduce((s, t) => s + (t[key] || 0), 0) / arr.length) : 0;
  const bestScore = tests.length > 0 ? Math.max(...tests.map(t => t.total_marks || 0)) : 0;
  const avgScore = avg(tests, 'total_marks');
  const avgAccuracy = avg(tests, 'accuracy');

  const trendData = tests.slice(0, 10).reverse().map((t, i) => ({
    name: `T${i + 1}`, score: t.total_marks || 0, accuracy: t.accuracy || 0,
    physics: t.physics_marks || 0, chemistry: t.chemistry_marks || 0, biology: t.biology_marks || 0,
  }));

  const weakSubject = (() => {
    if (tests.length === 0) return null;
    const subjects = {
      Physics: avg(tests, 'physics_marks'),
      Chemistry: avg(tests, 'chemistry_marks'),
      Biology: avg(tests, 'biology_marks'),
    };
    return Object.entries(subjects).sort(([,a], [,b]) => a - b)[0];
  })();

  const preview = calcMarks();

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-white">Mock Tests</h2>
          <p className="text-white/40 text-sm">{tests.length} tests recorded</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Add Test</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tests Taken', value: tests.length, icon: '📊', color: 'text-purple-400' },
          { label: 'Best Score', value: `${bestScore}/720`, icon: '🏆', color: 'text-yellow-400' },
          { label: 'Average Score', value: avgScore, icon: '📈', color: 'text-blue-400' },
          { label: 'Avg Accuracy', value: `${avgAccuracy}%`, icon: '🎯', color: 'text-emerald-400' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="text-xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-heading font-bold ${s.color}`}>{s.value}</div>
            <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weak subject */}
      {weakSubject && (
        <div className="glass-card rounded-xl px-5 py-4 border border-red-500/20 bg-red-500/5 flex items-center gap-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-semibold text-white text-sm">Weak Subject Detected</div>
            <p className="text-white/50 text-xs">Your average in <span className="text-red-400 font-medium">{weakSubject[0]}</span> is {weakSubject[1]} marks. Focus here to boost your overall score.</p>
          </div>
        </div>
      )}

      {/* Charts */}
      {trendData.length > 1 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="chart-container">
            <h3 className="font-heading font-semibold text-white mb-4">Score Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                <YAxis domain={[0, 720]} stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                <Tooltip contentStyle={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '12px' }} />
                <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4, fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-container">
            <h3 className="font-heading font-semibold text-white mb-4">Subject Breakdown</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trendData}>
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                <Tooltip contentStyle={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }} />
                <Bar dataKey="physics" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="chemistry" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="biology" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Test list */}
      <div className="space-y-3">
        {tests.length === 0 ? (
          <div className="glass-card rounded-2xl py-20 text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-white/40 mb-4">No tests recorded yet. Add your first mock test!</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Add Test</button>
          </div>
        ) : tests.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="glass-card rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-heading font-semibold text-white">{t.test_name || `Test ${tests.length - i}`}</h3>
                  <span className="text-xs text-white/30">{t.date}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Physics', value: t.physics_marks || 0, max: 180, color: 'bg-blue-500' },
                    { label: 'Chemistry', value: t.chemistry_marks || 0, max: 180, color: 'bg-emerald-500' },
                    { label: 'Biology', value: t.biology_marks || 0, max: 360, color: 'bg-orange-500' },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/40">{s.label}</span>
                        <span className="text-white/70">{s.value}</span>
                      </div>
                      <div className="progress-bar">
                        <div className={`h-full rounded-full ${s.color}`} style={{ width: `${Math.max(0, (s.value / s.max) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-center">
                  <div className="font-heading font-bold text-2xl text-white">{t.total_marks || 0}</div>
                  <div className="text-xs text-white/30">/ 720</div>
                </div>
                <div className="text-center">
                  <div className={`font-heading font-bold text-lg ${t.accuracy >= 70 ? 'text-emerald-400' : t.accuracy >= 50 ? 'text-orange-400' : 'text-red-400'}`}>{t.accuracy || 0}%</div>
                  <div className="text-xs text-white/30">Accuracy</div>
                </div>
                <button onClick={() => deleteTest(t)} className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors">🗑️</button>
              </div>
            </div>
            {t.notes && <p className="text-white/30 text-xs mt-3 pt-3 border-t border-white/5">{t.notes}</p>}
          </motion.div>
        ))}
      </div>

      {/* Add Test Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal-card max-w-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-heading font-bold text-white text-lg mb-5">Record Mock Test</h3>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">Test Name</label>
                    <input className="input-field" placeholder="e.g. Allen Major Test 5" value={form.test_name} onChange={e => setForm(p => ({ ...p, test_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5">Date</label>
                    <input type="date" className="input-field" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                  </div>
                </div>

                {/* Subject inputs */}
                {[
                  { key: 'physics', label: 'Physics', icon: '⚛️', color: 'text-blue-400' },
                  { key: 'chemistry', label: 'Chemistry', icon: '⚗️', color: 'text-emerald-400' },
                  { key: 'biology', label: 'Biology', icon: '🧬', color: 'text-orange-400' },
                ].map(s => (
                  <div key={s.key} className="glass rounded-xl p-4 border border-white/5">
                    <div className={`font-medium text-sm mb-3 ${s.color}`}>{s.icon} {s.label}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Correct</label>
                        <input type="number" min="0" max="50" className="input-field" value={form[`${s.key}_correct`]} onChange={e => setForm(p => ({ ...p, [`${s.key}_correct`]: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-1">Wrong</label>
                        <input type="number" min="0" max="50" className="input-field" value={form[`${s.key}_wrong`]} onChange={e => setForm(p => ({ ...p, [`${s.key}_wrong`]: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Live preview */}
                <div className="glass rounded-xl p-4 border border-purple-500/20 bg-purple-500/5">
                  <div className="text-xs text-white/40 mb-2">Live Preview</div>
                  <div className="flex gap-6">
                    <div><span className="text-2xl font-heading font-bold text-white">{preview.marks}</span><span className="text-white/30 text-sm">/720</span></div>
                    <div><span className="text-lg font-heading font-bold text-emerald-400">{preview.accuracy}%</span><div className="text-xs text-white/30">Accuracy</div></div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Time Taken (minutes)</label>
                  <input type="number" className="input-field" value={form.time_taken} onChange={e => setForm(p => ({ ...p, time_taken: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Notes / Observations</label>
                  <textarea className="input-field" rows={2} placeholder="What went well? What to improve?" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveTest} disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? 'Saving...' : 'Save Test'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}