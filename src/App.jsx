import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Public
import Landing from './pages/Landing';

// Layout + protected pages
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import FormulaBank from './pages/FormulaBank';
import PYQLibrary from './pages/PYQLibrary';
import Notes from './pages/Notes';
import RevisionPlanner from './pages/RevisionPlanner';
import MockTests from './pages/MockTests';
import StudyTimer from './pages/StudyTimer';
import ErrorNotebook from './pages/ErrorNotebook';
import Analytics from './pages/Analytics';
import Goals from './pages/Goals';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Resources from './pages/Resources';
import Achievements from './pages/Achievements';
import Admin from './pages/Admin';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes — all under Layout */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/formula-bank" element={<FormulaBank />} />
          <Route path="/pyq" element={<PYQLibrary />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/revision" element={<RevisionPlanner />} />
          <Route path="/mock-tests" element={<MockTests />} />

          <Route path="/resources" element={<Resources />} />
          <Route path="/error-notebook" element={<ErrorNotebook />} />
          <Route path="/timer" element={<StudyTimer />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function ComingSoon({ title, icon }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center">
        <div className="text-6xl mb-4">{icon}</div>
        <h2 className="font-heading font-bold text-2xl text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground text-sm">This page is coming soon!</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App