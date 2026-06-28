// This file used to hold the base44 SDK stub.
// It now re-exports the Supabase-backed db so all existing imports keep working.
export { db, base44, db as default } from '@/lib/supabase/db';
