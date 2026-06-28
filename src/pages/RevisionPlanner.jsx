import { db } from '@/lib/supabase/db';

import React, { useState, useEffect } from 'react';

import { motion } from 'framer-motion';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  skipped: { label: 'Skipped', color: 'text-white/30', bg: 'bg-white/5', border: 'border-white/10' },
  overdue: { label: 'Overdue', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

const SUBJECT_COLORS = {
  Physics: 'text-blue-400',
  Chemistry: 'text-emerald-400',
  Biology: 'text-orange-400',
};

export default function RevisionPlanner() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [updating, setUpdating] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const load = async () => {
      const u = await db.auth.me();
      setUser(u);
      const ts = await db.entities.RevisionTask.filter({ user_id: u.id }, 'scheduled_date');
      // Auto-mark overdue
      const updated = ts.map(t => {
        if (t.status === 'pending' && t.scheduled_date < today) {
          return { ...t, status: 'overdue' };
        }
        return t;
      });
      setTasks(updated);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = tasks.filter(t => {
    if (filter === 'today') return t.scheduled_date === today;
    if (filter === 'overdue') return t.status === 'overdue';
    if (filter === 'upcoming') return t.scheduled_date > today && t.status === 'pending';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const counts = {
    today: tasks.filter(t => t.scheduled_date === today).length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
    upcoming: tasks.filter(t => t.scheduled_date > today && t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const markStatus = async (task, status) => {
    setUpdating(task.id);
    const updated = await db.entities.RevisionTask.update(task.id, {
      status,
      completed_date: status === 'completed' ? today : null,
    });
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    setUpdating(null);
    // Award XP on completion
    if (status === 'completed') {
      const profiles = await db.entities.UserProfile.filter({ user_id: user.id });
      if (profiles[0]) {
        await db.entities.UserProfile.update(profiles[0].id, { xp: (profiles[0].xp || 0) + 50 });
      }
    }
  };

  const TABS = [
    { key: 'today', label: 'Today', count: counts.today, icon: '📅' },
    { key: 'overdue', label: 'Overdue', count: counts.overdue, icon: '🔴' },
    { key: 'upcoming', label: 'Upcoming', count: counts.upcoming, icon: '⏳' },
    { key: 'completed', label: 'Completed', count: counts.completed, icon: '✅' },
    { key: 'all', label: 'All', count: tasks.length, icon: '📋' },
  ];

  const groupByDate = (ts) => {
    const groups = {};
    ts.forEach(t => {
      const d = t.scheduled_date;
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  };

  const formatDate = (d) => {
    const date = new Date(d + 'T00:00:00');
    if (d === today) return 'Today';
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (d === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div>
        <h2 className="font-heading font-bold text-2xl text-white">Revision Planner</h2>
        <p className="text-white/40 text-sm">Spaced repetition: Day 1 → 3 → 7 → 15 → 30 → 60</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Today', value: counts.today, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Overdue', value: counts.overdue, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Upcoming', value: counts.upcoming, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
          { label: 'Completed', value: counts.completed, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map((s, i) => (
          <div key={i} className={`glass-card rounded-xl p-4 border ${s.bg}`}>
            <div className={`text-2xl font-heading font-bold ${s.color}`}>{s.value}</div>
            <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Info about spaced repetition */}
      <div className="glass-card rounded-xl px-5 py-4 border border-purple-500/20 bg-purple-500/5">
        <div className="flex items-start gap-3">
          <span className="text-xl">🧠</span>
          <div>
            <div className="font-semibold text-white text-sm mb-1">How Spaced Repetition Works</div>
            <p className="text-white/45 text-xs leading-relaxed">
              When you mark a chapter 100% complete in Subjects, revision tasks are automatically scheduled at Day 1, 3, 7, 15, 30, and 60 from completion date. 
              Each revision earns you <span className="text-purple-300">+50 XP</span>. Don't skip — spacing is scientifically proven to improve long-term retention by 200%!
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${filter === tab.key ? 'bg-purple-600 text-white' : 'glass-card text-white/50 hover:text-white/70'}`}>
            {tab.icon} {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'}`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tasks */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl py-20 text-center">
          <div className="text-4xl mb-3">{filter === 'today' ? '🎉' : '📋'}</div>
          <p className="text-white/40">
            {filter === 'today' ? "You're all caught up for today! No revisions due." :
             filter === 'overdue' ? "No overdue revisions. Great job staying on track!" :
             filter === 'upcoming' ? "No upcoming revisions scheduled." :
             "No tasks in this category."}
          </p>
          {filter === 'today' && <p className="text-white/25 text-xs mt-2">Go complete some chapters in Subjects to generate revision tasks!</p>}
        </div>
      ) : filter === 'all' || filter === 'upcoming' ? (
        // Group by date
        <div className="space-y-6">
          {groupByDate(filtered).map(([date, dateTasks]) => (
            <div key={date}>
              <h3 className="font-heading font-semibold text-white/50 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className={date === today ? 'text-purple-400' : date < today ? 'text-red-400' : 'text-white/40'}>{formatDate(date)}</span>
                <span className="text-white/20">({dateTasks.length})</span>
              </h3>
              <div className="space-y-2">
                {dateTasks.map((task, i) => <RevisionCard key={task.id} task={task} onMark={markStatus} updating={updating === task.id} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => <RevisionCard key={task.id} task={task} onMark={markStatus} updating={updating === task.id} />)}
        </div>
      )}
    </div>
  );
}

function RevisionCard({ task, onMark, updating }) {
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const SUBJECT_COLORS = { Physics: 'text-blue-400', Chemistry: 'text-emerald-400', Biology: 'text-orange-400' };

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      className={`glass-card rounded-xl p-4 border ${status.border} flex items-center gap-4 transition-all`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${status.bg} ${status.color} flex-shrink-0`}>
        {task.revision_number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-heading font-semibold text-white text-sm truncate">{task.chapter_name}</h3>
          <span className={`text-xs font-medium ${SUBJECT_COLORS[task.subject]}`}>{task.subject}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/30">
          <span>Revision #{task.revision_number}</span>
          {task.interval_days && <span>Day +{task.interval_days}</span>}
          <span className={status.color}>{status.label}</span>
        </div>
      </div>
      {task.status !== 'completed' && (
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onMark(task, 'completed')}
            disabled={updating}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
          >
            {updating ? '...' : '✓ Done'}
          </button>
          <button
            onClick={() => onMark(task, 'skipped')}
            disabled={updating}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/30 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Skip
          </button>
        </div>
      )}
      {task.status === 'completed' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <span className="text-emerald-400 text-sm">✓</span>
        </div>
      )}
    </motion.div>
  );
}