import { createClient } from '@supabase/supabase-js';
const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

/** A completely empty configuration is the intentional local fixture mode. */
export const hasAnySupabaseEnv = Boolean(publicUrl || anonKey || serviceRoleKey);
export const supabase = publicUrl && anonKey ? createClient(publicUrl, anonKey) : null;
/** Server-only client used by the validated contact endpoint. Never expose this key to the browser. */
export const serviceSupabase = publicUrl && serviceRoleKey ? createClient(publicUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } }) : null;
