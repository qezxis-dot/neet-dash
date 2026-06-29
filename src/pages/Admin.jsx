import { db } from '@/lib/supabase/db';
import { supabase } from '@/lib/supabase/client';

import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

const ALL_FORMULAS = [
  { subject: 'Physics', chapter: 'Units and Measurements', title: 'Dimensional Formula of Force', formula_text: '[F] = [MLT⁻²]', latex: '[F] = [MLT^{-2}]', description: 'SI unit: Newton (N)', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Units and Measurements', title: 'Dimensional Formula of Energy', formula_text: '[E] = [ML²T⁻²]', latex: '[E] = [ML^{2}T^{-2}]', description: 'SI unit: Joule (J)', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Units and Measurements', title: 'Percentage Error', formula_text: 'Δa/a × 100%', latex: '\\frac{\\Delta a}{a} \\times 100\\%', description: 'Maximum percentage error in measurement', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Motion in a Straight Line', title: 'First Equation of Motion', formula_text: 'v = u + at', latex: 'v = u + at', description: 'v=final, u=initial velocity, a=acceleration, t=time', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Motion in a Straight Line', title: 'Second Equation of Motion', formula_text: 's = ut + ½at²', latex: 's = ut + \\frac{1}{2}at^2', description: 'Displacement formula', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Motion in a Straight Line', title: 'Third Equation of Motion', formula_text: 'v² = u² + 2as', latex: 'v^2 = u^2 + 2as', description: 'Velocity-displacement relation', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Laws of Motion', title: "Newton's Second Law", formula_text: 'F = ma', latex: 'F = ma', description: 'Force = mass × acceleration', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Laws of Motion', title: 'Impulse', formula_text: 'J = FΔt = Δp', latex: 'J = F\\Delta t = \\Delta p', description: 'Change in momentum', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Laws of Motion', title: 'Friction Force', formula_text: 'f = μN', latex: 'f = \\mu N', description: 'μ = coefficient of friction, N = normal force', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Work Energy and Power', title: 'Work Done', formula_text: 'W = F·d·cos θ', latex: 'W = Fd\\cos\\theta', description: 'Work = Force × displacement × cos(angle)', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Work Energy and Power', title: 'Kinetic Energy', formula_text: 'KE = ½mv²', latex: 'KE = \\frac{1}{2}mv^2', description: 'Energy of motion', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Work Energy and Power', title: 'Potential Energy (Gravitational)', formula_text: 'PE = mgh', latex: 'PE = mgh', description: 'Gravitational potential energy', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Work Energy and Power', title: 'Power', formula_text: 'P = W/t = F·v', latex: 'P = \\frac{W}{t} = F \\cdot v', description: 'Rate of doing work', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Gravitation', title: "Newton's Law of Gravitation", formula_text: 'F = Gm₁m₂/r²', latex: 'F = \\frac{Gm_1m_2}{r^2}', description: 'G = 6.67×10⁻¹¹ N m² kg⁻²', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Gravitation', title: 'Escape Velocity', formula_text: 'vₑ = √(2GM/R)', latex: 'v_e = \\sqrt{\\frac{2GM}{R}}', description: '≈ 11.2 km/s for Earth', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Thermodynamics', title: 'First Law of Thermodynamics', formula_text: 'ΔU = Q - W', latex: '\\Delta U = Q - W', description: 'Change in internal energy', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Thermodynamics', title: 'Ideal Gas Law', formula_text: 'PV = nRT', latex: 'PV = nRT', description: 'R = 8.314 J/mol·K', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Electric Charges and Fields', title: "Coulomb's Law", formula_text: 'F = kq₁q₂/r²', latex: 'F = \\frac{kq_1q_2}{r^2}', description: 'k = 9×10⁹ N m² C⁻²', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Electric Charges and Fields', title: "Gauss's Law", formula_text: 'φ = Q/ε₀', latex: '\\phi = \\frac{Q}{\\varepsilon_0}', description: 'Total electric flux through closed surface', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Electrostatic Potential and Capacitance', title: 'Capacitance', formula_text: 'C = Q/V', latex: 'C = \\frac{Q}{V}', description: 'Charge stored per volt', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Current Electricity', title: "Ohm's Law", formula_text: 'V = IR', latex: 'V = IR', description: 'Voltage = Current × Resistance', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Current Electricity', title: 'Power Dissipation', formula_text: 'P = VI = I²R = V²/R', latex: 'P = VI = I^2R = \\frac{V^2}{R}', description: 'Electrical power', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Alternating Current', title: 'Impedance of LCR', formula_text: 'Z = √(R² + (XL-XC)²)', latex: 'Z = \\sqrt{R^2 + (X_L - X_C)^2}', description: 'Total impedance in AC circuit', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Alternating Current', title: 'Resonant Frequency', formula_text: 'f₀ = 1/(2π√LC)', latex: 'f_0 = \\frac{1}{2\\pi\\sqrt{LC}}', description: 'At resonance XL = XC', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Ray Optics', title: "Snell's Law", formula_text: 'n₁sin θ₁ = n₂sin θ₂', latex: 'n_1\\sin\\theta_1 = n_2\\sin\\theta_2', description: 'Law of refraction', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Ray Optics', title: 'Lens Formula', formula_text: '1/f = 1/v - 1/u', latex: '\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}', description: 'Thin lens formula', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Dual Nature of Radiation and Matter', title: "Planck's Equation", formula_text: 'E = hf = hc/λ', latex: 'E = hf = \\frac{hc}{\\lambda}', description: 'h = 6.63×10⁻³⁴ J·s (Planck constant)', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Dual Nature of Radiation and Matter', title: 'de Broglie Wavelength', formula_text: 'λ = h/mv = h/p', latex: '\\lambda = \\frac{h}{mv} = \\frac{h}{p}', description: 'Wave nature of matter', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Atoms', title: "Bohr's Energy", formula_text: 'Eₙ = -13.6/n² eV', latex: 'E_n = -\\frac{13.6}{n^2} \\text{ eV}', description: 'Energy of nth orbit in hydrogen', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Nuclei', title: 'Mass-Energy Equivalence', formula_text: 'E = mc²', latex: 'E = mc^2', description: 'Einstein equation, c = 3×10⁸ m/s', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Nuclei', title: 'Radioactive Decay Law', formula_text: 'N = N₀e^(-λt)', latex: 'N = N_0 e^{-\\lambda t}', description: 'N₀=initial, λ=decay constant', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Nuclei', title: 'Half Life', formula_text: 'T½ = 0.693/λ', latex: 'T_{1/2} = \\frac{0.693}{\\lambda}', description: 'Time for half the nuclei to decay', is_important: true, is_admin_formula: true },
  { subject: 'Physics', chapter: 'Oscillations', title: 'Time Period of Simple Pendulum', formula_text: 'T = 2π√(L/g)', latex: 'T = 2\\pi\\sqrt{\\frac{L}{g}}', description: 'L = length, g = gravity', is_important: true, is_admin_formula: true },
  { subject: 'Chemistry', chapter: 'Some Basic Concepts of Chemistry', title: 'Mole Concept', formula_text: 'n = mass/molar mass', latex: 'n = \\frac{\\text{mass}}{\\text{molar mass}}', description: '1 mole = 6.022×10²³ particles', is_important: true, is_admin_formula: true },
  { subject: 'Chemistry', chapter: 'Some Basic Concepts of Chemistry', title: 'Molarity', formula_text: 'M = moles of solute / volume(L)', latex: 'M = \\frac{n}{V(L)}', description: 'Concentration in mol/L', is_important: true, is_admin_formula: true },
  { subject: 'Chemistry', chapter: 'Thermodynamics', title: 'Gibbs Free Energy', formula_text: 'ΔG = ΔH - TΔS', latex: '\\Delta G = \\Delta H - T\\Delta S', description: 'Spontaneity: ΔG < 0 spontaneous', is_important: true, is_admin_formula: true },
  { subject: 'Chemistry', chapter: 'Thermodynamics', title: 'Enthalpy', formula_text: 'ΔH = ΔU + ΔnᵍRT', latex: '\\Delta H = \\Delta U + \\Delta n_g RT', description: 'Δnᵍ = moles of gas (products - reactants)', is_important: true, is_admin_formula: true },
  { subject: 'Chemistry', chapter: 'Equilibrium', title: 'Equilibrium Constant', formula_text: 'Kc = [C]^c[D]^d / [A]^a[B]^b', latex: 'K_c = \\frac{[C]^c[D]^d}{[A]^a[B]^b}', description: 'For aA + bB ⇌ cC + dD', is_important: true, is_admin_formula: true },
  { subject: 'Chemistry', chapter: 'Equilibrium', title: 'pH Formula', formula_text: 'pH = -log[H⁺]', latex: 'pH = -\\log[H^+]', description: 'Measure of acidity', is_important: true, is_admin_formula: true },
  { subject: 'Chemistry', chapter: 'Electrochemistry', title: 'Nernst Equation', formula_text: 'E = E° - (RT/nF)ln Q', latex: 'E = E^\\circ - \\frac{RT}{nF}\\ln Q', description: 'At 25°C: E = E° - 0.0591/n × log Q', is_important: true, is_admin_formula: true },
  { subject: 'Chemistry', chapter: 'Electrochemistry', title: 'Gibbs-EMF Relation', formula_text: 'ΔG° = -nFE°', latex: '\\Delta G^\\circ = -nFE^\\circ', description: 'F = 96500 C/mol (Faraday constant)', is_important: true, is_admin_formula: true },
  { subject: 'Chemistry', chapter: 'Chemical Kinetics', title: 'Rate of Reaction', formula_text: 'rate = k[A]^m[B]^n', latex: 'r = k[A]^m[B]^n', description: 'k = rate constant, m,n = order', is_important: true, is_admin_formula: true },
  { subject: 'Chemistry', chapter: 'Chemical Kinetics', title: "Arrhenius Equation", formula_text: 'k = Ae^(-Ea/RT)', latex: 'k = Ae^{-E_a/RT}', description: 'Ea = activation energy', is_important: true, is_admin_formula: true },
  { subject: 'Chemistry', chapter: 'Solutions', title: 'Elevation of Boiling Point', formula_text: 'ΔTb = Kb × m', latex: '\\Delta T_b = K_b \\cdot m', description: 'Kb = ebullioscopic constant, m = molality', is_important: true, is_admin_formula: true },
  { subject: 'Chemistry', chapter: 'Solutions', title: 'Osmotic Pressure', formula_text: 'π = MRT', latex: '\\pi = MRT', description: 'M = molarity, R = gas constant, T = temperature', is_important: true, is_admin_formula: true },
  { subject: 'Chemistry', chapter: 'Structure of Atom', title: "Heisenberg's Uncertainty", formula_text: 'Δx·Δp ≥ h/4π', latex: '\\Delta x \\cdot \\Delta p \\geq \\frac{h}{4\\pi}', description: 'Cannot know position and momentum exactly', is_important: true, is_admin_formula: true },
  { subject: 'Biology', chapter: 'Molecular Basis of Inheritance', title: "Chargaff's Rules", formula_text: 'A = T, G = C; (A+G) = (T+C)', latex: 'A=T,\\; G=C,\\; A+G = T+C', description: 'Base pairing rules in DNA', is_important: true, is_admin_formula: true },
  { subject: 'Biology', chapter: 'Molecular Basis of Inheritance', title: 'Central Dogma', formula_text: 'DNA → RNA → Protein', latex: 'DNA \\rightarrow RNA \\rightarrow Protein', description: 'Flow of genetic information', is_important: true, is_admin_formula: true },
  { subject: 'Biology', chapter: 'Principles of Inheritance and Variation', title: "Mendel's Law of Segregation", formula_text: 'Monohybrid ratio: 3:1 (F2)', latex: '3:1 \\text{ (phenotype)} = 1:2:1 \\text{ (genotype)}', description: 'F2 phenotype to genotype ratio', is_important: true, is_admin_formula: true },
  { subject: 'Biology', chapter: 'Principles of Inheritance and Variation', title: "Hardy-Weinberg Principle", formula_text: 'p² + 2pq + q² = 1; p + q = 1', latex: 'p^2 + 2pq + q^2 = 1', description: 'Allele frequencies in a population', is_important: true, is_admin_formula: true },
  { subject: 'Biology', chapter: 'Photosynthesis', title: 'Overall Photosynthesis Equation', formula_text: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', latex: '6CO_2 + 6H_2O \\xrightarrow{\\text{light}} C_6H_{12}O_6 + 6O_2', description: 'Net equation of photosynthesis', is_important: true, is_admin_formula: true },
  { subject: 'Biology', chapter: 'Respiration in Plants', title: 'ATP Yield Aerobic Respiration', formula_text: '1 Glucose → 36-38 ATP (aerobic)', latex: 'C_6H_{12}O_6 + 6O_2 \\rightarrow 6CO_2 + 6H_2O + 36-38\\;ATP', description: 'Total ATP from complete oxidation', is_important: true, is_admin_formula: true },
  { subject: 'Biology', chapter: 'Body Fluids and Circulation', title: 'Cardiac Output', formula_text: 'CO = Stroke Volume × Heart Rate', latex: 'CO = SV \\times HR', description: 'Normal CO ≈ 5L/min', is_important: true, is_admin_formula: true },
  { subject: 'Biology', chapter: 'Ecosystem', title: 'Net Primary Productivity', formula_text: 'NPP = GPP - R', latex: 'NPP = GPP - R', description: 'GPP = Gross, R = Respiration', is_important: true, is_admin_formula: true },
  { subject: 'Biology', chapter: 'Organisms and Populations', title: 'Population Growth (Exponential)', formula_text: 'dN/dt = rN', latex: '\\frac{dN}{dt} = rN', description: 'r = intrinsic rate of natural increase', is_important: true, is_admin_formula: true },
  { subject: 'Biology', chapter: 'Organisms and Populations', title: 'Population Growth (Logistic)', formula_text: 'dN/dt = rN(K-N)/K', latex: '\\frac{dN}{dt} = rN\\frac{(K-N)}{K}', description: 'K = carrying capacity', is_important: true, is_admin_formula: true },
];

const TABS = [
  { id: 'overview', label: '📊 Overview', icon: '📊' },
  { id: 'users', label: '👥 Users', icon: '👥' },
  { id: 'formulas', label: '⚗️ Formula Seeder', icon: '⚗️' },
  { id: 'announcements', label: '📢 Announcements', icon: '📢' },
  { id: 'pyq', label: '📄 PYQ Upload', icon: '📄' },
  { id: 'content', label: '🗂️ Content', icon: '🗂️' },
];

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  // Stats
  const [stats, setStats] = useState({ formulas: 0, chapters: 0, users: 0, notes: 0, sessions: 0, mockTests: 0, pyqs: 0, errors: 0 });

  // Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Formulas
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [annForm, setAnnForm] = useState({ title: '', content: '', type: 'info', is_pinned: false });
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annSaving, setAnnSaving] = useState(false);

  // Content stats
  const [contentStats, setContentStats] = useState({ pyqs: 0, resources: 0 });

  // PYQ Upload
  const [pyqs, setPyqs] = useState([]);
  const [pyqForm, setPyqForm] = useState({ title: '', year: new Date().getFullYear(), subject: 'Physics', chapter: '', difficulty: 'Medium', language: 'English', description: '', total_questions: '', total_marks: '' });
  const [pyqFile, setPyqFile] = useState(null);
  const [pyqThumbnail, setPyqThumbnail] = useState(null);
  const [pyqUploading, setPyqUploading] = useState(false);
  const [pyqSaving, setPyqSaving] = useState(false);
  const [showPyqForm, setShowPyqForm] = useState(false);
  const [pyqUploadProgress, setPyqUploadProgress] = useState('');

  useEffect(() => {
    const load = async () => {
      const u = await db.auth.me();
      setUser(u);
      if (u.role !== 'admin') { setLoading(false); return; }

      const [fs, chs, ns, ss, mt, pq, en, anns, usersRes] = await Promise.all([
        db.entities.Formula.list('-created_date', 500),
        db.entities.Chapter.list('-created_date', 500),
        db.entities.Note.list('-created_date', 1),
        db.entities.StudySession.list('-created_date', 1),
        db.entities.MockTest.list('-created_date', 1),
        db.entities.PYQ.list('-created_date', 100),
        db.entities.ErrorNote.list('-created_date', 1),
        db.entities.Announcement.list('-created_date', 50),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200),
      ]);

      const us = usersRes.data || [];

      setStats({
        formulas: fs.length,
        chapters: chs.length,
        users: us.length,
        notes: ns.length,
        sessions: ss.length,
        mockTests: mt.length,
        pyqs: pq.length,
        errors: en.length,
      });
      setUsers(us);
      setAnnouncements(anns);
      setPyqs(pq);
      setLoading(false);
    };
    load();
  }, []);

  const loadUsers = async () => {
    setUsersLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200);
    setUsers(data || []);
    setUsersLoading(false);
  };

  const changeUserRole = async (uid, newRole) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', uid);
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole } : u));
  };

  const seedFormulas = async () => {
    setSeeding(true);
    setSeedDone(false);
    const existing = await db.entities.Formula.filter({ is_admin_formula: true });
    const existingTitles = new Set(existing.map(f => f.title));
    const toAdd = ALL_FORMULAS.filter(f => !existingTitles.has(f.title));
    if (toAdd.length > 0) {
      await db.entities.Formula.bulkCreate(toAdd.map(f => ({ ...f, user_id: null })));
    }
    setStats(s => ({ ...s, formulas: existing.length + toAdd.length }));
    setSeedDone(true);
    setSeeding(false);
  };

  const clearAdminFormulas = async () => {
    if (!confirm('Delete ALL admin-seeded formulas? This cannot be undone.')) return;
    await db.entities.Formula.deleteMany({ is_admin_formula: true });
    setStats(s => ({ ...s, formulas: s.formulas - ALL_FORMULAS.length < 0 ? 0 : s.formulas - ALL_FORMULAS.length }));
    setSeedDone(false);
  };

  const saveAnnouncement = async () => {
    if (!annForm.title.trim() || !annForm.content.trim()) return;
    setAnnSaving(true);
    const created = await db.entities.Announcement.create({ ...annForm, created_by: user.id, is_active: true });
    setAnnouncements(prev => [created, ...prev]);
    setAnnForm({ title: '', content: '', type: 'info', is_pinned: false });
    setShowAnnForm(false);
    setAnnSaving(false);
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    await db.entities.Announcement.delete(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const toggleAnnPin = async (ann) => {
    const updated = await db.entities.Announcement.update(ann.id, { is_pinned: !ann.is_pinned });
    setAnnouncements(prev => prev.map(a => a.id === ann.id ? updated : a));
  };

  const savePyq = async () => {
    if (!pyqForm.title.trim() || !pyqFile) return;
    setPyqSaving(true);
    try {
      // Upload PDF
      setPyqUploadProgress('Uploading PDF...');
      setPyqUploading(true);
      const pdfRes = await db.integrations.Core.UploadFile({ file: pyqFile });
      const pdfUrl = pdfRes.file_url;

      // Upload thumbnail if provided
      let thumbnailUrl = '';
      if (pyqThumbnail) {
        setPyqUploadProgress('Uploading thumbnail...');
        const thumbRes = await db.integrations.Core.UploadFile({ file: pyqThumbnail });
        thumbnailUrl = thumbRes.file_url;
      }
      setPyqUploading(false);
      setPyqUploadProgress('Saving to database...');

      const payload = {
        ...pyqForm,
        year: Number(pyqForm.year),
        total_questions: pyqForm.total_questions ? Number(pyqForm.total_questions) : null,
        total_marks: pyqForm.total_marks ? Number(pyqForm.total_marks) : null,
        pdf_url: pdfUrl,
        thumbnail_url: thumbnailUrl || null,
        is_published: true,
        is_admin_content: true,
        created_by: user.id,
      };

      const created = await db.entities.PYQ.create(payload);
      setPyqs(prev => [created, ...prev]);
      setStats(s => ({ ...s, pyqs: s.pyqs + 1 }));
      setPyqForm({ title: '', year: new Date().getFullYear(), subject: 'Physics', chapter: '', difficulty: 'Medium', language: 'English', description: '', total_questions: '', total_marks: '' });
      setPyqFile(null);
      setPyqThumbnail(null);
      setShowPyqForm(false);
      setPyqUploadProgress('');
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setPyqSaving(false);
      setPyqUploading(false);
      setPyqUploadProgress('');
    }
  };

  const deletePyq = async (id) => {
    if (!confirm('Delete this PYQ paper? This cannot be undone.')) return;
    await db.entities.PYQ.delete(id);
    setPyqs(prev => prev.filter(p => p.id !== id));
    setStats(s => ({ ...s, pyqs: s.pyqs - 1 }));
  };

  const clearAllChapters = async () => {
    if (!confirm('Delete ALL chapters from all users? This is irreversible.')) return;
    await db.entities.Chapter.deleteMany({});
    setStats(s => ({ ...s, chapters: 0 }));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
    </div>
  );

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="glass-card rounded-3xl p-12 text-center max-w-md">
          <div className="text-5xl mb-4">🛡️</div>
          <h2 className="font-heading font-bold text-xl text-foreground mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground text-sm">You need admin role to access this panel. Contact the app owner.</p>
        </div>
      </div>
    );
  }

  const annTypeColors = {
    info: { bg: 'rgba(110,168,243,0.15)', border: 'rgba(110,168,243,0.3)', color: '#A8CCFF', label: 'Info' },
    warning: { bg: 'rgba(243,213,110,0.15)', border: 'rgba(243,213,110,0.3)', color: '#FFE47A', label: 'Warning' },
    success: { bg: 'rgba(110,231,160,0.15)', border: 'rgba(110,231,160,0.3)', color: '#8EFFC4', label: 'Success' },
    urgent: { bg: 'rgba(243,110,110,0.15)', border: 'rgba(243,110,110,0.3)', color: '#FF9A9A', label: 'Urgent' },
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">Admin Panel</h2>
          <p className="text-muted-foreground text-sm">Logged in as <span className="text-purple-300 font-semibold">{user?.email}</span></p>
        </div>
        <div className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: 'rgba(155,110,243,0.2)', border: '1.5px solid rgba(155,110,243,0.35)', color: '#C4A8FF' }}>
          🛡️ Admin
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={tab === t.id
              ? { background: 'rgba(155,110,243,0.25)', border: '1.5px solid rgba(155,110,243,0.4)', color: '#C4A8FF' }
              : { background: 'hsl(230 14% 14%)', border: '1.5px solid rgba(255,255,255,0.06)', color: 'hsl(230 10% 55%)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.users, icon: '👥', color: '#C4A8FF' },
              { label: 'Total Formulas', value: stats.formulas, icon: '⚗️', color: '#A8CCFF' },
              { label: 'Total Chapters', value: stats.chapters, icon: '📚', color: '#8EFFC4' },
              { label: 'PYQs Uploaded', value: stats.pyqs, icon: '📄', color: '#FFB89A' },
              { label: 'Notes Created', value: stats.notes, icon: '📝', color: '#C4A8FF' },
              { label: 'Study Sessions', value: stats.sessions, icon: '⏱️', color: '#A8CCFF' },
              { label: 'Mock Tests', value: stats.mockTests, icon: '📊', color: '#8EFFC4' },
              { label: 'Error Logs', value: stats.errors, icon: '🧠', color: '#FFB89A' },
            ].map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-4">
                <div className="text-xl mb-2">{s.icon}</div>
                <div className="font-heading font-bold text-xl mb-0.5" style={{ color: s.color }}>{s.value}</div>
                <div className="text-muted-foreground text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-heading font-bold text-foreground text-base mb-3">Platform Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'hsl(230 14% 11%)' }}>
                <span className="text-sm text-muted-foreground">System Status</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 text-sm font-semibold">Operational</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'hsl(230 14% 11%)' }}>
                <span className="text-sm text-muted-foreground">Pricing Model</span>
                <span className="text-emerald-400 text-sm font-semibold">✅ Free Forever</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'hsl(230 14% 11%)' }}>
                <span className="text-sm text-muted-foreground">Formula Bank</span>
                <span className="text-sm font-semibold text-foreground">{stats.formulas} formulas loaded</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'hsl(230 14% 11%)' }}>
                <span className="text-sm text-muted-foreground">Announcements</span>
                <span className="text-sm font-semibold text-foreground">{announcements.filter(a => a.is_active).length} active</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── USERS ── */}
      {tab === 'users' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">{users.length} registered users</p>
            <button onClick={loadUsers} className="btn-secondary text-xs py-2 px-4">🔄 Refresh</button>
          </div>

          {usersLoading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg clay-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground text-xs">{u.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="text-xs">{u.email}</td>
                      <td>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${u.role === 'admin' ? 'text-purple-300' : 'text-muted-foreground'}`}
                          style={{ background: u.role === 'admin' ? 'rgba(155,110,243,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${u.role === 'admin' ? 'rgba(155,110,243,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="text-xs text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                      <td>
                        {u.id !== user.id && (
                          <button
                            onClick={() => changeUserRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                            className="text-xs px-2 py-1 rounded-lg transition-all"
                            style={{ background: 'rgba(155,110,243,0.12)', border: '1px solid rgba(155,110,243,0.25)', color: '#C4A8FF' }}>
                            {u.role === 'admin' ? '→ User' : '→ Admin'}
                          </button>
                        )}
                        {u.id === user.id && <span className="text-[10px] text-muted-foreground">You</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* ── FORMULA SEEDER ── */}
      {tab === 'formulas' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="glass-card rounded-3xl p-7">
            <h3 className="font-heading font-bold text-foreground text-lg mb-2">Formula Seeder</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Seed {ALL_FORMULAS.length} curated formulas across Physics, Chemistry, and Biology — visible to all users in the Formula Bank.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              {[
                { subj: 'Physics', count: ALL_FORMULAS.filter(f => f.subject === 'Physics').length, color: '#A8CCFF', emoji: '⚛️' },
                { subj: 'Chemistry', count: ALL_FORMULAS.filter(f => f.subject === 'Chemistry').length, color: '#8EFFC4', emoji: '⚗️' },
                { subj: 'Biology', count: ALL_FORMULAS.filter(f => f.subject === 'Biology').length, color: '#FFB89A', emoji: '🧬' },
              ].map(s => (
                <div key={s.subj} className="rounded-2xl p-4 text-center border border-white/6" style={{ background: 'hsl(230 14% 11%)' }}>
                  <div className="text-2xl mb-1">{s.emoji}</div>
                  <div className="font-heading font-bold text-xl" style={{ color: s.color }}>{s.count}</div>
                  <div className="text-muted-foreground text-xs">{s.subj} formulas</div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={seedFormulas} disabled={seeding} className="btn-primary">
                {seeding ? '⏳ Seeding...' : '🌱 Seed All Formulas'}
              </button>
              <button onClick={clearAdminFormulas} className="btn-secondary" style={{ borderColor: 'rgba(243,110,110,0.3)', color: '#FF9A9A' }}>
                🗑️ Clear Admin Formulas
              </button>
            </div>
            {seedDone && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-2xl"
                style={{ background: 'rgba(110,231,160,0.12)', border: '1.5px solid rgba(110,231,160,0.3)' }}>
                <p className="text-sm font-semibold" style={{ color: '#8EFFC4' }}>
                  ✅ Formulas seeded successfully! Visible in Formula Bank for all users.
                </p>
              </motion.div>
            )}
          </div>

          <div className="glass-card rounded-3xl p-7">
            <h3 className="font-heading font-bold text-foreground text-base mb-4">Formula Preview ({ALL_FORMULAS.length} total)</h3>
            <div className="space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin">
              {ALL_FORMULAS.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-white/4" style={{ background: 'hsl(230 14% 11%)' }}>
                  <span className="text-xs text-muted-foreground font-mono w-5 flex-shrink-0">{i + 1}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${f.subject === 'Physics' ? 'text-blue-300' : f.subject === 'Chemistry' ? 'text-emerald-300' : 'text-orange-300'}`}
                    style={{ background: f.subject === 'Physics' ? 'rgba(110,168,243,0.15)' : f.subject === 'Chemistry' ? 'rgba(110,231,160,0.15)' : 'rgba(243,149,110,0.15)' }}>
                    {f.subject}
                  </span>
                  <span className="text-xs text-foreground font-medium flex-1 truncate">{f.title}</span>
                  <code className="text-xs text-purple-300 font-mono hidden sm:block">{f.formula_text}</code>
                  {f.is_important && <span className="text-yellow-400 text-xs">★</span>}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── ANNOUNCEMENTS ── */}
      {tab === 'announcements' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">{announcements.length} announcements</p>
            <button onClick={() => setShowAnnForm(true)} className="btn-primary text-sm">+ New Announcement</button>
          </div>

          {announcements.length === 0 && !showAnnForm && (
            <div className="glass-card rounded-3xl py-16 text-center">
              <div className="text-4xl mb-3">📢</div>
              <p className="text-muted-foreground text-sm">No announcements yet. Create one to notify all users.</p>
            </div>
          )}

          <div className="space-y-3">
            {announcements.map(ann => {
              const style = annTypeColors[ann.type] || annTypeColors.info;
              return (
                <div key={ann.id} className="glass-card rounded-2xl p-5" style={{ borderColor: style.border }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {ann.is_pinned && <span className="text-yellow-400 text-xs">📌</span>}
                        <span className="font-heading font-semibold text-foreground text-sm">{ann.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                          {style.label}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed">{ann.content}</p>
                      <p className="text-muted-foreground text-[10px] mt-2">{ann.created_date ? new Date(ann.created_date).toLocaleDateString() : ''}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => toggleAnnPin(ann)} className="p-1.5 rounded-lg text-xs hover:bg-white/5 transition-colors" title={ann.is_pinned ? 'Unpin' : 'Pin'}>
                        {ann.is_pinned ? '📌' : '📍'}
                      </button>
                      <button onClick={() => deleteAnnouncement(ann.id)} className="p-1.5 rounded-lg text-xs hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors">🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Announcement form */}
          <AnimatePresence>
            {showAnnForm && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowAnnForm(false)}>
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="modal-card max-w-lg" onClick={e => e.stopPropagation()}>
                  <h3 className="font-heading font-bold text-foreground text-lg mb-5">New Announcement</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Title *</label>
                      <input className="input-field" placeholder="Announcement title" value={annForm.title} onChange={e => setAnnForm(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Content *</label>
                      <textarea className="input-field" rows={3} placeholder="Write your message for all users..." value={annForm.content} onChange={e => setAnnForm(p => ({ ...p, content: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Type</label>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(annTypeColors).map(([key, val]) => (
                          <button key={key} onClick={() => setAnnForm(p => ({ ...p, type: key }))}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize"
                            style={annForm.type === key ? { background: val.bg, border: `1.5px solid ${val.border}`, color: val.color } : { background: 'hsl(230 14% 14%)', border: '1.5px solid rgba(255,255,255,0.06)', color: 'hsl(230 10% 55%)' }}>
                            {val.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div onClick={() => setAnnForm(p => ({ ...p, is_pinned: !p.is_pinned }))}
                        className="w-5 h-5 rounded-lg flex items-center justify-center border transition-colors cursor-pointer"
                        style={annForm.is_pinned ? { background: '#F3D56E', borderColor: '#F3D56E' } : { borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}>
                        {annForm.is_pinned && <span className="text-black text-xs">📌</span>}
                      </div>
                      <span className="text-sm text-muted-foreground">Pin this announcement</span>
                    </label>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowAnnForm(false)} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={saveAnnouncement} disabled={annSaving} className="btn-primary flex-1 justify-center">
                      {annSaving ? 'Posting...' : '📢 Post Announcement'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── CONTENT MANAGEMENT ── */}
      {tab === 'pyq' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-bold text-foreground text-base">📄 PYQ Papers</h3>
                <p className="text-muted-foreground text-xs mt-0.5">{pyqs.length} papers uploaded</p>
              </div>
              <button onClick={() => setShowPyqForm(true)} className="btn-primary text-sm">+ Upload PYQ</button>
            </div>

            {/* Upload Form */}
            <AnimatePresence>
              {showPyqForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-5 rounded-2xl border border-purple-500/20 overflow-hidden"
                  style={{ background: 'hsl(230 14% 11%)' }}>
                  <h4 className="font-heading font-bold text-foreground text-sm mb-4">New PYQ Paper</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1 font-semibold">Title *</label>
                      <input className="input-field" placeholder="e.g. NEET 2023 Physics Paper" value={pyqForm.title} onChange={e => setPyqForm(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1 font-semibold">Year *</label>
                        <input className="input-field" type="number" min="2000" max="2030" value={pyqForm.year} onChange={e => setPyqForm(p => ({ ...p, year: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1 font-semibold">Subject *</label>
                        <select className="input-field" value={pyqForm.subject} onChange={e => setPyqForm(p => ({ ...p, subject: e.target.value }))}>
                          {['Physics', 'Chemistry', 'Biology', 'All'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1 font-semibold">Difficulty</label>
                        <select className="input-field" value={pyqForm.difficulty} onChange={e => setPyqForm(p => ({ ...p, difficulty: e.target.value }))}>
                          {['Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1 font-semibold">Language</label>
                        <select className="input-field" value={pyqForm.language} onChange={e => setPyqForm(p => ({ ...p, language: e.target.value }))}>
                          {['English', 'Hindi', 'Both'].map(l => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1 font-semibold">Total Questions</label>
                        <input className="input-field" type="number" placeholder="e.g. 180" value={pyqForm.total_questions} onChange={e => setPyqForm(p => ({ ...p, total_questions: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1 font-semibold">Total Marks</label>
                        <input className="input-field" type="number" placeholder="e.g. 720" value={pyqForm.total_marks} onChange={e => setPyqForm(p => ({ ...p, total_marks: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1 font-semibold">Chapter (optional)</label>
                      <input className="input-field" placeholder="e.g. Full Paper / Mechanics" value={pyqForm.chapter} onChange={e => setPyqForm(p => ({ ...p, chapter: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1 font-semibold">Description (optional)</label>
                      <textarea className="input-field" rows={2} placeholder="Short description of this paper..." value={pyqForm.description} onChange={e => setPyqForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1 font-semibold">PDF File * <span className="text-purple-400">(required)</span></label>
                      <input type="file" accept=".pdf" className="input-field text-sm" onChange={e => setPyqFile(e.target.files[0])} />
                      {pyqFile && <p className="text-xs text-emerald-400 mt-1">✓ {pyqFile.name} ({(pyqFile.size / 1024 / 1024).toFixed(1)} MB)</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1 font-semibold">Thumbnail Image (optional)</label>
                      <input type="file" accept="image/*" className="input-field text-sm" onChange={e => setPyqThumbnail(e.target.files[0])} />
                      {pyqThumbnail && <p className="text-xs text-emerald-400 mt-1">✓ {pyqThumbnail.name}</p>}
                    </div>
                  </div>

                  {pyqUploadProgress && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-purple-300">
                      <div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                      {pyqUploadProgress}
                    </div>
                  )}

                  <div className="flex gap-3 mt-5">
                    <button onClick={() => { setShowPyqForm(false); setPyqFile(null); setPyqThumbnail(null); }} className="btn-secondary flex-1 text-sm">Cancel</button>
                    <button onClick={savePyq} disabled={pyqSaving || pyqUploading || !pyqFile || !pyqForm.title.trim()} className="btn-primary flex-1 text-sm justify-center">
                      {pyqUploading ? '⏫ Uploading...' : pyqSaving ? '💾 Saving...' : '📤 Upload PYQ'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PYQ List */}
            {pyqs.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">📄</div>
                <p className="text-muted-foreground text-sm">No PYQ papers yet. Upload your first paper!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pyqs.map(p => (
                  <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'hsl(230 14% 11%)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'rgba(168,204,255,0.1)' }}>📄</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                      <div className="flex gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">{p.year}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground">{p.subject}</span>
                        {p.difficulty && <><span className="text-[10px] text-muted-foreground">•</span><span className="text-[10px] text-muted-foreground">{p.difficulty}</span></>}
                        {p.total_questions && <><span className="text-[10px] text-muted-foreground">•</span><span className="text-[10px] text-muted-foreground">{p.total_questions} Qs</span></>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {p.pdf_url && (
                        <a href={p.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg hover:bg-blue-400/10 transition-colors">View</a>
                      )}
                      <button onClick={() => deletePyq(p.id)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-400/10 transition-colors">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {tab === 'content' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-heading font-bold text-foreground text-base mb-4">📚 Chapter Management</h3>
            <div className="grid sm:grid-cols-3 gap-4 mb-5">
              {[
                { label: 'Physics Chapters', count: 28, color: '#A8CCFF' },
                { label: 'Chemistry Chapters', count: 29, color: '#8EFFC4' },
                { label: 'Biology Chapters', count: 38, color: '#FFB89A' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-4 text-center" style={{ background: 'hsl(230 14% 11%)', border: '1.5px solid rgba(255,255,255,0.06)' }}>
                  <div className="font-heading font-bold text-xl" style={{ color: s.color }}>{s.count}</div>
                  <div className="text-muted-foreground text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-2xl mb-4" style={{ background: 'rgba(243,110,110,0.08)', border: '1.5px solid rgba(243,110,110,0.2)' }}>
              <p className="text-xs text-red-300 font-semibold mb-1">⚠️ Danger Zone</p>
              <p className="text-muted-foreground text-xs mb-3">Clearing chapters removes all user progress. This cannot be undone.</p>
              <button onClick={clearAllChapters} className="btn-secondary text-xs py-2" style={{ borderColor: 'rgba(243,110,110,0.3)', color: '#FF9A9A' }}>
                🗑️ Clear All Chapters (All Users)
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-heading font-bold text-foreground text-base mb-4">📄 PYQ & Resources</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl p-4" style={{ background: 'hsl(230 14% 11%)', border: '1.5px solid rgba(255,255,255,0.06)' }}>
                <div className="font-heading font-bold text-xl mb-0.5" style={{ color: '#A8CCFF' }}>{stats.pyqs}</div>
                <div className="text-muted-foreground text-xs">PYQ Papers uploaded</div>
                <p className="text-muted-foreground text-xs mt-2">Manage PYQ papers from the PYQ Library page.</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'hsl(230 14% 11%)', border: '1.5px solid rgba(255,255,255,0.06)' }}>
                <div className="font-heading font-bold text-xl mb-0.5" style={{ color: '#8EFFC4' }}>{stats.notes}</div>
                <div className="text-muted-foreground text-xs">User Notes created</div>
                <p className="text-muted-foreground text-xs mt-2">Notes belong to individual users and are private.</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-heading font-bold text-foreground text-base mb-4">📊 Activity Summary</h3>
            <div className="space-y-3">
              {[
                { label: 'Study Sessions logged', value: stats.sessions, icon: '⏱️' },
                { label: 'Mock Tests attempted', value: stats.mockTests, icon: '📊' },
                { label: 'Errors logged', value: stats.errors, icon: '🧠' },
                { label: 'Total Formulas in bank', value: stats.formulas, icon: '⚗️' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'hsl(230 14% 11%)' }}>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </div>
                  <span className="font-heading font-bold text-foreground text-sm">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
