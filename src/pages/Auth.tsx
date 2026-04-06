import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';

const Auth = () => {
  const [loading, setLoading] = useState(false);

  const { signInWithGoogle, user } = useAuth();
  const { logAuthFailure } = useSecurityMonitor();
  const navigate = useNavigate();

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        logAuthFailure('Google OAuth error', { error: error.message });
        toast.error(error.message);
      }
    } catch (error) {
      logAuthFailure('Google OAuth unexpected', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error('Could not start Google sign in');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 gap-2"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Button>

        <Card className="bg-card/80 backdrop-blur border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Sign in
            </CardTitle>
            <CardDescription>
              Continue with your Google account to use the marketplace
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={handleGoogle}
            >
              {loading ? 'Redirecting…' : 'Continue with Google'}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Opens Google in this tab (not a small popup). Allow redirects if your browser asks.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
