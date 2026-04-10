import { Buffer } from 'buffer';

/**
 * Anchor / @solana/web3.js assume Node's Buffer exists. Vite does not inject it.
 * Without this, listing and other txs can fail in the browser (often reported as Buffer-related errors).
 */
const g = globalThis as typeof globalThis & { Buffer?: typeof Buffer; global?: typeof globalThis };

if (g.Buffer === undefined) {
  g.Buffer = Buffer;
}
if (g.global === undefined) {
  g.global = g;
}
