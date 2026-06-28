import { db } from '@/lib/supabase/db';

import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

const SUBJECT_CONFIG = [
  {
    name: 'Physics', icon: '⚛️',
    color: 'from-blue-500 to-cyan-500', clay: 'clay-blue',
    bg: 'rgba(110,168,243,0.12)', border: 'rgba(110,168,243,0.25)',
    chapters: [
      'Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane',
      'Laws of Motion', 'Work Energy and Power', 'System of Particles and Rotational Motion',
      'Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids',
      'Thermal Properties of Matter', 'Thermodynamics', 'Kinetic Theory', 'Oscillations',
      'Waves', 'Electric Charges and Fields', 'Electrostatic Potential and Capacitance',
      'Current Electricity', 'Moving Charges and Magnetism', 'Magnetism and Matter',
      'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves',
      'Ray Optics', 'Wave Optics', 'Dual Nature of Radiation and Matter',
      'Atoms', 'Nuclei', 'Semiconductor Electronics',
    ],
  },
  {
    name: 'Chemistry', icon: '⚗️',
    color: 'from-emerald-500 to-teal-500', clay: 'clay-green',
    bg: 'rgba(110,231,160,0.12)', border: 'rgba(110,231,160,0.25)',
    chapters: [
      'Some Basic Concepts of Chemistry', 'Structure of Atom', 'Classification of Elements',
      'Chemical Bonding', 'States of Matter', 'Thermodynamics', 'Equilibrium',
      'Redox Reactions', 'Hydrogen', 's-Block Elements', 'Organic Chemistry Basics',
      'Hydrocarbons', 'Environmental Chemistry', 'Solid State', 'Solutions',
      'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry',
      'General Principles of Metallurgy', 'p-Block Elements', 'd and f Block Elements',
      'Coordination Compounds', 'Haloalkanes and Haloarenes', 'Alcohols Phenols and Ethers',
      'Aldehydes Ketones and Carboxylic Acids', 'Amines', 'Biomolecules',
      'Polymers', 'Chemistry in Everyday Life',
    ],
  },
  {
    name: 'Biology', icon: '🧬',
    color: 'from-orange-500 to-amber-500', clay: 'clay-orange',
    bg: 'rgba(243,149,110,0.12)', border: 'rgba(243,149,110,0.25)',
    chapters: [
      'Living World', 'Biological Classification', 'Plant Kingdom', 'Animal Kingdom',
      'Morphology of Flowering Plants', 'Anatomy of Flowering Plants',
      'Structural Organisation in Animals', 'Cell: The Unit of Life', 'Biomolecules',
      'Cell Cycle and Cell Division', 'Transport in Plants', 'Mineral Nutrition',
      'Photosynthesis', 'Respiration in Plants', 'Plant Growth and Development',
      'Digestion and Absorption', 'Breathing and Exchange of Gases',
      'Body Fluids and Circulation', 'Excretory Products and Elimination',
      'Locomotion and Movement', 'Neural Control and Coordination',
      'Chemical Coordination and Integration', 'Reproduction in Organisms',
      'Sexual Reproduction in Flowering Plants', 'Human Reproduction',
      'Reproductive Health', 'Principles of Inheritance and Variation',
      'Molecular Basis of Inheritance', 'Evolution', 'Human Health and Disease',
      'Strategies for Enhancement in Food Production', 'Microbes in Human Welfare',
      'Biotechnology: Principles and Processes', 'Biotechnology and its Applications',
      'Organisms and Populations', 'Ecosystem', 'Biodiversity and Conservation',
      'Environmental Issues',
    ],
  },
];

const DIFFICULTY_COLORS = {
  Easy: 'badge-green', Medium: 'badge-orange', Hard: 'badge-red',
};

const STATUS_LABELS = {
  not_started: { label: 'Not Started', color: 'text-muted-foreground' },
  in_progress: { label: 'In Progress', color: 'text-blue-400' },
  completed: { label: 'Completed', color: 'text-emerald-400' },
  needs_revision: { label: 'Needs Revision', color: 'text-orange-400' },
};

export default function Subjects() {
  const [activeSubject, setActiveSubject] = useState('Physics');
  const [chapters, setChapters] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [editChapter, setEditChapter] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', difficulty: 'Medium' });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const activeConfig = SUBJECT_CONFIG.find(s => s.name === activeSubject);

  useEffect(() => {
    const load = async () => {
      const u = await db.auth.me();
      setUser(u);
      const chs = await db.entities.Chapter.filter({ user_id: u.id });
      setChapters(chs);
      setLoading(false);
    };
    load();
  }, []);

  // Auto-seed chapters if user has none
  useEffect(() => {
    if (!loading && user && chapters.length === 0) {
      seedAllChapters();
    }
  }, [loading, user, chapters.length]);

  const seedAllChapters = async () => {
    if (seeding) return;
    setSeeding(true);
    const toCreate = [];
    SUBJECT_CONFIG.forEach(subj => {
      subj.chapters.forEach((name, idx) => {
        toCreate.push({ name, subject: subj.name, user_id: user.id, completion: 0, order: idx, difficulty: 'Medium' });
      });
    });
    const created = await db.entities.Chapter.bulkCreate(toCreate);
    setChapters(created);
    setSeeding(false);
  };

  const filtered = chapters.filter(c => {
    if (c.subject !== activeSubject) return false;
    if (filter === 'weak') return c.is_weak;
    if (filter === 'completed') return c.completion === 100;
    if (filter === 'pending') return c.completion > 0 && c.completion < 100;
    return true;
  }).sort((a, b) => (a.order || 0) - (b.order || 0));

  const subjectChapters = chapters.filter(c => c.subject === activeSubject);
  const completedCount = subjectChapters.filter(c => c.completion === 100).length;
  const avgCompletion = subjectChapters.length > 0
    ? Math.round(subjectChapters.reduce((a, c) => a + (c.completion || 0), 0) / subjectChapters.length)
    : 0;

  const saveChapter = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editChapter) {
        const updated = await db.entities.Chapter.update(editChapter.id, { ...form });
        setChapters(prev => prev.map(c => c.id === editChapter.id ? updated : c));
      } else {
        const created = await db.entities.Chapter.create({ ...form, subject: activeSubject, user_id: user.id, completion: 0, order: subjectChapters.length });
        setChapters(prev => [...prev, created]);
      }
      setShowAddChapter(false);
      setEditChapter(null);
      setForm({ name: '', description: '', difficulty: 'Medium' });
    } finally {
      setSaving(false);
    }
  };

  const updateCompletion = async (ch, val) => {
    const updated = await db.entities.Chapter.update(ch.id, { completion: val, revision_status: val === 100 ? 'completed' : val > 0 ? 'in_progress' : 'not_started' });
    setChapters(prev => prev.map(c => c.id === ch.id ? updated : c));
    if (val === 100) {
      const intervals = [1, 3, 7, 15, 30, 60];
      const today = new Date();
      for (let i = 0; i < intervals.length; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + intervals[i]);
        await db.entities.RevisionTask.create({
          chapter_id: ch.id, chapter_name: ch.name, subject: ch.subject,
          revision_number: i + 1, scheduled_date: d.toISOString().split('T')[0],
          interval_days: intervals[i], user_id: user.id, status: 'pending',
        });
      }
    }
  };

  const deleteChapter = async (ch) => {
    if (!confirm(`Delete "${ch.name}"?`)) return;
    await db.entities.Chapter.delete(ch.id);
    setChapters(prev => prev.filter(c => c.id !== ch.id));
  };

  const toggleWeak = async (ch) => {
    const updated = await db.entities.Chapter.update(ch.id, { is_weak: !ch.is_weak });
    setChapters(prev => prev.map(c => c.id === ch.id ? updated : c));
  };

  if (loading || seeding) return (
    <div className="flex items-center justify-center h-64 flex-col gap-3">
      <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      {seeding && <p className="text-muted-foreground text-sm">Setting up your chapters...</p>}
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Subject tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-3 flex-wrap">
          {SUBJECT_CONFIG.map(s => (
            <button key={s.name} onClick={() => setActiveSubject(s.name)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-medium text-sm transition-all ${
                activeSubject === s.name
                  ? `${s.clay} text-white`
                  : 'glass-card text-muted-foreground hover:text-foreground'
              }`}>
              <span className="text-lg">{s.icon}</span>
              <div className="text-left">
                <div>{s.name}</div>
                <div className="text-[10px] opacity-70">{chapters.filter(c => c.subject === s.name).length} chapters</div>
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => { setShowAddChapter(true); setEditChapter(null); setForm({ name: '', description: '', difficulty: 'Medium' }); }}
          className="btn-primary text-sm">
          + Add Chapter
        </button>
      </div>

      {/* Subject stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Chapters', value: subjectChapters.length, icon: '📚' },
          { label: 'Completed', value: completedCount, icon: '✅' },
          { label: 'Avg Progress', value: `${avgCompletion}%`, icon: '📊' },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-heading font-bold text-foreground text-xl">{s.value}</div>
            <div className="text-muted-foreground text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex justify-between text-sm mb-3">
          <span className="font-semibold text-foreground">{activeSubject} Progress</span>
          <span className="text-muted-foreground">{completedCount}/{subjectChapters.length} complete</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${avgCompletion}%` }} />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{avgCompletion}% average completion</div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { val: 'all', label: 'All Chapters' },
          { val: 'completed', label: '✅ Completed' },
          { val: 'pending', label: '⏳ In Progress' },
          { val: 'weak', label: '⚠️ Weak' },
        ].map(f => (
          <button key={f.val} onClick={() => setFilter(f.val)}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filter === f.val
                ? 'text-white'
                : 'glass-card text-muted-foreground hover:text-foreground'
            }`}
            style={filter === f.val ? { background: 'rgba(155,110,243,0.25)', border: '1.5px solid rgba(155,110,243,0.4)', color: '#C4A8FF' } : {}}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Chapters list */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-3xl py-20 text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-muted-foreground mb-4">No chapters found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ch, i) => (
            <motion.div key={ch.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="glass-card rounded-2xl p-5 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="text-muted-foreground text-xs font-mono w-6">{i + 1}.</span>
                    <h3 className="font-heading font-semibold text-foreground">{ch.name}</h3>
                    {ch.is_weak && <span className="badge-red text-[10px]">⚠️ Weak</span>}
                    {ch.difficulty && <span className={DIFFICULTY_COLORS[ch.difficulty] || 'badge-blue'} style={{ fontSize: '10px' }}>{ch.difficulty}</span>}
                    {ch.completion === 100 && <span className="badge-green text-[10px]">✅ Done</span>}
                  </div>
                  {ch.description && <p className="text-muted-foreground text-xs mb-2 ml-9">{ch.description}</p>}
                  <div className="flex items-center gap-4 ml-9">
                    <div className="flex-1 max-w-xs">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className={STATUS_LABELS[ch.revision_status]?.color || 'text-muted-foreground'}>{ch.completion || 0}%</span>
                      </div>
                      <input type="range" min="0" max="100" step="5" value={ch.completion || 0}
                        onChange={e => updateCompletion(ch, parseInt(e.target.value))}
                        className="w-full h-1.5 rounded-full cursor-pointer"
                        style={{ accentColor: '#9B6EF3' }} />
                    </div>
                    <span className={`text-xs ${STATUS_LABELS[ch.revision_status]?.color}`}>
                      {STATUS_LABELS[ch.revision_status]?.label || 'Not Started'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleWeak(ch)}
                    className={`p-2 rounded-xl text-sm transition-all ${ch.is_weak ? 'text-orange-400' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                    style={ch.is_weak ? { background: 'rgba(243,149,110,0.15)', border: '1.5px solid rgba(243,149,110,0.25)' } : {}}
                    title="Mark as weak">⚠️</button>
                  <button onClick={() => { setEditChapter(ch); setForm({ name: ch.name, description: ch.description || '', difficulty: ch.difficulty || 'Medium' }); setShowAddChapter(true); }}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all" title="Edit">✏️</button>
                  <button onClick={() => deleteChapter(ch)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-red-400 transition-all" style={{ ':hover': { background: 'rgba(243,110,110,0.1)' } }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(243,110,110,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    title="Delete">🗑️</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Chapter Modal */}
      <AnimatePresence>
        {showAddChapter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowAddChapter(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal-card" onClick={e => e.stopPropagation()}>
              <h3 className="font-heading font-bold text-foreground text-lg mb-5">{editChapter ? 'Edit Chapter' : `Add Chapter to ${activeSubject}`}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Chapter Name *</label>
                  <input className="input-field" placeholder="e.g. Laws of Motion" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Description (optional)</label>
                  <textarea className="input-field" rows={2} placeholder="Brief description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Difficulty</label>
                  <div className="flex gap-2">
                    {['Easy', 'Medium', 'Hard'].map(d => (
                      <button key={d} onClick={() => setForm(p => ({ ...p, difficulty: d }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${form.difficulty === d ? 'text-white' : 'glass-card text-muted-foreground'}`}
                        style={form.difficulty === d ? { background: 'rgba(155,110,243,0.3)', border: '1.5px solid rgba(155,110,243,0.45)' } : {}}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddChapter(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveChapter} disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? 'Saving...' : editChapter ? 'Update' : 'Add Chapter'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}