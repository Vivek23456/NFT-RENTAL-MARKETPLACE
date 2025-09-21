import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, Mail, User, ArrowLeft } from 'lucide-react';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';
import { checkRateLimit } from '@/lib/validation';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp, signIn, user } = useAuth();
  const { logAuthFailure, logRateLimitExceeded } = useSecurityMonitor();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting for auth attempts
    const rateCheck = checkRateLimit(`auth-${email}`, 5, 300000); // 5 attempts per 5 minutes
    if (!rateCheck.allowed) {
      logRateLimitExceeded('authentication', 5);
      toast.error('Too many authentication attempts. Please wait 5 minutes before trying again.');
      return;
    }
    
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          logAuthFailure('Password mismatch during signup', { email });
          toast.error('Passwords do not match');
          return;
        }
        if (password.length < 6) {
          logAuthFailure('Weak password during signup', { email, passwordLength: password.length });
          toast.error('Password must be at least 6 characters');
          return;
        }
        
        // Additional password strength validation
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
          logAuthFailure('Weak password complexity', { email });
          toast.error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
          return;
        }
        
        const { error } = await signUp(email, password);
        if (error) {
          logAuthFailure('Signup error', { email, error: error.message });
          if (error.message.includes('already registered')) {
            toast.error('Email already registered. Try signing in instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Sign up successful! Please check your email to verify your account.');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          logAuthFailure('Signin error', { email, error: error.message });
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Signed in successfully!');
          navigate('/');
        }
      }
    } catch (error) {
      logAuthFailure('Unexpected auth error', { email, error: error instanceof Error ? error.message : 'Unknown error' });
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

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
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Sign up to start renting and listing NFTs'
                : 'Sign in to your NFT rental account'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail size={16} />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock size={16} />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1"
                />
              </div>
              
              {isSignUp && (
                <div>
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock size={16} />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="mt-1"
                  />
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  'Loading...'
                ) : (
                  <>
                    <User size={16} className="mr-2" />
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;