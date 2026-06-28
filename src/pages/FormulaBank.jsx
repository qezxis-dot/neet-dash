import { db } from '@/lib/supabase/db';

import React, { useState, useEffect, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

const SUBJECTS = ['All', 'Physics', 'Chemistry', 'Biology'];

export default function FormulaBank() {
  const [formulas, setFormulas] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('All');
  const [chapterFilter, setChapterFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editFormula, setEditFormula] = useState(null);
  const [form, setForm] = useState({ title: '', formula_text: '', latex: '', description: '', subject: 'Physics', chapter: '', is_important: false });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    // Load KaTeX
    if (!document.getElementById('katex-css')) {
      const link = document.createElement('link');
      link.id = 'katex-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      document.head.appendChild(link);
    }
    if (!window.katex) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const u = await db.auth.me();
      setUser(u);
      const [fs, bs] = await Promise.all([
        db.entities.Formula.list('-created_date', 500),
        db.entities.Bookmark.filter({ user_id: u.id, item_type: 'formula' }),
      ]);
      setFormulas(fs);
      setBookmarks(bs);
      setLoading(false);
    };
    load();
  }, []);

  // Get unique chapters for the active subject
  const chapters = subject !== 'All'
    ? ['All', ...new Set(formulas.filter(f => f.subject === subject && f.chapter).map(f => f.chapter))]
    : [];

  const filtered = formulas.filter(f => {
    if (subject !== 'All' && f.subject !== subject) return false;
    if (subject !== 'All' && chapterFilter !== 'All' && f.chapter !== chapterFilter) return false;
    if (search && !f.title.toLowerCase().includes(search.toLowerCase()) && !f.formula_text?.toLowerCase().includes(search.toLowerCase()) && !f.chapter?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const isBookmarked = (id) => bookmarks.some(b => b.item_id === id);

  const toggleBookmark = async (f) => {
    const existing = bookmarks.find(b => b.item_id === f.id);
    if (existing) {
      await db.entities.Bookmark.delete(existing.id);
      setBookmarks(prev => prev.filter(b => b.id !== existing.id));
    } else {
      const b = await db.entities.Bookmark.create({ item_type: 'formula', item_id: f.id, item_title: f.title, subject: f.subject, user_id: user.id });
      setBookmarks(prev => [...prev, b]);
    }
  };

  const copyFormula = (f) => {
    navigator.clipboard.writeText(f.formula_text || f.latex || f.title);
    setCopied(f.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const renderFormula = (f) => {
    if (f.latex && window.katex) {
      try {
        return window.katex.renderToString(f.latex, { throwOnError: false, displayMode: true });
      } catch {}
    }
    return null;
  };

  const saveFormula = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editFormula) {
        const updated = await db.entities.Formula.update(editFormula.id, { ...form, created_by: user.id, user_id: user.id });
        setFormulas(prev => prev.map(f => f.id === editFormula.id ? updated : f));
      } else {
        const created = await db.entities.Formula.create({ ...form, created_by: user.id, user_id: user.id });
        setFormulas(prev => [...prev, created]);
      }
      setShowForm(false);
      setEditFormula(null);
      setForm({ title: '', formula_text: '', latex: '', description: '', subject: 'Physics', chapter: '', is_important: false });
    } finally {
      setSaving(false);
    }
  };

  const deleteFormula = async (f) => {
    if (!confirm(`Delete "${f.title}"?`)) return;
    await db.entities.Formula.delete(f.id);
    setFormulas(prev => prev.filter(x => x.id !== f.id));
  };

  const printFormula = (f) => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>${f.title}</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"></head><body style="font-family:sans-serif;padding:40px;max-width:600px;margin:auto"><h1>${f.title}</h1><p>${f.description || ''}</p><div style="font-size:1.5em;text-align:center;padding:20px;background:#f5f5f5;border-radius:8px">${f.formula_text || f.latex || ''}</div><p>Chapter: ${f.chapter || ''} | Subject: ${f.subject}</p></body></html>`);
    win.document.close();
    win.print();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /><span className="ml-3 text-muted-foreground text-sm">Loading formulas...</span></div>;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">Formula Bank</h2>
          <p className="text-muted-foreground text-sm">{formulas.length} formulas • {bookmarks.length} bookmarked</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditFormula(null); setForm({ title: '', formula_text: '', latex: '', description: '', subject: 'Physics', chapter: '', is_important: false }); }}
          className="btn-primary text-sm">
          + Add Formula
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
          <input type="text" placeholder="Search formulas, chapters..." className="input-field pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {SUBJECTS.map(s => (
            <button key={s} onClick={() => { setSubject(s); setChapterFilter('All'); }}
              className="px-4 py-2 rounded-2xl text-xs font-medium transition-all"
              style={subject === s
                ? { background: 'rgba(155,110,243,0.25)', border: '1.5px solid rgba(155,110,243,0.4)', color: '#C4A8FF' }
                : { background: 'hsl(230 14% 14%)', border: '1.5px solid rgba(255,255,255,0.06)', color: 'hsl(230 10% 55%)' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Chapter sub-filter */}
      {chapters.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {chapters.map(ch => (
            <button key={ch} onClick={() => setChapterFilter(ch)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all`}
              style={chapterFilter === ch
                ? { background: 'rgba(110,168,243,0.2)', border: '1.5px solid rgba(110,168,243,0.35)', color: '#A8CCFF' }
                : { background: 'hsl(230 14% 14%)', border: '1.5px solid rgba(255,255,255,0.05)', color: 'hsl(230 10% 55%)' }}>
              {ch}
            </button>
          ))}
        </div>
      )}

      {/* Bookmarked section */}
      {bookmarks.length > 0 && subject === 'All' && !search && (
        <div>
          <h3 className="font-heading font-semibold text-muted-foreground text-sm mb-3 flex items-center gap-2">
            🔖 Bookmarked <span className="badge-purple">{bookmarks.length}</span>
          </h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {bookmarks.map(b => {
              const f = formulas.find(x => x.id === b.item_id);
              if (!f) return null;
              return (
                <div key={b.id} className="flex-shrink-0 glass-card rounded-2xl px-4 py-3 min-w-[160px]">
                  <div className="text-xs font-medium text-foreground truncate">{f.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{f.subject}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Formula grid */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-3xl py-20 text-center">
          <div className="text-4xl mb-3">⚗️</div>
          <p className="text-muted-foreground mb-3">No formulas found. Try a different filter or add one!</p>
          <p className="text-muted-foreground text-xs">Tip: Ask your admin to seed formulas using the Admin Panel 🛡️</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((f, i) => {
            const renderedLatex = renderFormula(f);
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="glass-card rounded-2xl p-5 transition-all"
                style={f.is_important ? { borderColor: 'rgba(243,213,110,0.2)' } : {}}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading font-semibold text-foreground text-sm">{f.title}</h3>
                      {f.is_important && <span className="badge-orange text-[10px]">★ Important</span>}
                      {f.is_pinned && <span className="text-yellow-400 text-xs">📌</span>}
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="tag">{f.subject}</span>
                      {f.chapter && <span className="text-muted-foreground text-xs">{f.chapter}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button onClick={() => toggleBookmark(f)} className={`p-1.5 rounded-lg transition-colors ${isBookmarked(f.id) ? 'text-yellow-400 bg-yellow-400/10' : 'text-white/25 hover:text-yellow-400 hover:bg-yellow-400/10'}`} title="Bookmark">
                      🔖
                    </button>
                    <button onClick={() => copyFormula(f)} className={`p-1.5 rounded-lg transition-colors ${copied === f.id ? 'text-emerald-400 bg-emerald-400/10' : 'text-white/25 hover:text-white/60 hover:bg-white/5'}`} title="Copy">
                      {copied === f.id ? '✅' : '📋'}
                    </button>
                    <button onClick={() => printFormula(f)} className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors" title="Print">
                      🖨️
                    </button>
                    {f.user_id === user?.id && (
                      <>
                        <button onClick={() => { setEditFormula(f); setForm({ title: f.title, formula_text: f.formula_text || '', latex: f.latex || '', description: f.description || '', subject: f.subject, chapter: f.chapter || '', is_important: f.is_important || false }); setShowForm(true); }}
                          className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors">✏️</button>
                        <button onClick={() => deleteFormula(f)} className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-400/10 transition-colors">🗑️</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Formula display */}
                <div className="rounded-2xl p-4 mb-3 text-center" style={{ background: 'rgba(155,110,243,0.08)', border: '1.5px solid rgba(155,110,243,0.16)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset' }}>
                  {renderedLatex ? (
                    <div className="text-foreground text-sm" dangerouslySetInnerHTML={{ __html: renderedLatex }} />
                  ) : (
                    <code className="text-purple-300 font-mono text-sm break-all">{f.formula_text || f.title}</code>
                  )}
                </div>

                {f.description && <p className="text-muted-foreground text-xs leading-relaxed">{f.description}</p>}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Formula Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal-card max-w-xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-heading font-bold text-foreground text-lg mb-5">{editFormula ? 'Edit Formula' : 'Add New Formula'}</h3>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin pr-1">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Formula Title *</label>
                  <input className="input-field" placeholder="e.g. Newton's Second Law" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Subject</label>
                    <select className="input-field" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
                      {['Physics', 'Chemistry', 'Biology'].map(s => <option key={s} value={s} style={{ background: 'hsl(230 14% 13%)' }}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Chapter</label>
                    <input className="input-field" placeholder="Chapter name" value={form.chapter} onChange={e => setForm(p => ({ ...p, chapter: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Formula Text</label>
                  <input className="input-field font-mono" placeholder="e.g. F = ma" value={form.formula_text} onChange={e => setForm(p => ({ ...p, formula_text: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">LaTeX (for rendered equations)</label>
                  <input className="input-field font-mono" placeholder="e.g. F = ma or \frac{1}{2}mv^2" value={form.latex} onChange={e => setForm(p => ({ ...p, latex: e.target.value }))} />
                  {form.latex && window.katex && (
                    <div className="mt-2 px-4 py-3 rounded-2xl text-center" style={{ background: 'rgba(155,110,243,0.08)', border: '1.5px solid rgba(155,110,243,0.18)' }}>
                      <span className="text-foreground text-sm" dangerouslySetInnerHTML={{ __html: (() => { try { return window.katex.renderToString(form.latex, { throwOnError: false, displayMode: true }); } catch { return form.latex; } })() }} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Description</label>
                  <textarea className="input-field" rows={2} placeholder="Explain the formula..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm(p => ({ ...p, is_important: !p.is_important }))}
                    className="w-5 h-5 rounded-lg flex items-center justify-center border transition-colors cursor-pointer"
                    style={form.is_important ? { background: '#F3D56E', borderColor: '#F3D56E' } : { borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}>
                    {form.is_important && <span className="text-black text-xs">★</span>}
                  </div>
                  <span className="text-sm text-muted-foreground">Mark as Important</span>
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveFormula} disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? 'Saving...' : editFormula ? 'Update' : 'Add Formula'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}