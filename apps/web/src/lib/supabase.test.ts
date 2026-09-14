import { afterEach, describe, expect, it, vi } from 'vitest';

const keys = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  vi.resetModules();
});

describe('Supabase environment boundary', () => {
  it('treats a partial configuration as an error mode instead of fixture mode', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const module = await import('./supabase');
    expect(module.hasAnySupabaseEnv).toBe(true);
    expect(module.supabase).toBeNull();
    expect(module.serviceSupabase).toBeNull();
  });

  it('allows fixture mode only when all Supabase variables are absent', async () => {
    for (const key of keys) delete process.env[key];

    const module = await import('./supabase');
    expect(module.hasAnySupabaseEnv).toBe(false);
    expect(module.supabase).toBeNull();
    expect(module.serviceSupabase).toBeNull();
  });
});
