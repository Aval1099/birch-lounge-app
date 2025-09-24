import { vi } from 'vitest';

// Mock Supabase client
export const supabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  }
};

// Mock service functions
export const isSupabaseConfigured = vi.fn().mockReturnValue(false);
export const getCurrentUser = vi.fn().mockResolvedValue(null);
export const signUp = vi.fn().mockResolvedValue({ success: false, error: 'Supabase not configured' });
export const signIn = vi.fn().mockResolvedValue({ success: false, error: 'Supabase not configured' });
export const signOut = vi.fn().mockResolvedValue({ success: false, error: 'Supabase not configured' });
export const onAuthStateChange = vi.fn().mockReturnValue(() => {});
