import { db } from '@/lib/supabase/db';

import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

const FILE_ICONS = { pdf: '📄', image: '🖼️', zip: '📦', docx: '📝', other: '📎' };
const CATEGORIES = ['All', 'notes', 'textbook', 'question_bank', 'video_notes', 'other'];

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subject: 'Physics', chapter: '', category: 'notes' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const u = await db.auth.me();
      setUser(u);
      const rs = await db.entities.Resource.filter({ user_id: u.id }, '-created_date');
      setResources(rs);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = resources.filter(r => {
    if (subjectFilter !== 'All' && r.subject !== subjectFilter) return false;
    if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;
    return true;
  });

  const saveResource = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    let fileUrl = '';
    if (file) {
      setUploading(true);
      const res = await db.integrations.Core.UploadFile({ file });
      fileUrl = res.file_url;
      setUploading(false);
    }
    const created = await db.entities.Resource.create({ ...form, file_url: fileUrl, file_type: file?.type?.includes('pdf') ? 'pdf' : file?.type?.includes('image') ? 'image' : 'other', user_id: user.id });
    setResources(prev => [created, ...prev]);
    setShowForm(false);
    setForm({ title: '', description: '', subject: 'Physics', chapter: '', category: 'notes' });
    setFile(null);
    setSaving(false);
  };

  const deleteResource = async (r) => {
    if (!confirm('Delete this resource?')) return;
    await db.entities.Resource.delete(r.id);
    setResources(prev => prev.filter(x => x.id !== r.id));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">Resources</h2>
          <p className="text-muted-foreground text-sm">{resources.length} files uploaded</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Upload</button>
      </div>

      <div className="flex flex-wrap gap-3">
        {['All', 'Physics', 'Chemistry', 'Biology', 'General'].map(s => (
          <button key={s} onClick={() => setSubjectFilter(s)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${subjectFilter === s ? 'btn-primary' : 'btn-secondary'}`}>
            {s}
          </button>
        ))}
        <select className="input-field max-w-[140px] text-xs" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c.replace('_', ' ')}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <div className="text-4xl mb-3">📁</div>
          <p className="text-muted-foreground mb-4">No resources yet. Upload your first file!</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ Upload File</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass-card p-5 flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-2xl flex-shrink-0">
                {FILE_ICONS[r.file_type] || FILE_ICONS.other}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-foreground text-sm truncate mb-1">{r.title}</h3>
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  <span className="badge-blue">{r.subject}</span>
                  {r.category && <span className="badge-purple">{r.category.replace('_', ' ')}</span>}
                </div>
                {r.description && <p className="text-muted-foreground text-xs mb-2 line-clamp-2">{r.description}</p>}
                <div className="flex gap-2">
                  {r.file_url && (
                    <a href={r.file_url} target="_blank" rel="noreferrer" className="text-xs text-purple-600 font-bold hover:underline">⬇️ Download</a>
                  )}
                  <button onClick={() => deleteResource(r)} className="text-xs text-red-400 hover:text-red-600 ml-auto">Delete</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal-card" onClick={e => e.stopPropagation()}>
              <h3 className="font-heading font-bold text-foreground text-lg mb-5">Upload Resource</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Title *</label>
                  <input className="input-field" placeholder="Resource name" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Subject</label>
                    <select className="input-field" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
                      {['Physics', 'Chemistry', 'Biology', 'General'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Category</label>
                    <select className="input-field" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                      {['notes', 'textbook', 'question_bank', 'video_notes', 'other'].map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">File</label>
                  <input type="file" className="input-field text-sm" onChange={e => setFile(e.target.files[0])} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Description</label>
                  <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveResource} disabled={saving || uploading} className="btn-primary flex-1 justify-center">
                  {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Upload'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}