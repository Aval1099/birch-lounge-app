// Type declarations for supabaseClient.js
export interface AuthSession {
  user: any;
  access_token: string;
  refresh_token: string;
}

export type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED';

export interface AuthStateChangeCallback {
  (event: AuthEvent, session: AuthSession | null): void;
}

export function isSupabaseConfigured(): boolean;
export function onAuthStateChange(callback: AuthStateChangeCallback): () => void;
