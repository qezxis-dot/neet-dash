// app-params.js
// This file previously read base44-specific URL/storage params.
// It is kept for compatibility (some components may import appParams)
// but the values are no longer needed since auth is handled by Supabase directly.

export const appParams = {
  appId: 'local',
  token: null,
  fromUrl: typeof window !== 'undefined' ? window.location.href : '/',
  functionsVersion: null,
  appBaseUrl: typeof window !== 'undefined' ? window.location.origin : '',
};
