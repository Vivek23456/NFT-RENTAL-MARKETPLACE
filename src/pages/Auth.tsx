import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';

const Auth = () => {
  const [loading, setLoading] = useState(false);

  const { connected, publicKey } = useWallet();
  const { signInWithWallet, user } = useAuth();
  const { logAuthFailure } = useSecurityMonitor();
  const navigate = useNavigate();

  const handleWalletSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithWallet();
      if (error) {
        logAuthFailure('Wallet sign in failed', { error: error.message });
        toast.error(error.message);
      } else {
        toast.success('Wallet authenticated successfully');
      }
    } catch (error) {
      logAuthFailure('Wallet sign in unexpected', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      toast.error('Could not complete wallet sign in');
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
              Connect your Solana wallet and sign a challenge message
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <WalletMultiButton className="!w-full !bg-gradient-primary !text-primary-foreground hover:!scale-[1.02] !transform !transition-all !duration-300 !rounded-full !font-semibold !h-11" />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading || !connected}
              onClick={handleWalletSignIn}
            >
              {loading ? 'Verifying signature…' : 'Sign message to authenticate'}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              We verify your wallet signature locally with nonce and expiry checks.
            </p>
            {connected && publicKey && (
              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck size={14} />
                Connected: {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
