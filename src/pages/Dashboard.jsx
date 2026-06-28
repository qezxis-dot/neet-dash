import { db } from '@/lib/supabase/db';

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

function getDaysLeft(targetYear) {
  // NEET is typically held in May; use May 4 of the target year
  const year = targetYear || new Date().getFullYear() + 1;
  const neetDate = new Date(`${year}-05-04`);
  const diff = neetDate - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function buildHeatmap(sessions) {
  const map = {};
  sessions.forEach(s => {
    const d = s.date?.split('T')[0] || s.date;
    if (!d) return;
    map[d] = (map[d] || 0) + (s.duration_minutes || 0);
  });
  return map;
}

function HeatmapGrid({ data }) {
  const weeks = 16;
  const days = weeks * 7;
  const cells = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const mins = data[key] || 0;
    let level = 0;
    if (mins >= 120) level = 4;
    else if (mins >= 60) level = 3;
    else if (mins >= 30) level = 2;
    else if (mins > 0) level = 1;
    cells.push({ key, level, mins });
  }
  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="flex gap-0.5 min-w-max">
        {Array.from({ length: weeks }).map((_, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {cells.slice(wi * 7, wi * 7 + 7).map(cell => (
              <div
                key={cell.key}
                className={`heatmap-cell w-3.5 h-3.5 heat-${cell.level}`}
                title={`${cell.key}: ${cell.mins}m`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: 'Start Timer', icon: '⏱️', path: '/timer', color: 'from-purple-600 to-indigo-600' },
  { label: 'Add Note', icon: '📝', path: '/notes', color: 'from-blue-600 to-cyan-600' },
  { label: 'Browse Formulas', icon: '⚗️', path: '/formula-bank', color: 'from-emerald-600 to-teal-600' },
  { label: 'Mock Test', icon: '📊', path: '/mock-tests', color: 'from-orange-600 to-red-600' },
  { label: 'Revision', icon: '🔄', path: '/revision', color: 'from-pink-600 to-rose-600' },
  { label: 'Error Log', icon: '🧠', path: '/error-notebook', color: 'from-violet-600 to-purple-600' },
];

const LEVEL_NAMES = ['Beginner', 'Aspirant', 'Learner', 'Scholar', 'Expert', 'Master', 'Champion', 'Genius', 'Legend', 'NEET God'];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [mockTests, setMockTests] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayMins, setTodayMins] = useState(0);
  const [quote, setQuote] = useState(null);

  const daysLeft = getDaysLeft(profile?.target_year);

  useEffect(() => {
    const load = async () => {
      try {
        const u = await db.auth.me();
        setUser(u);
        const [profs, sess, tests, revs, gs, chs, ann, quotes] = await Promise.all([
          db.entities.UserProfile.filter({ user_id: u.id }),
          db.entities.StudySession.filter({ user_id: u.id }),
          db.entities.MockTest.filter({ user_id: u.id }),
          db.entities.RevisionTask.filter({ user_id: u.id }),
          db.entities.Goal.filter({ user_id: u.id }),
          db.entities.Chapter.filter({ user_id: u.id }),
          db.entities.Announcement.filter({ is_active: true }),
          db.entities.DailyQuote.filter({ is_active: true }),
        ]);
        setProfile(profs[0] || null);
        setSessions(sess);
        setMockTests(tests);
        setRevisions(revs);
        setGoals(gs);
        setChapters(chs);
        setAnnouncements(ann);
        if (quotes.length > 0) {
          setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
        }

        const today = new Date().toISOString().split('T')[0];
        const todaySess = sess.filter(s => s.date?.split('T')[0] === today);
        setTodayMins(todaySess.reduce((a, s) => a + (s.duration_minutes || 0), 0));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Weekly study chart data
  const weeklyData = (() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const daySess = sessions.filter(s => s.date?.split('T')[0] === key);
      const mins = daySess.reduce((a, s) => a + (s.duration_minutes || 0), 0);
      result.push({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
        hours: +(mins / 60).toFixed(1),
      });
    }
    return result;
  })();

  // Mock test trend
  const testTrend = mockTests.slice(-7).map(t => ({
    date: t.date,
    score: t.total_marks || 0,
    accuracy: t.accuracy || 0,
  }));

  // Subject radar
  const subjectData = [
    { subject: 'Physics', score: chapters.filter(c => c.subject === 'Physics').reduce((a, c) => a + (c.completion || 0), 0) / Math.max(chapters.filter(c => c.subject === 'Physics').length, 1) },
    { subject: 'Chemistry', score: chapters.filter(c => c.subject === 'Chemistry').reduce((a, c) => a + (c.completion || 0), 0) / Math.max(chapters.filter(c => c.subject === 'Chemistry').length, 1) },
    { subject: 'Biology', score: chapters.filter(c => c.subject === 'Biology').reduce((a, c) => a + (c.completion || 0), 0) / Math.max(chapters.filter(c => c.subject === 'Biology').length, 1) },
  ];

  const overdueRevisions = revisions.filter(r => {
    const d = r.scheduled_date?.split('T')[0];
    return d < new Date().toISOString().split('T')[0] && r.status === 'pending';
  });
  const todayRevisions = revisions.filter(r => {
    const d = r.scheduled_date?.split('T')[0];
    return d === new Date().toISOString().split('T')[0] && r.status === 'pending';
  });

  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const xpToNext = level * 500;
  const xpPct = Math.min((xp % xpToNext) / xpToNext * 100, 100);
  const mcqsTotal = profile?.mcqs_solved || 0;
  const mcqsCorrect = profile?.mcqs_correct || 0;
  const accuracy = mcqsTotal > 0 ? Math.round(mcqsCorrect / mcqsTotal * 100) : 0;
  const heatmapData = buildHeatmap(sessions);
  const dailyGoalHours = profile?.daily_goal_hours || 8;
  const dailyGoalPct = Math.min(todayMins / (dailyGoalHours * 60) * 100, 100);

  const STATS = [
    { label: 'Days Remaining', value: daysLeft, icon: '📅', sub: `Until NEET ${profile?.target_year || new Date().getFullYear() + 1}`, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { label: 'Study Streak', value: `${profile?.study_streak || 0}d`, icon: '🔥', sub: 'Consecutive days', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { label: 'MCQs Solved', value: mcqsTotal.toLocaleString(), icon: '✅', sub: `${accuracy}% accuracy`, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Today\'s Study', value: `${Math.floor(todayMins / 60)}h ${todayMins % 60}m`, icon: '⏱️', sub: `${Math.round(dailyGoalPct)}% of daily goal`, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'XP Points', value: xp.toLocaleString(), icon: '⚡', sub: `Level ${level} — ${LEVEL_NAMES[Math.min(level - 1, 9)]}`, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { label: 'Chapters Done', value: chapters.filter(c => c.completion === 100).length, icon: '📚', sub: `of ${chapters.length} total`, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/30 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
            <span className="text-gradient">{user?.full_name?.split(' ')[0] || 'Champion'}</span> 👋
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {daysLeft > 0 ? `NEET ${profile?.target_year || ''} is in ${daysLeft} days — every hour counts.` : 'NEET day is here! Give it your best.'}
          </p>
        </div>
        {/* Daily goal progress */}
        <div className="flex items-center gap-3 glass-card rounded-xl px-4 py-3 min-w-[200px]">
          <div className="text-xl">🎯</div>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/50">Daily Goal</span>
              <span className="text-white/80">{Math.floor(todayMins / 60)}h / {dailyGoalHours}h</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${dailyGoalPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Announcement */}
      {announcements.length > 0 && (
        <div className={`glass-card rounded-xl px-5 py-4 flex items-start gap-4 border ${
          announcements[0].type === 'urgent' ? 'border-red-500/30 bg-red-500/5' :
          announcements[0].type === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' :
          announcements[0].type === 'success' ? 'border-emerald-500/30 bg-emerald-500/5' :
          'border-blue-500/30 bg-blue-500/5'
        }`}>
          <span className="text-xl">{announcements[0].type === 'urgent' ? '🚨' : announcements[0].type === 'warning' ? '⚠️' : '📢'}</span>
          <div>
            <div className="font-semibold text-white text-sm">{announcements[0].title}</div>
            <div className="text-white/50 text-xs mt-1">{announcements[0].content}</div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {STATS.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`stat-card border ${s.border} ${s.bg}`}
          >
            <div className="text-xl mb-2">{s.icon}</div>
            <div className={`text-xl font-heading font-bold ${s.color}`}>{s.value}</div>
            <div className="text-white/50 text-xs mt-0.5">{s.label}</div>
            <div className="text-white/25 text-[10px] mt-0.5">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* XP Level Bar */}
      <div className="glass-card rounded-2xl px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center font-bold text-white text-sm">
              {level}
            </div>
            <div>
              <div className="font-heading font-bold text-white text-sm">Level {level} — {LEVEL_NAMES[Math.min(level - 1, 9)]}</div>
              <div className="text-white/30 text-xs">{xp % xpToNext} / {xpToNext} XP to next level</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-heading font-bold text-yellow-400">{xp.toLocaleString()} XP</div>
            <div className="text-white/30 text-xs">Total Earned</div>
          </div>
        </div>
        <div className="xp-bar">
          <div className="xp-fill" style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Study Chart */}
        <div className="lg:col-span-2 chart-container">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading font-semibold text-white">Weekly Study Hours</h3>
            <span className="badge-purple">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
              <Tooltip contentStyle={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '12px' }} />
              <Area type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2} fill="url(#studyGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Progress */}
        <div className="chart-container">
          <h3 className="font-heading font-semibold text-white mb-5">Subject Progress</h3>
          <div className="space-y-4">
            {[
              { name: 'Physics', color: 'bg-blue-500', pct: Math.round(subjectData[0]?.score || 0) },
              { name: 'Chemistry', color: 'bg-emerald-500', pct: Math.round(subjectData[1]?.score || 0) },
              { name: 'Biology', color: 'bg-orange-500', pct: Math.round(subjectData[2]?.score || 0) },
            ].map(s => (
              <div key={s.name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/60">{s.name}</span>
                  <span className="text-white/80 font-medium">{s.pct}%</span>
                </div>
                <div className="progress-bar">
                  <div className={`h-full rounded-full ${s.color} transition-all duration-700`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          {/* Mock test stats */}
          {mockTests.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/5">
              <div className="text-xs text-white/40 mb-3">Latest Mock Test</div>
              <div className="flex justify-between">
                <div className="text-center">
                  <div className="font-heading font-bold text-white">{mockTests[mockTests.length - 1]?.total_marks || 0}</div>
                  <div className="text-[10px] text-white/30">Score</div>
                </div>
                <div className="text-center">
                  <div className="font-heading font-bold text-emerald-400">{mockTests[mockTests.length - 1]?.accuracy || 0}%</div>
                  <div className="text-[10px] text-white/30">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="font-heading font-bold text-blue-400">{mockTests.length}</div>
                  <div className="text-[10px] text-white/30">Tests Done</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-semibold text-white">Study Heatmap</h3>
          <div className="flex items-center gap-2 text-xs text-white/30">
            Less
            {[0,1,2,3,4].map(l => <div key={l} className={`w-3 h-3 rounded-sm heat-${l}`} />)}
            More
          </div>
        </div>
        <HeatmapGrid data={heatmapData} />
      </div>

      {/* Today's tasks + Revision */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's Revision */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-white">Today's Revision</h3>
            <div className="flex gap-2">
              {overdueRevisions.length > 0 && <span className="badge-red">{overdueRevisions.length} overdue</span>}
              <span className="badge-blue">{todayRevisions.length} today</span>
            </div>
          </div>
          {todayRevisions.length === 0 && overdueRevisions.length === 0 ? (
            <div className="text-center py-8 text-white/30">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-sm">All caught up! No revisions due today.</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {[...overdueRevisions.map(r => ({ ...r, isOverdue: true })), ...todayRevisions].slice(0, 8).map((r, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${r.isOverdue ? 'border-red-500/20 bg-red-500/5' : 'border-white/5 bg-white/2'}`}>
                  <div className={`w-2 h-2 rounded-full ${r.isOverdue ? 'bg-red-400' : 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/80 truncate">{r.chapter_name}</div>
                    <div className="text-xs text-white/30">{r.subject} • Rev #{r.revision_number}</div>
                  </div>
                  {r.isOverdue && <span className="badge-red text-[10px]">Overdue</span>}
                </div>
              ))}
            </div>
          )}
          <Link to="/revision" className="btn-secondary w-full justify-center mt-4 text-xs py-2">View All Revisions →</Link>
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-heading font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((a, i) => (
              <Link key={i} to={a.path}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 hover:border-purple-500/30 transition-all group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                  {a.icon}
                </div>
                <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors text-center leading-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Quote */}
      {quote && (
        <div className="glass-card rounded-2xl px-8 py-6 border border-purple-500/15 text-center">
          <div className="text-3xl mb-4">💡</div>
          <blockquote className="font-heading text-lg text-white/80 italic mb-3">"{quote.quote}"</blockquote>
          {quote.author && <cite className="text-white/30 text-sm not-italic">— {quote.author}</cite>}
        </div>
      )}

      {/* Goals */}
      {goals.filter(g => !g.is_completed).length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-white">Active Goals</h3>
            <Link to="/goals" className="text-xs text-purple-400 hover:text-purple-300">View all →</Link>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {goals.filter(g => !g.is_completed).slice(0, 3).map((g, i) => {
              const pct = Math.min((g.current_value / g.target_value) * 100, 100);
              return (
                <div key={i} className="p-4 rounded-xl bg-white/2 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70 font-medium truncate">{g.title}</span>
                    <span className="text-xs text-white/30 capitalize">{g.goal_type}</span>
                  </div>
                  <div className="progress-bar mb-1.5">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-white/30">{g.current_value} / {g.target_value} {g.unit}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}