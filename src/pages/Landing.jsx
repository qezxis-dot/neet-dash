import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
{ label: 'Features', href: '#features' },
{ label: 'How It Works', href: '#how-it-works' },
{ label: 'Subjects', href: '#subjects' },
{ label: 'FAQ', href: '#faq' }];

const FEATURES = [
{ icon: '🧬', title: 'Smart Revision Planner', desc: 'Spaced repetition at Day 1, 3, 7, 15, 30, 60. Never forget what you studied.', color: 'clay-purple' },
{ icon: '📊', title: 'Live Analytics', desc: 'Track accuracy, study hours, heatmaps, and predicted NEET scores in real time.', color: 'clay-blue' },
{ icon: '⚗️', title: 'Formula Bank', desc: '1000+ rendered equations with LaTeX, bookmarks, chapter filters, and one-click copy.', color: 'clay-green' },
{ icon: '📄', title: 'PYQ Library', desc: 'Previous Year Papers filterable by year, subject, difficulty — all free.', color: 'clay-orange' },
{ icon: '🧠', title: 'Error Notebook', desc: 'Log every mistake with type, reason, and concept — built-in weakness detector.', color: 'clay-pink' },
{ icon: '⏱️', title: 'Study Timer', desc: 'Pomodoro, 50-min focus, or custom sessions with XP rewards and statistics.', color: 'clay-teal' },
{ icon: '🏆', title: 'Achievements & XP', desc: 'Level up with XP, earn badges, maintain streaks — gamified NEET preparation.', color: 'clay-yellow' },
{ icon: '🔍', title: 'Global Search', desc: 'Instantly find notes, formulas, PYQs, and resources across the entire platform.', color: 'clay-purple' }];

const SUBJECTS_INFO = [
{ name: 'Biology', icon: '🧬', chapters: 38, color: 'clay-orange', desc: 'Living World to Environmental Issues — all 38 NCERT chapters covered' },
{ name: 'Physics', icon: '⚛️', chapters: 29, color: 'clay-blue', desc: 'Units to Semiconductor Electronics — complete Class 11 & 12 syllabus' },
{ name: 'Chemistry', icon: '⚗️', chapters: 29, color: 'clay-green', desc: 'Basic Concepts to Chemistry in Everyday Life — full organic & inorganic' }];

const FAQS = [
{ q: 'Is NEET Command Center completely free?', a: 'Yes — 100% free, forever. All features including Formula Bank, PYQ Library, Revision Planner, Analytics, and Mock Tests are available at no cost.' },
{ q: 'Can I access it on mobile?', a: 'Yes! NEET Command Center is fully responsive and works beautifully on phones, tablets, and desktops.' },
{ q: 'How does the revision planner work?', a: 'Based on spaced repetition research, once you mark a chapter complete, it schedules revision at Day 1, 3, 7, 15, 30, and 60 — automatically.' },
{ q: 'Are all NEET chapters available?', a: 'Yes — all 38 Biology, 29 Physics, and 29 Chemistry NEET chapters are pre-loaded, with formulas for every chapter.' },
{ q: 'Is my data secure?', a: 'All data is encrypted, backed up daily, and never shared. Your study data belongs to you.' },
{ q: 'Who manages the content?', a: 'Verified admins curate and upload PYQs and formulas. Users can also add their own notes and custom formulas.' }];

const STATS = [
{ value: '100%', label: 'Free Forever' },
{ value: '96', label: 'Total Chapters' },
{ value: '1000+', label: 'Formulas Ready' },
{ value: '0₹', label: 'No Hidden Fees' }];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenu(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Animated clay blob background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="clay-blob absolute top-[-10%] left-[10%] w-[500px] h-[500px] opacity-10" style={{ background: '#9B6EF3' }} />
        <div className="clay-blob absolute top-[30%] right-[5%] w-[400px] h-[400px] opacity-7" style={{ background: '#6EA8F3', animationDelay: '3s' }} />
        <div className="clay-blob absolute bottom-[10%] left-[30%] w-[350px] h-[350px] opacity-6" style={{ background: '#6EE7A0', animationDelay: '6s' }} />
        <div className="bg-grid absolute inset-0 opacity-20" />
      </div>

      {/* NAVBAR */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}
      style={scrolled ? { background: 'hsl(230 14% 11%)', borderBottom: '1.5px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' } : {}}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl clay-purple flex items-center justify-center text-white font-bold text-sm">N</div>
            <span className="font-heading font-bold text-lg text-foreground">NEET CSS </span>
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(110,231,160,0.18)', border: '1.5px solid rgba(110,231,160,0.3)', color: '#8EFFC4' }}>FREE</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) =>
            <button key={link.href} onClick={() => scrollTo(link.href)}
            className="px-4 py-2 rounded-2xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                {link.label}
              </button>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Log In
            </Link>
            <Link to="/register" className="btn-primary text-sm">
              Get Started Free →
            </Link>
          </div>

          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg text-muted-foreground">
            <div className="space-y-1.5">
              <span className={`block h-0.5 w-6 bg-current transition-all ${mobileMenu ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 w-6 bg-current transition-all ${mobileMenu ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-6 bg-current transition-all ${mobileMenu ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        <AnimatePresence>
          {mobileMenu &&
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-white/5 px-6 py-4 space-y-1"
          style={{ background: 'hsl(230 14% 11%)' }}>
              {NAV_LINKS.map((link) =>
            <button key={link.href} onClick={() => scrollTo(link.href)}
            className="block w-full text-left px-4 py-3 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">
                  {link.label}
                </button>
            )}
              <div className="pt-3 space-y-2">
                <Link to="/login" className="block w-full btn-secondary text-center">Log In</Link>
                <Link to="/register" className="block w-full btn-primary text-center">Get Started Free →</Link>
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
          style={{ background: 'rgba(110,231,160,0.1)', border: '1.5px solid rgba(110,231,160,0.25)', color: '#8EFFC4', boxShadow: '0 4px 16px rgba(110,231,160,0.12)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            100% Free — No Credit Card Required
          </div>

          <h1 className="font-heading font-bold text-5xl md:text-7xl lg:text-8xl leading-tight mb-6">
            <span className="text-foreground">Command Your</span>
            <br />
            <span className="text-gradient">NEET Journey</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            The most advanced NEET preparation platform — with smart revision, formula bank,
            PYQ library, analytics, and gamified learning. Free for every student, always.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/register" className="btn-primary text-base px-8 py-4">
              Start Free Today →
            </Link>
            <button onClick={() => scrollTo('#features')} className="btn-secondary text-base px-8 py-4">
              Explore Features
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map((s, i) =>
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
            className="glass-card rounded-2xl p-4">
                <div className="text-2xl font-heading font-bold text-gradient mb-1">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Dashboard preview mock */}
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }}
        className="relative mt-20 w-full max-w-6xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" style={{ top: '60%' }} />
          <div className="glass-card rounded-3xl p-1 glow-purple">
            <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(230 15% 9%)' }}>
              <div className="flex h-[420px]">
                <div className="w-52 border-r border-white/5 p-4 space-y-1 hidden md:block">
                  <div className="flex items-center gap-2 mb-6 px-2">
                    <div className="w-8 h-8 rounded-lg clay-purple" />
                    <div>
                      <div className="text-xs font-bold text-foreground">NEET Command</div>
                      <div className="text-[10px] text-muted-foreground">Free Forever 🎉</div>
                    </div>
                  </div>
                  {['Dashboard', 'Subjects', 'Formula Bank', 'PYQ Library', 'Revision', 'Mock Tests', 'Analytics'].map((item, i) =>
                  <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs ${i === 0 ? 'text-purple-300' : 'text-muted-foreground'}`}
                  style={i === 0 ? { background: 'rgba(155,110,243,0.15)', border: '1.5px solid rgba(155,110,243,0.25)' } : {}}>
                      <span className="w-4 h-4 rounded-lg bg-white/8" />
                      {item}
                    </div>
                  )}
                </div>
                <div className="flex-1 p-5 space-y-4 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-foreground font-bold text-sm">Good Morning, Aryan 👋</div>
                      <div className="text-muted-foreground text-xs">NEET 2025 — 187 days remaining</div>
                    </div>
                    <div className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(155,110,243,0.15)', color: '#C4A8FF', border: '1.5px solid rgba(155,110,243,0.25)' }}>⚡ Level 12</div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                    { label: 'Study Streak', val: '23 days', color: '#FFB89A' },
                    { label: 'MCQs Solved', val: '3,847', color: '#A8CCFF' },
                    { label: 'Accuracy', val: '73.2%', color: '#8EFFC4' },
                    { label: 'XP Points', val: '12,400', color: '#C4A8FF' }].
                    map((s) =>
                    <div key={s.label} className="rounded-2xl p-3" style={{ background: 'hsl(230 14% 14%)', border: '1.5px solid rgba(255,255,255,0.05)', boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset' }}>
                        <div className="text-sm font-bold" style={{ color: s.color }}>{s.val}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl p-3" style={{ background: 'hsl(230 14% 14%)', border: '1.5px solid rgba(255,255,255,0.05)' }}>
                    <div className="text-xs text-muted-foreground mb-2">Study Heatmap — Last 12 weeks</div>
                    <div className="flex gap-1 flex-wrap">
                      {Array.from({ length: 84 }).map((_, i) => {
                        const level = Math.floor(Math.random() * 5);
                        const opacities = ['0.07', '0.25', '0.50', '0.75', '1.0'];
                        return <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(155,110,243,${opacities[level]})` }} />;
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['Physics 72%', 'Chemistry 68%', 'Biology 81%'].map((s, i) => {
                      const pct = [72, 68, 81][i];
                      const colors = ['#6EA8F3', '#6EE7A0', '#F3956E'];
                      return (
                        <div key={s} className="rounded-2xl p-3" style={{ background: 'hsl(230 14% 14%)', border: '1.5px solid rgba(255,255,255,0.05)' }}>
                          <div className="text-[10px] text-muted-foreground mb-2">{s.split(' ')[0]}</div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i] }} />
                          </div>
                          <div className="text-xs font-bold text-foreground mt-1">{pct}%</div>
                        </div>);

                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{ background: 'rgba(110,168,243,0.1)', border: '1.5px solid rgba(110,168,243,0.25)', color: '#A8CCFF' }}>
              Everything You Need — All Free
            </div>
            <h2 className="font-heading font-bold text-4xl md:text-6xl text-foreground mb-6">
              Built for <span className="text-gradient">Serious</span> NEET Aspirants
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Every feature engineered to maximize your NEET score — backed by spaced repetition science, free for every student.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) =>
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
            className="glass-card rounded-3xl p-6 cursor-default">
                <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center text-2xl mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-heading font-bold text-foreground text-base mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* SUBJECTS */}
      <section id="subjects" className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-4">
              All <span className="text-gradient">NEET Chapters</span> Pre-loaded
            </h2>
            <p className="text-muted-foreground">Every chapter from the official NEET syllabus — ready to track and study.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {SUBJECTS_INFO.map((s, i) =>
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="glass-card rounded-3xl p-8 text-center">
                <div className={`w-16 h-16 rounded-2xl ${s.color} flex items-center justify-center text-3xl mx-auto mb-5`}>
                  {s.icon}
                </div>
                <h3 className="font-heading font-bold text-foreground text-xl mb-2">{s.name}</h3>
                <div className="text-3xl font-heading font-bold text-gradient mb-3">{s.chapters} Chapters</div>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-muted-foreground">From signup to NEET success in 4 simple steps.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
            { step: '01', title: 'Create Account', desc: 'Sign up free and set your NEET target date and score goal.' },
            { step: '02', title: 'Track Chapters', desc: 'All 96 NEET chapters pre-loaded. Mark progress as you study.' },
            { step: '03', title: 'Study with Tools', desc: 'Use Timer, Formula Bank, Notes, PYQs — everything in one place.' },
            { step: '04', title: 'Analyze & Improve', desc: 'Review analytics, fix weak chapters, predict your NEET score.' }].
            map((s, i) =>
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="text-center">
                <div className="w-16 h-16 rounded-2xl clay-purple flex items-center justify-center mx-auto mb-4"
              style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 -3px 0 rgba(0,0,0,0.3) inset, 0 8px 24px rgba(155,110,243,0.35)' }}>
                  <span className="font-heading font-bold text-xl text-white">{s.step}</span>
                </div>
                <h3 className="font-heading font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-4">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) =>
            <div key={i} className="glass-card rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-5 text-left">
                  <span className="font-medium text-foreground text-sm">{faq.q}</span>
                  <span className="text-purple-400 transition-transform duration-200 text-lg flex-shrink-0 ml-4" style={{ transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                <AnimatePresence>
                  {openFaq === i &&
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed border-t border-white/5 pt-3">{faq.a}</div>
                    </motion.div>
                }
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-16 glow-purple relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(155,110,243,0.08), rgba(110,168,243,0.05))' }} />
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6 relative z-10"
            style={{ background: 'rgba(110,231,160,0.12)', border: '1.5px solid rgba(110,231,160,0.3)', color: '#8EFFC4' }}>
              🎉 Forever Free — No Subscriptions
            </div>
            <h2 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-4 relative z-10">
              Ready to <span className="text-gradient">Command</span> Your NEET?
            </h2>
            <p className="text-muted-foreground mb-10 relative z-10">
              Join students cracking NEET with Command Center. Start free — always.
            </p>
            <Link to="/register" className="btn-primary text-base px-10 py-4 relative z-10">
              Create Free Account →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl clay-purple flex items-center justify-center text-white font-bold text-sm">N</div>
            <div>
              <span className="font-heading font-bold text-foreground">NEET Command</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(110,231,160,0.12)', color: '#8EFFC4', border: '1.5px solid rgba(110,231,160,0.25)' }}>FREE</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">© 2025 NEET Command Center. Free for every student.</p>
          <div className="flex items-center gap-2">
            {['Twitter', 'YouTube', 'Instagram', 'Discord'].map((s) =>
            <a key={s} href="#" className="px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">{s}</a>
            )}
          </div>
        </div>
      </footer>
    </div>);

}