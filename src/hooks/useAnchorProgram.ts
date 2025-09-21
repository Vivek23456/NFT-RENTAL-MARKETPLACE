import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getProgram } from '@/lib/anchor';

export function useAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.connected || !wallet.publicKey) {
      return null;
    }
    
    try {
      return getProgram(connection, wallet);
    } catch (error) {
      console.error('Error creating program:', error);
      return null;
    }
  }, [connection, wallet.connected, wallet.publicKey]);

  return program;
}