import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/** OAuth return: exchange code / parse hash, then redirect. */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing sign in…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (error) {
        setMessage('Sign in failed. Redirecting…');
        navigate('/auth', { replace: true });
        return;
      }
      if (session?.user) {
        navigate('/', { replace: true });
      } else {
        setMessage('No session. Redirecting…');
        navigate('/auth', { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4 text-muted-foreground">
      {message}
    </div>
  );
};

export default AuthCallback;
