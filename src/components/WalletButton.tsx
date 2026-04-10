import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const WalletButton = () => {
  const { connected, publicKey } = useWallet();
  const { user, signOut, signInWithWallet } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSignIn = async () => {
    if (!connected) {
      navigate('/auth');
      return;
    }
    setSigningIn(true);
    try {
      const { error } = await signInWithWallet();
      if (error) {
        toast.error(error.message);
        navigate('/auth');
      } else {
        toast.success('Signed in');
      }
    } finally {
      setSigningIn(false);
    }
  };

  if (!connected) {
    return (
      <Button variant="outline" onClick={() => navigate('/auth')} className="gap-2">
        <LogIn size={16} />
        Sign In
      </Button>
    );
  }

  if (connected && publicKey && !user) {
    return (
      <div className="flex items-center gap-2">
        <WalletMultiButton className="!bg-gradient-primary !text-primary-foreground hover:!scale-105 !transform !transition-all !duration-300 !rounded-full !font-semibold !h-10" />
        <Button variant="hero" size="sm" disabled={signingIn} onClick={handleSignIn} className="gap-2">
          <Wallet size={16} />
          {signingIn ? 'Signing…' : 'Sign in'}
        </Button>
      </div>
    );
  }

  if (connected && publicKey && user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="glass" className="gap-2">
          <Wallet size={16} />
          {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <WalletMultiButton className="!bg-gradient-primary !text-primary-foreground hover:!scale-105 !transform !transition-all !duration-300 !rounded-full !font-semibold !h-10" />
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        <LogOut size={16} />
      </Button>
    </div>
  );
};

export default WalletButton;