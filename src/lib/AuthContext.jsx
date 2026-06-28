import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { db } from '@/lib/supabase/db';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]                       = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth]     = useState(true);
  // Keep these props so every existing consumer still works unchanged
  const [isLoadingPublicSettings]             = useState(false);
  const [authError, setAuthError]             = useState(null);
  const [authChecked, setAuthChecked]         = useState(false);
  const [appPublicSettings]                   = useState({ id: 'local', public_settings: {} });

  // ── bootstrap: check existing session ────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(buildUser(session.user));
        setIsAuthenticated(true);
      }
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });

    // Keep in sync with Supabase auth events (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(buildUser(session.user));
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  function buildUser(supabaseUser) {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      role: supabaseUser.user_metadata?.role || supabaseUser.app_metadata?.role || 'user',
      full_name: supabaseUser.user_metadata?.full_name || '',
      avatar_url: supabaseUser.user_metadata?.avatar_url || '',
      ...supabaseUser.user_metadata,
    };
  }

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await db.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  // checkAppState is called by some components; map it to checkUserAuth
  const checkAppState = checkUserAuth;

  const logout = (shouldRedirect = true) => {
    db.auth.logout(shouldRedirect ? window.location.origin + '/login' : undefined);
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    db.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
