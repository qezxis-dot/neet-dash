import { db } from '@/lib/supabase/db';

import React, { useState, useEffect } from 'react';

const ALL_BADGES = [
  { id: 'first_session', icon: '🌱', title: 'First Step', desc: 'Complete your first study session', xp: 50 },
  { id: 'streak_7', icon: '🔥', title: 'Week Warrior', desc: '7-day study streak', xp: 200 },
  { id: 'streak_30', icon: '💥', title: 'Month Master', desc: '30-day study streak', xp: 1000 },
  { id: 'mcq_100', icon: '✅', title: 'Century', desc: 'Solve 100 MCQs', xp: 150 },
  { id: 'mcq_1000', icon: '🏅', title: 'MCQ Pro', desc: 'Solve 1000 MCQs', xp: 500 },
  { id: 'notes_10', icon: '📝', title: 'Note Taker', desc: 'Create 10 notes', xp: 100 },
  { id: 'formula_master', icon: '⚗️', title: 'Formula Master', desc: 'Add 20 formulas', xp: 200 },
  { id: 'mock_5', icon: '📊', title: 'Test Ready', desc: 'Take 5 mock tests', xp: 250 },
  { id: 'mock_720', icon: '🏆', title: 'Perfect Score', desc: 'Score 720 in a mock test', xp: 2000 },
  { id: 'revision_all', icon: '🔄', title: 'Revision King', desc: 'Complete 50 revisions', xp: 500 },
  { id: 'error_fixed', icon: '🧠', title: 'Error Buster', desc: 'Revise 20 error notes', xp: 300 },
  { id: 'level_5', icon: '⭐', title: 'Rising Star', desc: 'Reach Level 5', xp: 500 },
  { id: 'level_10', icon: '🌟', title: 'Scholar', desc: 'Reach Level 10', xp: 1000 },
  { id: 'hours_100', icon: '⏱️', title: 'Century Hours', desc: 'Study 100 hours total', xp: 800 },
  { id: 'goal_master', icon: '🎯', title: 'Goal Setter', desc: 'Complete 10 goals', xp: 300 },
];

export default function Achievements() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const u = await db.auth.me();
      const [profs, sessions, notes, formulas, tests, revisions, errors, goals] = await Promise.all([
        db.entities.UserProfile.filter({ user_id: u.id }),
        db.entities.StudySession.filter({ user_id: u.id }),
        db.entities.Note.filter({ user_id: u.id }),
        db.entities.Formula.filter({ user_id: u.id }),
        db.entities.MockTest.filter({ user_id: u.id }),
        db.entities.RevisionTask.filter({ user_id: u.id }),
        db.entities.ErrorNote.filter({ user_id: u.id }),
        db.entities.Goal.filter({ user_id: u.id }),
      ]);
      setProfile(profs[0] || null);
      setStats({
        sessions: sessions.length,
        streak: profs[0]?.study_streak || 0,
        mcqs: profs[0]?.mcqs_solved || 0,
        notes: notes.length,
        formulas: formulas.length,
        tests: tests.length,
        bestScore: tests.length > 0 ? Math.max(...tests.map(t => t.total_marks || 0)) : 0,
        revisions: revisions.filter(r => r.status === 'completed').length,
        errorsRevised: errors.filter(e => e.is_revised).length,
        level: profs[0]?.level || 1,
        totalHours: Math.round(sessions.reduce((a, s) => a + (s.duration_minutes || 0), 0) / 60),
        goalsCompleted: goals.filter(g => g.is_completed).length,
      });
      setLoading(false);
    };
    load();
  }, []);

  const isUnlocked = (badge) => {
    const s = stats;
    switch (badge.id) {
      case 'first_session': return s.sessions >= 1;
      case 'streak_7': return s.streak >= 7;
      case 'streak_30': return s.streak >= 30;
      case 'mcq_100': return s.mcqs >= 100;
      case 'mcq_1000': return s.mcqs >= 1000;
      case 'notes_10': return s.notes >= 10;
      case 'formula_master': return s.formulas >= 20;
      case 'mock_5': return s.tests >= 5;
      case 'mock_720': return s.bestScore >= 700;
      case 'revision_all': return s.revisions >= 50;
      case 'error_fixed': return s.errorsRevised >= 20;
      case 'level_5': return s.level >= 5;
      case 'level_10': return s.level >= 10;
      case 'hours_100': return s.totalHours >= 100;
      case 'goal_master': return s.goalsCompleted >= 10;
      default: return false;
    }
  };

  const unlocked = ALL_BADGES.filter(b => isUnlocked(b));
  const locked = ALL_BADGES.filter(b => !isUnlocked(b));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div>
        <h2 className="font-heading font-bold text-2xl text-foreground">Achievements</h2>
        <p className="text-muted-foreground text-sm">{unlocked.length} / {ALL_BADGES.length} badges earned</p>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-heading font-bold text-foreground text-sm">Achievement Progress</span>
          <span className="badge-purple">{Math.round((unlocked.length / ALL_BADGES.length) * 100)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(unlocked.length / ALL_BADGES.length) * 100}%` }} />
        </div>
      </div>

      {unlocked.length > 0 && (
        <div>
          <h3 className="font-heading font-semibold text-foreground text-base mb-4">🏆 Earned Badges</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            {unlocked.map(b => (
              <div key={b.id} className="glass-card p-4 text-center border-2 border-amber-200 bg-amber-50/30">
                <div className="text-4xl mb-2">{b.icon}</div>
                <div className="font-heading font-bold text-foreground text-xs mb-1">{b.title}</div>
                <div className="text-muted-foreground text-[10px] mb-2">{b.desc}</div>
                <span className="badge-orange text-[10px]">+{b.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-heading font-semibold text-muted-foreground text-base mb-4">🔒 Locked Badges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {locked.map(b => (
            <div key={b.id} className="glass-card p-4 text-center opacity-50">
              <div className="text-4xl mb-2 grayscale">{b.icon}</div>
              <div className="font-heading font-bold text-foreground text-xs mb-1">{b.title}</div>
              <div className="text-muted-foreground text-[10px] mb-2">{b.desc}</div>
              <span className="badge-purple text-[10px]">+{b.xp} XP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}