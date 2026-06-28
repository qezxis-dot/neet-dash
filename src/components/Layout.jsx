import { db } from '@/lib/supabase/db';

import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';

const MENU = [
  { path: '/dashboard', icon: '⚡', label: 'Dashboard' },
  { path: '/subjects', icon: '📚', label: 'Subjects' },
  { path: '/formula-bank', icon: '⚗️', label: 'Formula Bank' },
  { path: '/pyq', icon: '📄', label: 'PYQ Library' },
  { path: '/resources', icon: '📁', label: 'Resources' },
  { path: '/notes', icon: '📝', label: 'My Notes' },
  { path: '/revision', icon: '🔄', label: 'Revision Planner' },
  { path: '/mock-tests', icon: '📊', label: 'Mock Tests' },
  { path: '/error-notebook', icon: '🧠', label: 'Error Notebook' },
  { path: '/timer', icon: '⏱️', label: 'Study Timer' },
  { path: '/analytics', icon: '📈', label: 'Analytics' },
  { path: '/goals', icon: '🎯', label: 'Goals' },
  { path: '/achievements', icon: '🏆', label: 'Achievements' },
];

const BOTTOM_MENU = [
  { path: '/admin', icon: '🛡️', label: 'Admin Panel' },
  { path: '/settings', icon: '⚙️', label: 'Settings' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await db.auth.me();
        setUser(u);
        const profiles = await db.entities.UserProfile.filter({ user_id: u.id });
        if (profiles.length > 0) setProfile(profiles[0]);
      } catch {}
    };
    loadUser();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    await db.auth.logout('/');
  };

  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const xpToNext = level * 500;
  const xpPct = Math.min((xp % xpToNext) / xpToNext * 100, 100);

  const isAdmin = user?.role === 'admin';

  const Sidebar = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <Link to="/dashboard" className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl clay-purple flex items-center justify-center text-white font-bold text-sm flex-shrink-0">N</div>
          {(sidebarOpen || mobile) && (
            <div>
              <div className="text-sm font-heading font-bold text-foreground leading-none">NEET Command</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Free Forever 🎉</div>
            </div>
          )}
        </Link>
        {!mobile && (
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground transition-colors ml-auto p-1 rounded-lg hover:bg-white/5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M11 19l-7-7 7-7" : "M13 5l7 7-7 7"} />
            </svg>
          </button>
        )}
      </div>

      {/* Search shortcut */}
      {(sidebarOpen || mobile) && (
        <div className="px-3 py-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-xs text-muted-foreground border border-white/6 hover:border-white/12 transition-all"
            style={{ background: 'hsl(230 15% 11%)' }}
          >
            <span>🔍</span>
            <span className="flex-1 text-left">Search...</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-lg border border-white/8" style={{ background: 'hsl(230 15% 14%)' }}>⌘K</span>
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 space-y-0.5 py-2">
        {MENU.map(item => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileSidebar(false)}
              className={`sidebar-item ${active ? 'active' : ''}`}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {(sidebarOpen || mobile) && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom menu */}
      <div className="border-t border-white/5 px-3 py-3 space-y-0.5">
        {BOTTOM_MENU.filter(item => item.path !== '/admin' || isAdmin).map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={() => setMobileSidebar(false)}
              className={`sidebar-item ${active ? 'active' : ''}`}>
              <span className="text-base">{item.icon}</span>
              {(sidebarOpen || mobile) && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
        {(sidebarOpen || mobile) && user && (
          <div className="mt-3 p-3 rounded-2xl border border-white/6" style={{ background: 'hsl(230 14% 11%)', boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset, 0 -2px 0 rgba(0,0,0,0.3) inset, 0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 clay-purple">
                {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-foreground truncate">{user.full_name || user.email}</div>
                <div className="text-[10px] text-purple-400 font-semibold">⚡ Level {level}</div>
              </div>
              <button onClick={handleLogout} className="text-muted-foreground hover:text-red-400 transition-colors text-xs p-1 rounded-lg hover:bg-red-400/10" title="Logout">
                ↩
              </button>
            </div>
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-semibold">
              <span>{xp % xpToNext} XP</span>
              <span>→ {xpToNext} XP</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex flex-col flex-shrink-0 border-r border-white/5 transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-16'}`}
        style={{ background: 'hsl(var(--sidebar-background))' }}
      >
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebar(false)}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 md:hidden border-r border-white/5"
              style={{ background: 'hsl(var(--sidebar-background))' }}
            >
              <Sidebar mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center gap-4 px-6 py-4 border-b border-white/5 flex-shrink-0"
          style={{
            background: 'hsl(230 14% 11%)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 2px 12px rgba(0,0,0,0.25)'
          }}
        >
          <button onClick={() => setMobileSidebar(true)} className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1">
            ☰
          </button>
          <div className="flex-1">
            <h1 className="font-heading font-bold text-foreground text-base capitalize">
              {location.pathname.replace('/', '').replace(/-/g, ' ') || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl text-xs text-muted-foreground border border-white/7 hover:border-white/12 transition-all"
              style={{ background: 'hsl(230 15% 13%)' }}
            >
              <span>🔍</span> Search <span className="text-[10px] px-1.5 py-0.5 border border-white/8 rounded-lg" style={{ background: 'hsl(230 15% 16%)' }}>⌘K</span>
            </button>
            {profile?.study_streak > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold"
                style={{ background: 'rgba(243,149,110,0.15)', border: '1.5px solid rgba(243,149,110,0.25)', color: '#FFB89A' }}>
                🔥 {profile.study_streak} day streak
              </div>
            )}
            <Link to="/profile">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-105 transition-transform clay-purple">
                {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin bg-background">
          <div className="page-transition">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xl mx-4 overflow-hidden"
              style={{
                background: 'hsl(230 14% 13%)',
                border: '1.5px solid rgba(255,255,255,0.09)',
                borderRadius: '24px',
                boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 -4px 0 rgba(0,0,0,0.4) inset, 0 32px 80px rgba(0,0,0,0.6)'
              }}
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
                <span className="text-muted-foreground">🔍</span>
                <input
                  ref={searchRef}
                  autoFocus
                  type="text"
                  className="flex-1 bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm font-medium"
                  placeholder="Search notes, formulas, PYQs, resources..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <kbd className="text-muted-foreground text-xs border border-white/8 rounded-lg px-1.5 py-0.5" style={{ background: 'hsl(230 15% 16%)' }}>ESC</kbd>
              </div>
              <div className="p-4">
                {!searchQuery ? (
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs px-2 mb-3 font-semibold uppercase tracking-wider">Quick Navigation</p>
                    {[
                      { label: 'Dashboard', path: '/dashboard', icon: '⚡' },
                      { label: 'Formula Bank', path: '/formula-bank', icon: '⚗️' },
                      { label: 'PYQ Library', path: '/pyq', icon: '📄' },
                      { label: 'Study Timer', path: '/timer', icon: '⏱️' },
                      { label: 'Analytics', path: '/analytics', icon: '📈' },
                    ].map(item => (
                      <Link key={item.path} to={item.path} onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors group"
                        style={{ ':hover': { background: 'rgba(155,110,243,0.09)' } }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(155,110,243,0.09)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span className="text-base">{item.icon}</span>
                        <span className="text-sm text-foreground/70 font-medium group-hover:text-purple-300 transition-colors">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Search results for "<span className="text-foreground/70 font-semibold">{searchQuery}</span>" — use subject pages for detailed results.
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