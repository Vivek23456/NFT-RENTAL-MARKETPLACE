import { AnchorProvider, BN, Program } from '@coral-xyz/anchor';
import { WalletContextState } from '@solana/wallet-adapter-react';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import idl from '@/idl/nft_rental.json';

export const PROGRAM_ID = new PublicKey('B5D4oqW13D5tGhBm9qNSUQxpxeiRZFPJUo6Eh5BYoWdW');

// NOTE: replace this inline IDL with generated target/idl/nft_rental.json once anchor build is available.
export const IDL = idl as any;

export type RentalListingAccount = {
  owner: PublicKey;
  mint: PublicKey;
  dailyRentLamports: BN;
  collateralLamports: BN;
  minDurationDays: number;
  maxDurationDays: number;
  isActive: boolean;
  currentRenter: PublicKey | null;
  rentalEndTime: BN | null;
  createdAt: BN;
};

export type SaleListingAccount = {
  seller: PublicKey;
  mint: PublicKey;
  priceLamports: BN;
  isActive: boolean;
  createdAt: BN;
};

export type SwapOfferAccount = {
  maker: PublicKey;
  makerMint: PublicKey;
  takerMint: PublicKey;
  makerSolDeltaLamports: BN;
  state: { active?: Record<string, never>; filled?: Record<string, never>; cancelled?: Record<string, never> };
  createdAt: BN;
};

export function getProgram(connection: Connection, wallet: WalletContextState) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: 'confirmed',
  });
  // Anchor 0.31+: Program(idl, provider). Program id is `idl.address` (must match on-chain deploy).
  return new Program(IDL as any, provider);
}

export const toLamports = (sol: number) => Math.floor(sol * 1_000_000_000);

export function getRentalListingAddress(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('rental_listing'), mint.toBuffer()], PROGRAM_ID);
}

export function getRentalEscrowAddress(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('rental_escrow'), mint.toBuffer()], PROGRAM_ID);
}

export function getRentalVaultAddress(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('rental_vault'), mint.toBuffer()], PROGRAM_ID);
}

export function getSaleListingAddress(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('sale_listing'), mint.toBuffer()], PROGRAM_ID);
}

export function getSaleEscrowAddress(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('sale_escrow'), mint.toBuffer()], PROGRAM_ID);
}

export function getSwapOfferAddress(makerMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('swap_offer'), makerMint.toBuffer()], PROGRAM_ID);
}

export function getSwapMakerEscrowAddress(makerMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('swap_escrow_maker'), makerMint.toBuffer()], PROGRAM_ID);
}

export async function listRentalNFT(
  program: Program,
  mint: PublicKey,
  ownerTokenAccount: PublicKey,
  dailyRentLamports: number,
  collateralLamports: number,
  minDurationDays: number,
  maxDurationDays: number
) {
  const [listing] = getRentalListingAddress(mint);
  const [escrowTokenAccount] = getRentalEscrowAddress(mint);

  return program.methods
    .listNft(
      new BN(dailyRentLamports),
      new BN(collateralLamports),
      minDurationDays,
      maxDurationDays
    )
    .accounts({
      listing,
      escrowTokenAccount,
      ownerTokenAccount,
      mint,
      owner: program.provider.publicKey!,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

export async function rentNFT(program: Program, mint: PublicKey, owner: PublicKey, durationDays: number) {
  const [listing] = getRentalListingAddress(mint);
  const [escrowTokenAccount] = getRentalEscrowAddress(mint);
  const [escrowVault] = getRentalVaultAddress(mint);
  const renterTokenAccount = await getAssociatedTokenAddress(mint, program.provider.publicKey!);

  return program.methods
    .rentNft(durationDays)
    .accounts({
      listing,
      escrowTokenAccount,
      escrowVault,
      renterTokenAccount,
      mint,
      owner,
      renter: program.provider.publicKey!,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();
}

export async function listSaleNFT(program: Program, mint: PublicKey, ownerTokenAccount: PublicKey, priceLamports: number) {
  const [saleListing] = getSaleListingAddress(mint);
  const [saleEscrowToken] = getSaleEscrowAddress(mint);

  return program.methods
    .listForSale(new BN(priceLamports))
    .accounts({
      saleListing,
      saleEscrowToken,
      ownerTokenAccount,
      mint,
      owner: program.provider.publicKey!,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

export async function buySaleNFT(program: Program, mint: PublicKey, seller: PublicKey) {
  const [saleListing] = getSaleListingAddress(mint);
  const [saleEscrowToken] = getSaleEscrowAddress(mint);
  const buyerTokenAccount = await getAssociatedTokenAddress(mint, program.provider.publicKey!);

  return program.methods
    .buySale()
    .accounts({
      saleListing,
      saleEscrowToken,
      seller,
      buyer: program.provider.publicKey!,
      buyerTokenAccount,
      mint,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();
}

export async function cancelSaleNFT(program: Program, mint: PublicKey) {
  const [saleListing] = getSaleListingAddress(mint);
  const [saleEscrowToken] = getSaleEscrowAddress(mint);
  const ownerTokenAccount = await getAssociatedTokenAddress(mint, program.provider.publicKey!);

  return program.methods
    .cancelSale()
    .accounts({
      saleListing,
      saleEscrowToken,
      ownerTokenAccount,
      owner: program.provider.publicKey!,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

export async function createSwapOffer(
  program: Program,
  makerMint: PublicKey,
  takerMint: PublicKey,
  makerTokenAccount: PublicKey,
  makerSolDeltaLamports: number
) {
  const [swapOffer] = getSwapOfferAddress(makerMint);
  const [swapEscrowMaker] = getSwapMakerEscrowAddress(makerMint);

  return program.methods
    .createSwap(takerMint, new BN(makerSolDeltaLamports))
    .accounts({
      swapOffer,
      swapEscrowMaker,
      makerTokenAccount,
      makerMint,
      maker: program.provider.publicKey!,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

export async function acceptSwapOffer(program: Program, makerMint: PublicKey, takerMint: PublicKey, takerTokenAccount: PublicKey) {
  const [swapOffer] = getSwapOfferAddress(makerMint);
  const [swapEscrowMaker] = getSwapMakerEscrowAddress(makerMint);
  const takerReceiveTokenAccount = await getAssociatedTokenAddress(makerMint, program.provider.publicKey!);

  const makerData = await (program.account as any).swapOffer.fetch(swapOffer);
  const maker = makerData.maker as PublicKey;
  const makerReceiveTokenAccount = await getAssociatedTokenAddress(takerMint, maker, true);

  return program.methods
    .acceptSwap()
    .accounts({
      swapOffer,
      swapEscrowMaker,
      maker,
      taker: program.provider.publicKey!,
      takerTokenAccount,
      takerReceiveTokenAccount,
      makerReceiveTokenAccount,
      makerMint,
      takerMint,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();
}

export async function cancelSwapOffer(program: Program, makerMint: PublicKey) {
  const [swapOffer] = getSwapOfferAddress(makerMint);
  const [swapEscrowMaker] = getSwapMakerEscrowAddress(makerMint);
  const makerTokenAccount = await getAssociatedTokenAddress(makerMint, program.provider.publicKey!);

  return program.methods
    .cancelSwap()
    .accounts({
      swapOffer,
      swapEscrowMaker,
      makerTokenAccount,
      maker: program.provider.publicKey!,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

export async function fetchRentalListings(program: Program) {
  return ((await (program.account as any).rentalListing.all()) as Array<{ publicKey: PublicKey; account: RentalListingAccount }>)
    .filter((entry) => entry.account.isActive);
}

export async function fetchSaleListings(program: Program) {
  return ((await (program.account as any).saleListing.all()) as Array<{ publicKey: PublicKey; account: SaleListingAccount }>)
    .filter((entry) => entry.account.isActive);
}

export async function fetchSwapOffers(program: Program) {
  return ((await (program.account as any).swapOffer.all()) as Array<{ publicKey: PublicKey; account: SwapOfferAccount }>)
    .filter((entry) => !!entry.account.state?.active);
}
