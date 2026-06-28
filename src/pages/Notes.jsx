import { db } from '@/lib/supabase/db';

import React, { useState, useEffect, useRef, useCallback } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

const NOTE_COLORS = [
  { name: 'purple', bg: 'border-purple-500/30 bg-purple-500/5', dot: 'bg-purple-500' },
  { name: 'blue', bg: 'border-blue-500/30 bg-blue-500/5', dot: 'bg-blue-500' },
  { name: 'green', bg: 'border-emerald-500/30 bg-emerald-500/5', dot: 'bg-emerald-500' },
  { name: 'orange', bg: 'border-orange-500/30 bg-orange-500/5', dot: 'bg-orange-500' },
  { name: 'pink', bg: 'border-pink-500/30 bg-pink-500/5', dot: 'bg-pink-500' },
];

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [showEditor, setShowEditor] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSubject, setEditSubject] = useState('Physics');
  const [editColor, setEditColor] = useState('purple');
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimer = useRef(null);

  useEffect(() => {
    const load = async () => {
      const u = await db.auth.me();
      setUser(u);
      const ns = await db.entities.Note.filter({ user_id: u.id }, '-updated_date');
      setNotes(ns);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = notes.filter(n => {
    if (subjectFilter !== 'All' && n.subject !== subjectFilter) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.content?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openNote = (note) => {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content || '');
    setEditSubject(note.subject || 'Physics');
    setEditColor(note.color || 'purple');
    setShowEditor(true);
  };

  const newNote = () => {
    setActiveNote(null);
    setEditTitle('');
    setEditContent('');
    setEditSubject('Physics');
    setEditColor('purple');
    setShowEditor(true);
  };

  const autoSave = useCallback(async (title, content) => {
    if (!activeNote || !title) return;
    setAutoSaving(true);
    try {
      const updated = await db.entities.Note.update(activeNote.id, { title, content, word_count: content.split(/\s+/).filter(Boolean).length });
      setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, ...updated } : n));
    } finally {
      setTimeout(() => setAutoSaving(false), 1000);
    }
  }, [activeNote]);

  const handleContentChange = (val) => {
    setEditContent(val);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => autoSave(editTitle, val), 2000);
  };

  const saveNote = async () => {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      const data = { title: editTitle, content: editContent, subject: editSubject, color: editColor, user_id: user.id, word_count: editContent.split(/\s+/).filter(Boolean).length };
      if (activeNote) {
        const updated = await db.entities.Note.update(activeNote.id, data);
        setNotes(prev => prev.map(n => n.id === activeNote.id ? updated : n));
      } else {
        const created = await db.entities.Note.create(data);
        setNotes(prev => [created, ...prev]);
      }
      setShowEditor(false);
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (note) => {
    if (!confirm(`Delete "${note.title}"?`)) return;
    await db.entities.Note.delete(note.id);
    setNotes(prev => prev.filter(n => n.id !== note.id));
    if (showEditor && activeNote?.id === note.id) setShowEditor(false);
  };

  const togglePin = async (note) => {
    const updated = await db.entities.Note.update(note.id, { is_pinned: !note.is_pinned });
    setNotes(prev => prev.map(n => n.id === note.id ? updated : n));
  };

  const pinned = filtered.filter(n => n.is_pinned);
  const unpinned = filtered.filter(n => !n.is_pinned);

  const getColorConfig = (name) => NOTE_COLORS.find(c => c.name === name) || NOTE_COLORS[0];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-white">My Notes</h2>
          <p className="text-white/40 text-sm">{notes.length} notes • {notes.filter(n => n.is_pinned).length} pinned</p>
        </div>
        <button onClick={newNote} className="btn-primary text-sm">+ New Note</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
          <input type="text" placeholder="Search notes..." className="input-field pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['All', 'Physics', 'Chemistry', 'Biology', 'General'].map(s => (
          <button key={s} onClick={() => setSubjectFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${subjectFilter === s ? 'bg-purple-600 text-white' : 'glass-card text-white/50 hover:text-white/70'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Pinned notes */}
      {pinned.length > 0 && (
        <div>
          <h3 className="font-heading font-semibold text-white/50 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            📌 Pinned
          </h3>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pinned.map((n, i) => <NoteCard key={n.id} note={n} onClick={() => openNote(n)} onPin={() => togglePin(n)} onDelete={() => deleteNote(n)} />)}
          </div>
        </div>
      )}

      {/* All notes */}
      {unpinned.length === 0 && pinned.length === 0 ? (
        <div className="glass-card rounded-2xl py-20 text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-white/40 mb-4">No notes yet. Create your first note!</p>
          <button onClick={newNote} className="btn-primary text-sm">+ New Note</button>
        </div>
      ) : (
        unpinned.length > 0 && (
          <div>
            {pinned.length > 0 && <h3 className="font-heading font-semibold text-white/50 text-xs uppercase tracking-wider mb-3">All Notes</h3>}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {unpinned.map((n, i) => <NoteCard key={n.id} note={n} onClick={() => openNote(n)} onPin={() => togglePin(n)} onDelete={() => deleteNote(n)} />)}
            </div>
          </div>
        )
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-card rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Editor header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/8">
                <input
                  className="flex-1 bg-transparent text-white font-heading font-bold text-lg outline-none placeholder-white/25"
                  placeholder="Note title..."
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={() => activeNote && autoSave(editTitle, editContent)}
                />
                {autoSaving && <span className="text-xs text-white/25">Saving...</span>}
                <button onClick={() => setShowEditor(false)} className="text-white/30 hover:text-white/60 text-xl">×</button>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5 flex-wrap">
                <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none" value={editSubject} onChange={e => setEditSubject(e.target.value)}>
                  {['Physics', 'Chemistry', 'Biology', 'General'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="flex gap-1.5">
                  {NOTE_COLORS.map(c => (
                    <button key={c.name} onClick={() => setEditColor(c.name)}
                      className={`w-5 h-5 rounded-full ${c.dot} transition-transform ${editColor === c.name ? 'scale-125 ring-2 ring-white/30' : ''}`} />
                  ))}
                </div>
                <div className="flex gap-1 ml-auto">
                  {[
                    { label: 'B', action: () => document.execCommand('bold') },
                    { label: 'I', style: 'italic', action: () => document.execCommand('italic') },
                    { label: 'U', style: 'underline', action: () => document.execCommand('underline') },
                  ].map(t => (
                    <button key={t.label} onClick={t.action}
                      className="w-7 h-7 rounded-lg text-xs font-bold text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
                      style={{ fontStyle: t.style }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor body */}
              <div className="flex-1 overflow-auto p-6">
                <textarea
                  className="w-full h-full min-h-[300px] bg-transparent text-white/80 text-sm leading-relaxed outline-none resize-none placeholder-white/20"
                  placeholder="Start writing your notes... Use this space freely."
                  value={editContent}
                  onChange={e => handleContentChange(e.target.value)}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                <span className="text-xs text-white/20">{editContent.split(/\s+/).filter(Boolean).length} words</span>
                <div className="flex gap-3">
                  <button onClick={() => setShowEditor(false)} className="btn-secondary text-sm py-2">Cancel</button>
                  <button onClick={saveNote} disabled={saving} className="btn-primary text-sm py-2 px-6">
                    {saving ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NoteCard({ note, onClick, onPin, onDelete }) {
  const COLOR_CONFIG = {
    purple: 'border-purple-500/25 bg-purple-500/5',
    blue: 'border-blue-500/25 bg-blue-500/5',
    green: 'border-emerald-500/25 bg-emerald-500/5',
    orange: 'border-orange-500/25 bg-orange-500/5',
    pink: 'border-pink-500/25 bg-pink-500/5',
  };
  const colorClass = COLOR_CONFIG[note.color] || COLOR_CONFIG.purple;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className={`glass-card rounded-2xl p-5 cursor-pointer border transition-all hover:scale-[1.02] ${colorClass}`}
      onClick={onClick}>
      <div className="flex items-start justify-between mb-2" onClick={e => e.stopPropagation()}>
        <h3 className="font-heading font-semibold text-white text-sm flex-1 truncate" onClick={onClick}>{note.title}</h3>
        <div className="flex gap-1 ml-2">
          <button onClick={onPin} className={`p-1 rounded-lg transition-colors text-sm ${note.is_pinned ? 'text-yellow-400' : 'text-white/25 hover:text-yellow-400'}`}>📌</button>
          <button onClick={onDelete} className="p-1 rounded-lg text-white/20 hover:text-red-400 transition-colors text-sm">🗑️</button>
        </div>
      </div>
      {note.content && (
        <p className="text-white/40 text-xs line-clamp-4 leading-relaxed mb-3">{note.content}</p>
      )}
      <div className="flex items-center gap-2">
        <span className="tag text-[10px]">{note.subject}</span>
        <span className="text-white/20 text-[10px] ml-auto">{note.word_count || 0} words</span>
      </div>
    </motion.div>
  );
}