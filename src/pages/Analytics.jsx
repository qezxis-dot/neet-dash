import { db } from '@/lib/supabase/db';

import React, { useState, useEffect } from 'react';

import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [tests, setTests] = useState([]);
  const [errors, setErrors] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    const load = async () => {
      const u = await db.auth.me();
      setUser(u);
      const [sess, ts, errs, chs] = await Promise.all([
        db.entities.StudySession.filter({ user_id: u.id }),
        db.entities.MockTest.filter({ user_id: u.id }),
        db.entities.ErrorNote.filter({ user_id: u.id }),
        db.entities.Chapter.filter({ user_id: u.id }),
      ]);
      setSessions(sess);
      setTests(ts.sort((a, b) => a.date.localeCompare(b.date)));
      setErrors(errs);
      setChapters(chs);
      setLoading(false);
    };
    load();
  }, []);

  const getDays = (n) => {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const days = getDays(period);

  const dailyStudy = days.map(d => {
    const daySess = sessions.filter(s => s.date === d);
    return {
      date: d.slice(5),
      minutes: daySess.reduce((a, s) => a + (s.duration_minutes || 0), 0),
      hours: +(daySess.reduce((a, s) => a + (s.duration_minutes || 0), 0) / 60).toFixed(1),
    };
  });

  const subjectStudy = ['Physics', 'Chemistry', 'Biology'].map(sub => ({
    subject: sub,
    hours: +(sessions.filter(s => s.subject === sub).reduce((a, s) => a + (s.duration_minutes || 0), 0) / 60).toFixed(1),
    completion: chapters.filter(c => c.subject === sub).length > 0
      ? Math.round(chapters.filter(c => c.subject === sub).reduce((a, c) => a + (c.completion || 0), 0) / chapters.filter(c => c.subject === sub).length)
      : 0,
    errors: errors.filter(e => e.subject === sub).length,
  }));

  const testTrend = tests.slice(-10).map((t, i) => ({
    name: `T${i + 1}`,
    score: t.total_marks || 0,
    accuracy: t.accuracy || 0,
  }));

  const radarData = subjectStudy.map(s => ({ subject: s.subject, completion: s.completion, score: tests.length > 0 ? Math.round(tests.reduce((a, t) => a + (t[`${s.subject.toLowerCase()}_marks`] || 0), 0) / tests.length) : 0 }));

  const errorsByType = Object.entries(
    errors.reduce((acc, e) => { acc[e.error_type] = (acc[e.error_type] || 0) + 1; return acc; }, {})
  ).map(([type, count]) => ({ type: type.replace('_', ' '), count }));

  const totalHours = +(sessions.reduce((a, s) => a + (s.duration_minutes || 0), 0) / 60).toFixed(1);
  const avgDailyHours = days.length > 0 ? +(dailyStudy.reduce((a, d) => a + d.hours, 0) / days.length).toFixed(1) : 0;
  const bestScore = tests.length > 0 ? Math.max(...tests.map(t => t.total_marks || 0)) : 0;

  const CHART_TOOLTIP = { contentStyle: { background: 'rgba(255,255,255,0.98)', border: '1.5px solid rgba(139,92,246,0.15)', borderRadius: '16px', color: '#1e1b4b', fontSize: '12px', fontWeight: 600, boxShadow: '0 8px 24px rgba(139,92,246,0.12)' } };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">Analytics</h2>
          <p className="text-muted-foreground text-sm">Your complete study performance overview</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${period === p ? 'btn-primary' : 'btn-secondary'}`}>
              {p}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Study Hours', value: `${totalHours}h`, icon: '⏱️', color: 'text-purple-600' },
          { label: 'Avg Daily Hours', value: `${avgDailyHours}h`, icon: '📅', color: 'text-blue-600' },
          { label: 'Best Mock Score', value: bestScore, icon: '🏆', color: 'text-amber-500' },
          { label: 'Errors Logged', value: errors.length, icon: '🧠', color: 'text-red-500' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-heading font-bold ${s.color}`}>{s.value}</div>
            <div className="text-muted-foreground text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-foreground">Daily Study Hours</h3>
          <span className="badge-purple">Last {period} days</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dailyStudy}>
            <defs>
              <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="transparent" interval={Math.floor(days.length / 6)} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="transparent" />
            <Tooltip {...CHART_TOOLTIP} />
            <Area type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#studyGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="chart-container">
          <h3 className="font-heading font-semibold text-foreground mb-4">Subject Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectStudy}>
              <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#9ca3af' }} stroke="transparent" />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="transparent" />
              <Tooltip {...CHART_TOOLTIP} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#6b7280' }} />
              <Bar dataKey="hours" fill="#a78bfa" radius={[8, 8, 0, 0]} name="Hours" />
              <Bar dataKey="completion" fill="#60a5fa" radius={[8, 8, 0, 0]} name="% Done" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {testTrend.length > 1 && (
          <div className="chart-container">
            <h3 className="font-heading font-semibold text-foreground mb-4">Mock Test Score Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={testTrend}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} stroke="transparent" />
                <YAxis domain={[0, 720]} tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="transparent" />
                <Tooltip {...CHART_TOOLTIP} />
                <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {errorsByType.length > 0 && (
          <div className="chart-container">
            <h3 className="font-heading font-semibold text-foreground mb-4">Error Types</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={errorsByType} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="transparent" />
                <YAxis dataKey="type" type="category" tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="transparent" width={100} />
                <Tooltip {...CHART_TOOLTIP} />
                <Bar dataKey="count" fill="#f87171" radius={[0, 8, 8, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="chart-container">
          <h3 className="font-heading font-semibold text-foreground mb-4">Subject Radar</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(139,92,246,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }} />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: '#9ca3af' }} />
              <Radar name="Completion" dataKey="completion" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}