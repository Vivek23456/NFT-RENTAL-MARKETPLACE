import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';

interface AuthContextType {
  user: WalletUser | null;
  session: WalletSession | null;
  loading: boolean;
  signInWithWallet: () => Promise<{ error: AuthErrorLike | null }>;
  signOut: () => Promise<{ error: any }>;
}

type AuthErrorLike = { message: string; name?: string };
type WalletUser = { id: string; walletAddress: string };
type WalletSession = {
  walletAddress: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  /** Ed25519 signature, base64 (JSON-safe). */
  signature: string;
  message: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_STORAGE_KEY = 'wallet_auth_session_v2';
const SESSION_TTL_MS = 30 * 60 * 1000;

function randomNonce(length = 24): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

function buildSignInMessage(walletAddress: string, nonce: string, issuedAt: string, expiresAt: string) {
  const origin = window.location.origin;
  const host = window.location.host;
  return [
    `${host} wants you to sign in with your Solana account:`,
    walletAddress,
    '',
    'Sign in to NFT Rental Marketplace.',
    '',
    `URI: ${origin}`,
    'Version: 1',
    'Chain ID: devnet',
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expiration Time: ${expiresAt}`,
  ].join('\n');
}

function parseMessageField(message: string, key: string): string | null {
  const line = message.split('\n').find((entry) => entry.startsWith(`${key}: `));
  return line ? line.slice(key.length + 2).trim() : null;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function verifyWalletSignature(walletAddress: string, message: string, signatureBase64: string) {
  try {
    const pk = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = base64ToBytes(signatureBase64);
    if (signatureBytes.length !== nacl.sign.signatureLength) {
      return false;
    }
    // @solana/web3.js PublicKey has no .verify(); Phantom/docs use tweetnacl detached verify on the same UTF-8 bytes you passed to signMessage.
    return nacl.sign.detached.verify(messageBytes, signatureBytes, pk.toBytes());
  } catch {
    return false;
  }
}

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
  const { connected, publicKey, signMessage } = useWallet();
  const [session, setSession] = useState<WalletSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as WalletSession;
      const now = Date.now();
      const expiresAt = Date.parse(parsed.expiresAt);
      const issuedAt = Date.parse(parsed.issuedAt);
      const nonce = parseMessageField(parsed.message, 'Nonce');
      const parsedIssuedAt = parseMessageField(parsed.message, 'Issued At');
      const parsedExpiry = parseMessageField(parsed.message, 'Expiration Time');
      const parsedUri = parseMessageField(parsed.message, 'URI');

      const valid =
        !!nonce &&
        nonce === parsed.nonce &&
        parsedIssuedAt === parsed.issuedAt &&
        parsedExpiry === parsed.expiresAt &&
        parsedUri === window.location.origin &&
        !Number.isNaN(expiresAt) &&
        !Number.isNaN(issuedAt) &&
        issuedAt <= now &&
        now <= expiresAt &&
        verifyWalletSignature(parsed.walletAddress, parsed.message, parsed.signature);

      if (valid) {
        setSession(parsed);
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  /** If user switches to a different wallet, drop the old session (do not wipe on initial disconnect). */
  useEffect(() => {
    if (!publicKey || !session) return;
    if (publicKey.toBase58() !== session.walletAddress) {
      setSession(null);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [publicKey, session]);

  const user = useMemo(() => {
    if (!session) return null;
    if (!connected || !publicKey) return null;
    if (publicKey.toBase58() !== session.walletAddress) return null;
    return {
      id: session.walletAddress,
      walletAddress: session.walletAddress,
    };
  }, [session, connected, publicKey]);

  const signInWithWallet = async (): Promise<{ error: AuthErrorLike | null }> => {
    try {
      if (!connected || !publicKey) {
        return { error: { message: 'Connect your wallet first.' } };
      }

      if (!signMessage) {
        return { error: { message: 'This wallet does not support message signing.' } };
      }

      const walletAddress = publicKey.toBase58();
      const issuedAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
      const nonce = randomNonce();
      const message = buildSignInMessage(walletAddress, nonce, issuedAt, expiresAt);

      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const signature = bytesToBase64(signatureBytes);

      const valid = verifyWalletSignature(walletAddress, message, signature);
      if (!valid) {
        return { error: { message: 'Signature verification failed.' } };
      }

      const next: WalletSession = {
        walletAddress,
        nonce,
        issuedAt,
        expiresAt,
        signature,
        message,
      };
      setSession(next);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
      return { error: null };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Wallet sign-in failed.',
        },
      };
    }
  };

  const signOut = async () => {
    setSession(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return { error: null };
  };

  const value = {
    user,
    session,
    loading,
    signInWithWallet,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};