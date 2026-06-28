import { db } from '@/lib/supabase/db';

import React, { useState, useEffect, useRef, useCallback } from 'react';

import { motion } from 'framer-motion';

const MODES = [
  { label: 'Pomodoro', duration: 25, break: 5, icon: '🍅', color: '#8b5cf6', xp: 30 },
  { label: '50 Min Focus', duration: 50, break: 10, icon: '🎯', color: '#6366f1', xp: 60 },
  { label: 'Custom', duration: 45, break: 5, icon: '⏱️', color: '#3b82f6', xp: 50 },
];

export default function StudyTimer() {
  const [user, setUser] = useState(null);
  const [modeIdx, setModeIdx] = useState(0);
  const [customDuration, setCustomDuration] = useState(45);
  const [subject, setSubject] = useState('Physics');
  const [chapter, setChapter] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [sessions, setSessions] = useState([]);
  const [todayStats, setTodayStats] = useState({ sessions: 0, minutes: 0, xp: 0 });
  const [showCelebration, setShowCelebration] = useState(false);
  const intervalRef = useRef(null);

  const mode = MODES[modeIdx];
  const duration = modeIdx === 2 ? customDuration : mode.duration;

  useEffect(() => {
    const load = async () => {
      const u = await db.auth.me();
      setUser(u);
      const today = new Date().toISOString().split('T')[0];
      const ts = await db.entities.StudySession.filter({ user_id: u.id });
      const todaySess = ts.filter(s => s.date === today);
      setSessions(ts.slice(0, 10));
      setTodayStats({
        sessions: todaySess.length,
        minutes: todaySess.reduce((a, s) => a + (s.duration_minutes || 0), 0),
        xp: todaySess.reduce((a, s) => a + (s.xp_earned || 0), 0),
      });
    };
    load();
  }, []);

  useEffect(() => {
    resetTimer();
  }, [modeIdx, customDuration]);

  const resetTimer = () => {
    const d = modeIdx === 2 ? customDuration : MODES[modeIdx].duration;
    setTimeLeft(d * 60);
    setTotalTime(d * 60);
    setIsRunning(false);
    setIsBreak(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const sessionComplete = useCallback(async (mins) => {
    if (!user) return;
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
    const xpEarned = Math.round(mode.xp * (mins / duration));
    await db.entities.StudySession.create({
      date: new Date().toISOString().split('T')[0],
      subject, chapter,
      duration_minutes: mins,
      session_type: modeIdx === 0 ? 'pomodoro' : 'custom',
      xp_earned: xpEarned,
      user_id: user.id,
    });
    const profiles = await db.entities.UserProfile.filter({ user_id: user.id });
    if (profiles[0]) {
      const newXp = (profiles[0].xp || 0) + xpEarned;
      await db.entities.UserProfile.update(profiles[0].id, { xp: newXp, level: Math.floor(newXp / 500) + 1 });
    }
    setTodayStats(prev => ({ sessions: prev.sessions + 1, minutes: prev.minutes + mins, xp: prev.xp + xpEarned }));
  }, [user, subject, chapter, mode, modeIdx, duration]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            if (!isBreak) {
              sessionComplete(duration);
              setIsBreak(true);
              const breakTime = mode.break * 60;
              setTimeLeft(breakTime);
              setTotalTime(breakTime);
            } else {
              setIsBreak(false);
              resetTimer();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = totalTime > 0 ? 1 - timeLeft / totalTime : 0;
  const circumference = 2 * Math.PI * 110;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div>
        <h2 className="font-heading font-bold text-2xl text-foreground">Study Timer</h2>
        <p className="text-muted-foreground text-sm">Focus sessions with XP rewards</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Sessions Today", value: todayStats.sessions, icon: '🍅' },
          { label: "Minutes Studied", value: todayStats.minutes, icon: '⏱️' },
          { label: "XP Earned", value: `+${todayStats.xp}`, icon: '⚡' },
        ].map((s, i) => (
          <div key={i} className="stat-card text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-heading font-bold text-foreground text-xl">{s.value}</div>
            <div className="text-muted-foreground text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-8 flex flex-col items-center">
          <div className="flex gap-2 mb-8 flex-wrap justify-center">
            {MODES.map((m, i) => (
              <button key={i} onClick={() => { setModeIdx(i); }}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${modeIdx === i ? 'btn-primary' : 'btn-secondary'}`}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {modeIdx === 2 && (
            <div className="mb-6 flex items-center gap-3">
              <label className="text-xs text-muted-foreground font-semibold">Duration:</label>
              <input type="number" min="1" max="180" className="input-field w-20 text-center text-sm" value={customDuration} onChange={e => { setCustomDuration(parseInt(e.target.value) || 25); }} />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          )}

          <div className="relative w-56 h-56 mb-8">
            <svg className="timer-ring w-56 h-56" viewBox="0 0 240 240">
              <circle cx="120" cy="120" r="110" fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="12" />
              <circle cx="120" cy="120" r="110" fill="none"
                stroke={isBreak ? '#22c55e' : mode.color}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="timer-ring-circle"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`font-heading font-bold text-5xl mb-1 ${isBreak ? 'text-green-600' : 'text-foreground'}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <div className="text-muted-foreground text-sm font-semibold">
                {isBreak ? '☕ Break' : isRunning ? '🎯 Focusing' : '⏸ Ready'}
              </div>
              {!isBreak && <div className="text-purple-400 text-xs mt-1 font-bold">+{mode.xp} XP</div>}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setIsRunning(r => !r)}
              className="btn-primary px-10 py-3 text-base">
              {isRunning ? '⏸ Pause' : '▶ Start'}
            </button>
            <button onClick={resetTimer} className="btn-secondary px-5 py-3 text-lg">↺</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="font-heading font-semibold text-foreground text-sm mb-4">Session Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Subject</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Physics', 'Chemistry', 'Biology', 'General'].map(s => (
                    <button key={s} onClick={() => setSubject(s)}
                      className={`py-2 rounded-2xl text-xs font-bold transition-all ${subject === s ? 'btn-primary' : 'btn-secondary'}`}>
                      {s === 'Physics' ? '⚛️' : s === 'Chemistry' ? '⚗️' : s === 'Biology' ? '🧬' : '📚'}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-semibold">{subject}</div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-semibold">Chapter (optional)</label>
                <input className="input-field" placeholder="e.g. Kinematics" value={chapter} onChange={e => setChapter(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-heading font-semibold text-foreground text-sm mb-4">Recent Sessions</h3>
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No sessions yet. Start your first!</div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                {sessions.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-purple-50/50 border border-purple-100">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-sm flex-shrink-0">
                      {s.subject === 'Physics' ? '⚛️' : s.subject === 'Chemistry' ? '⚗️' : s.subject === 'Biology' ? '🧬' : '📚'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-foreground font-semibold">{s.subject}{s.chapter ? ` — ${s.chapter}` : ''}</div>
                      <div className="text-[10px] text-muted-foreground">{s.date}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-foreground font-bold">{s.duration_minutes}m</div>
                      <div className="text-[10px] text-amber-500 font-bold">+{s.xp_earned} XP</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCelebration && (
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="glass-card p-10 text-center glow-purple">
            <div className="text-6xl mb-4">🎉</div>
            <div className="font-heading font-bold text-foreground text-2xl mb-2">Session Complete!</div>
            <div className="text-purple-600 font-bold">+{mode.xp} XP earned</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}