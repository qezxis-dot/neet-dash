import { db } from '@/lib/supabase/db';

import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

const YEARS = ['All', 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];
const SUBJECTS = ['All', 'Physics', 'Chemistry', 'Biology'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

export default function PYQLibrary() {
  const [pyqs, setPyqs] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [diffFilter, setDiffFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [previewPyq, setPreviewPyq] = useState(null);

  useEffect(() => {
    const load = async () => {
      const u = await db.auth.me();
      setUser(u);
      const [ps, bs] = await Promise.all([
        db.entities.PYQ.filter({ is_published: true }),
        db.entities.Bookmark.filter({ user_id: u.id, item_type: 'pyq' }),
      ]);
      setPyqs(ps.sort((a, b) => b.year - a.year));
      setBookmarks(bs);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = pyqs.filter(p => {
    if (yearFilter !== 'All' && p.year !== yearFilter) return false;
    if (subjectFilter !== 'All' && p.subject !== subjectFilter && p.subject !== 'All') return false;
    if (diffFilter !== 'All' && p.difficulty !== diffFilter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.exam_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const isBookmarked = (id) => bookmarks.some(b => b.item_id === id);

  const toggleBookmark = async (p) => {
    const existing = bookmarks.find(b => b.item_id === p.id);
    if (existing) {
      await db.entities.Bookmark.delete(existing.id);
      setBookmarks(prev => prev.filter(b => b.id !== existing.id));
    } else {
      const b = await db.entities.Bookmark.create({ item_type: 'pyq', item_id: p.id, item_title: p.title, subject: p.subject, user_id: user.id });
      setBookmarks(prev => [...prev, b]);
    }
  };

  const handleDownload = async (p) => {
    if (!p.pdf_url) return;
    await db.entities.PYQ.update(p.id, { downloads: (p.downloads || 0) + 1 });
    setPyqs(prev => prev.map(x => x.id === p.id ? { ...x, downloads: (x.downloads || 0) + 1 } : x));
    window.open(p.pdf_url, '_blank');
  };

  const handleView = async (p) => {
    setPreviewPyq(p);
    await db.entities.PYQ.update(p.id, { views: (p.views || 0) + 1 });
    setPyqs(prev => prev.map(x => x.id === p.id ? { ...x, views: (x.views || 0) + 1 } : x));
  };

  const DIFF_COLORS = { Easy: 'badge-green', Medium: 'badge-orange', Hard: 'badge-red' };
  const SUBJECT_COLORS = { Physics: 'badge-blue', Chemistry: 'badge-green', Biology: 'badge-orange', All: 'badge-purple' };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="font-heading font-bold text-2xl text-white">PYQ Library</h2>
        <p className="text-white/40 text-sm">{pyqs.length} papers available • Curated by admin team</p>
      </div>

      {/* Search & Filters */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
          <input type="text" placeholder="Search papers..." className="input-field pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 flex-wrap">
            <span className="text-xs text-white/30 self-center mr-1">Year:</span>
            {YEARS.map(y => (
              <button key={y} onClick={() => setYearFilter(y)}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${yearFilter === y ? 'bg-purple-600 text-white' : 'glass-card text-white/50 hover:text-white/70'}`}>
                {y}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-1 flex-wrap items-center">
            <span className="text-xs text-white/30 mr-1">Subject:</span>
            {SUBJECTS.map(s => (
              <button key={s} onClick={() => setSubjectFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${subjectFilter === s ? 'bg-blue-600 text-white' : 'glass-card text-white/50 hover:text-white/70'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap items-center">
            <span className="text-xs text-white/30 mr-1">Difficulty:</span>
            {DIFFICULTIES.map(d => (
              <button key={d} onClick={() => setDiffFilter(d)}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${diffFilter === d ? 'bg-emerald-600 text-white' : 'glass-card text-white/50 hover:text-white/70'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-white/40 text-sm">{filtered.length} papers found</p>
      </div>

      {/* Papers grid */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl py-20 text-center">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-white/40">No papers match your filters. Try adjusting them.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass-card rounded-2xl overflow-hidden hover:border-purple-500/25 transition-all group">
              {/* Thumbnail */}
              <div className="h-40 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))' }}>
                {p.thumbnail_url ? (
                  <img src={p.thumbnail_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-6xl mb-2">📄</div>
                      <div className="font-heading font-bold text-white/30 text-2xl">{p.year}</div>
                    </div>
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {p.difficulty && <span className={DIFF_COLORS[p.difficulty] || 'badge-blue'}>{p.difficulty}</span>}
                </div>
                <div className="absolute top-3 left-3">
                  {p.subject && <span className={SUBJECT_COLORS[p.subject] || 'badge-purple'}>{p.subject}</span>}
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-heading font-semibold text-white text-sm mb-1 truncate">{p.title}</h3>
                <div className="flex items-center gap-3 text-xs text-white/40 mb-3">
                  <span>📅 {p.year}</span>
                  {p.total_questions && <span>❓ {p.total_questions} Q</span>}
                  {p.total_marks && <span>📊 {p.total_marks} marks</span>}
                  <span>👁️ {p.views || 0}</span>
                </div>
                {p.description && <p className="text-white/35 text-xs mb-4 line-clamp-2">{p.description}</p>}
                <div className="flex gap-2">
                  <button onClick={() => handleView(p)} className="flex-1 py-2 rounded-xl text-xs font-medium border border-white/10 text-white/60 hover:text-white/80 hover:border-purple-500/30 transition-all">
                    👁️ Preview
                  </button>
                  <button onClick={() => handleDownload(p)} className="flex-1 btn-primary py-2 text-xs justify-center">
                    ⬇️ Download
                  </button>
                  <button onClick={() => toggleBookmark(p)} className={`p-2 rounded-xl border transition-colors ${isBookmarked(p.id) ? 'border-yellow-500/30 text-yellow-400 bg-yellow-400/10' : 'border-white/10 text-white/30 hover:text-yellow-400 hover:border-yellow-500/30'}`}>
                    🔖
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewPyq && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setPreviewPyq(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass-card rounded-2xl w-full max-w-3xl mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <div>
                  <h3 className="font-heading font-bold text-white">{previewPyq.title}</h3>
                  <p className="text-white/40 text-xs">{previewPyq.year} • {previewPyq.subject} • {previewPyq.exam_name}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDownload(previewPyq)} className="btn-primary text-xs py-2">⬇️ Download</button>
                  <button onClick={() => setPreviewPyq(null)} className="p-2 rounded-lg text-white/40 hover:text-white/70 transition-colors text-xl">×</button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6">
                {previewPyq.pdf_url ? (
                  <iframe src={previewPyq.pdf_url} className="w-full rounded-xl" style={{ height: '60vh' }} />
                ) : (
                  <div className="flex items-center justify-center h-64 text-white/30">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📄</div>
                      <p>No PDF preview available.</p>
                      <p className="text-xs mt-2">Please download to view the paper.</p>
                    </div>
                  </div>
                )}
                {previewPyq.description && (
                  <div className="mt-4 p-4 rounded-xl bg-white/3 border border-white/5">
                    <p className="text-white/60 text-sm">{previewPyq.description}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}