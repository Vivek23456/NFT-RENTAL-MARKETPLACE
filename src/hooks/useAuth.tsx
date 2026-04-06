import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

function getSiteOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return import.meta.env.VITE_SITE_URL ?? '';
}

function displayNameFromUser(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const name =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    (typeof meta.user_name === 'string' && meta.user_name) ||
    null;
  return name || (user.email ? user.email.split('@')[0] : null);
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Opens Google in the same tab (full redirect), not a popup. */
  signInWithGoogle: () => Promise<{ error: AuthErrorLike | null }>;
  signOut: () => Promise<{ error: any }>;
}

type AuthErrorLike = { message: string; name?: string };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Create profile for new users
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            createUserProfile(session.user);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const createUserProfile = async (user: User) => {
    const displayName = displayNameFromUser(user);
    if (!displayName) return;

    const { error } = await supabase
      .from('profiles')
      .upsert(
        { id: user.id, display_name: displayName, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
    if (error) console.warn('Profile upsert:', error.message);
  };

  const signInWithGoogle = async () => {
    const redirectTo = `${getSiteOrigin()}/auth/callback`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });
    if (error) return { error };

    const url = data.url;
    if (!url) {
      return {
        error: {
          message:
            'Google sign-in did not return a URL. Enable the Google provider in Supabase (Authentication → Providers) and add this redirect URL: ' +
            redirectTo,
        },
      };
    }

    window.location.assign(url);
    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};