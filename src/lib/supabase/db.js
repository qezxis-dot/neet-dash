/**
 * db.js - Supabase drop-in replacement for the base44 `db` global.
 *
 * Usage is identical to what the pages already do:
 *   db.entities.Note.filter({ user_id: '...' })
 *   db.entities.Note.create({ ... })
 *   db.auth.loginViaEmailPassword(email, password)
 *   etc.
 */

import { supabase } from './client.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

function tableFor(entityName) {
  // Map entity names to Supabase table names (snake_case)
  const map = {
    UserProfile:   'user_profiles',
    StudySession:  'study_sessions',
    MockTest:      'mock_tests',
    RevisionTask:  'revision_tasks',
    Chapter:       'chapters',
    Note:          'notes',
    Formula:       'formulas',
    ErrorNote:     'error_notes',
    Goal:          'goals',
    Bookmark:      'bookmarks',
    Resource:      'resources',
    PYQ:           'pyqs',
    Announcement:  'announcements',
    DailyQuote:    'daily_quotes',
    // The legacy `db.entities.User` references in Admin page
    User:          'profiles',
  };
  return map[entityName] || entityName.toLowerCase() + 's';
}

// Map base44 column names to actual Supabase column names
const COLUMN_MAP = {
  created_date:    'created_at',
  updated_date:    'updated_at',
};

/**
 * Parse a base44-style ordering string like '-created_date' into
 * { column: 'created_at', ascending: false }
 */
function parseOrder(orderStr) {
  if (!orderStr) return { column: 'created_at', ascending: false };
  const ascending = !orderStr.startsWith('-');
  const raw = orderStr.replace(/^-/, '');
  const column = COLUMN_MAP[raw] || raw;
  return { column, ascending };
}

/**
 * Convert a base44 filter object { field: value, ... } into a Supabase query.
 * Each key=value pair becomes an `.eq()` filter.
 */
function applyFilters(query, filters = {}) {
  for (const [key, value] of Object.entries(filters)) {
    if (value === null) {
      query = query.is(key, null);
    } else if (Array.isArray(value)) {
      query = query.in(key, value);
    } else {
      query = query.eq(key, value);
    }
  }
  return query;
}

function throwIfError(error, context) {
  if (error) {
    console.error(`[db] ${context}:`, error.message);
    throw new Error(error.message);
  }
}

// ─── entity factory ───────────────────────────────────────────────────────────

function makeEntity(entityName) {
  const table = tableFor(entityName);

  return {
    /**
     * Filter records by exact field matches.
     * db.entities.Note.filter({ user_id: '123' })
     * db.entities.Note.filter({ user_id: '123' }, '-created_date')
     */
    async filter(filters = {}, orderStr) {
      let query = supabase.from(table).select('*');
      query = applyFilters(query, filters);
      if (orderStr) {
        const { column, ascending } = parseOrder(orderStr);
        query = query.order(column, { ascending });
      }
      const { data, error } = await query;
      throwIfError(error, `${entityName}.filter`);
      return data || [];
    },

    /**
     * Fetch all records, optionally sorted and limited.
     * db.entities.Formula.list('-created_date', 500)
     */
    async list(orderStr, limit) {
      const { column, ascending } = parseOrder(orderStr);
      let query = supabase.from(table).select('*').order(column, { ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      throwIfError(error, `${entityName}.list`);
      return data || [];
    },

    /**
     * Get a single record by its id.
     * db.entities.Note.get('uuid')
     */
    async get(id) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      throwIfError(error, `${entityName}.get`);
      return data;
    },

    /**
     * Create a new record.
     * db.entities.Note.create({ title: '...', user_id: '...' })
     */
    async create(payload) {
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single();
      throwIfError(error, `${entityName}.create`);
      return data;
    },

    /**
     * Insert multiple records at once.
     * db.entities.Formula.bulkCreate([...])
     */
    async bulkCreate(payloads) {
      const { data, error } = await supabase
        .from(table)
        .insert(payloads)
        .select();
      throwIfError(error, `${entityName}.bulkCreate`);
      return data || [];
    },

    /**
     * Update a record by id.
     * db.entities.Note.update('uuid', { title: '...' })
     */
    async update(id, payload) {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      throwIfError(error, `${entityName}.update`);
      return data;
    },

    /**
     * Delete a record by id.
     * db.entities.Note.delete('uuid')
     */
    async delete(id) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      throwIfError(error, `${entityName}.delete`);
      return { id };
    },

    /**
     * Delete all records matching a filter object.
     * db.entities.Chapter.deleteMany({ user_id: '...' })
     * db.entities.Formula.deleteMany({}) — deletes all (admin use)
     */
    async deleteMany(filters = {}) {
      let query = supabase.from(table).delete();
      if (Object.keys(filters).length > 0) {
        query = applyFilters(query, filters);
      } else {
        // Supabase requires at least one filter; use neq('id', '') as a
        // "match all" trick only for tables without a NULL id.
        query = query.neq('id', '00000000-0000-0000-0000-000000000000');
      }
      const { error } = await query;
      throwIfError(error, `${entityName}.deleteMany`);
      return {};
    },
  };
}

// ─── auth ─────────────────────────────────────────────────────────────────────

const auth = {
  /**
   * Returns the current user object (mirrors base44's db.auth.me()).
   * Throws if not authenticated.
   */
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw Object.assign(new Error('Not authenticated'), { status: 401 });
    // Attach a role field from user_metadata if present
    return {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || user.app_metadata?.role || 'user',
      full_name: user.user_metadata?.full_name || '',
      avatar_url: user.user_metadata?.avatar_url || '',
      ...user.user_metadata,
    };
  },

  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  /**
   * Email + password sign-in.
   * db.auth.loginViaEmailPassword(email, password)
   */
  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * OAuth provider sign-in (Google, etc.).
   * db.auth.loginWithProvider('google', '/dashboard')
   */
  async loginWithProvider(provider, redirectPath = '/dashboard') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`,
      },
    });
    if (error) throw new Error(error.message);
  },

  /**
   * Email + password sign-up.
   * db.auth.register({ email, password, full_name })
   */
  async register({ email, password, full_name }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
      },
    });
    if (error) throw new Error(error.message || error.error_description || 'Registration failed');
    return data;
  },

  /**
   * Verify the OTP / email confirmation token.
   * db.auth.verifyOtp({ email, otpCode })
   * Returns { access_token } so existing code works without changes.
   */
  async verifyOtp({ email, otpCode }) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'signup',
    });
    if (error) throw new Error(error.message);
    return { access_token: data.session?.access_token };
  },

  /**
   * Resend the OTP / confirmation email.
   * db.auth.resendOtp(email)
   */
  async resendOtp(email) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw new Error(error.message);
  },

  /**
   * Store an access token (no-op here — Supabase manages sessions itself).
   * Kept for API compatibility.
   */
  setToken(_token) {
    // Supabase manages the session internally; nothing to do.
  },

  /**
   * Request a password reset email.
   * db.auth.resetPasswordRequest(email)
   */
  async resetPasswordRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  },

  /**
   * Complete the password reset using the token from the URL.
   * db.auth.resetPassword({ resetToken, newPassword })
   *
   * Supabase handles the token automatically via the URL when the user
   * lands on /reset-password; we just call updateUser here.
   */
  async resetPassword({ newPassword }) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },

  /**
   * Sign out.
   * db.auth.logout()
   */
  async logout(redirectUrl) {
    await supabase.auth.signOut();
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },

  /**
   * Redirect to login page.
   * db.auth.redirectToLogin(returnUrl)
   */
  redirectToLogin(returnUrl) {
    window.location.href = `/login${returnUrl ? `?from=${encodeURIComponent(returnUrl)}` : ''}`;
  },
};

// ─── integrations ─────────────────────────────────────────────────────────────

const integrations = {
  Core: {
    /**
     * Upload a file to Supabase Storage.
     * db.integrations.Core.UploadFile({ file })
     * Returns { file_url: '...' } matching base44 format.
     *
     * Make sure you have a Supabase Storage bucket called 'uploads'
     * with public access enabled.
     */
    async UploadFile({ file }) {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('uploads')
        .upload(path, file, { upsert: false });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      return { file_url: data.publicUrl };
    },
  },
};

// ─── entity registry ──────────────────────────────────────────────────────────

const ENTITY_NAMES = [
  'UserProfile', 'StudySession', 'MockTest', 'RevisionTask',
  'Chapter', 'Note', 'Formula', 'ErrorNote', 'Goal',
  'Bookmark', 'Resource', 'PYQ', 'Announcement', 'DailyQuote',
  'User',
];

const entities = Object.fromEntries(
  ENTITY_NAMES.map(name => [name, makeEntity(name)])
);

// ─── export ───────────────────────────────────────────────────────────────────

export const db = { auth, entities, integrations };
export const base44 = db;
export default db;
