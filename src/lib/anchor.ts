import { AnchorProvider, Program, Idl, web3, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Program ID from Anchor.toml
export const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');

// Metaplex Token Metadata Program ID
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Simple IDL definition for our program
export const IDL = {
  version: "0.1.0",
  name: "nft_rental",
  instructions: [
    {
      name: "listNft",
      discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
      accounts: [
        { name: "listing", isMut: true, isSigner: false },
        { name: "escrowTokenAccount", isMut: true, isSigner: false },
        { name: "escrowVault", isMut: true, isSigner: false },
        { name: "ownerTokenAccount", isMut: true, isSigner: false },
        { name: "mint", isMut: false, isSigner: false },
        { name: "metadata", isMut: false, isSigner: false },
        { name: "owner", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false },
      ],
      args: [
        { name: "dailyRentLamports", type: "u64" },
        { name: "collateralLamports", type: "u64" },
        { name: "minDurationDays", type: "u32" },
        { name: "maxDurationDays", type: "u32" },
      ],
    },
    {
      name: "rentNft",
      discriminator: [2, 3, 4, 5, 6, 7, 8, 9],
      accounts: [
        { name: "listing", isMut: true, isSigner: false },
        { name: "escrowTokenAccount", isMut: true, isSigner: false },
        { name: "escrowVault", isMut: true, isSigner: false },
        { name: "renterTokenAccount", isMut: true, isSigner: false },
        { name: "owner", isMut: true, isSigner: false },
        { name: "renter", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false },
      ],
      args: [
        { name: "durationDays", type: "u32" },
      ],
    },
  ],
  accounts: [
    {
      name: "RentalListing",
      discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "mint", type: "publicKey" },
          { name: "dailyRentLamports", type: "u64" },
          { name: "collateralLamports", type: "u64" },
          { name: "minDurationDays", type: "u32" },
          { name: "maxDurationDays", type: "u32" },
          { name: "isActive", type: "bool" },
          { name: "currentRenter", type: { option: "publicKey" } },
          { name: "rentalEndTime", type: { option: "i64" } },
          { name: "createdAt", type: "i64" },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "ListingNotActive", msg: "Listing is not active" },
    { code: 6001, name: "AlreadyRented", msg: "NFT is already rented" },
    { code: 6002, name: "InvalidDuration", msg: "Invalid rental duration" },
    { code: 6003, name: "Overflow", msg: "Arithmetic overflow" },
    { code: 6004, name: "NotRented", msg: "NFT is not currently rented" },
    { code: 6005, name: "UnauthorizedRenter", msg: "Unauthorized renter" },
    { code: 6006, name: "RentalNotExpired", msg: "Rental period has not expired yet" },
    { code: 6007, name: "CannotUnlistRentedNFT", msg: "Cannot unlist an NFT that is currently rented" },
  ],
} as const;

export function getProgram(connection: Connection, wallet: WalletContextState) {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: 'confirmed',
  });

  return new Program(IDL as any, provider);
}

export function getListingAddress(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('listing'), mint.toBuffer()],
    PROGRAM_ID
  );
}

export function getEscrowTokenAddress(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), mint.toBuffer()],
    PROGRAM_ID
  );
}

export function getEscrowVaultAddress(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), mint.toBuffer()],
    PROGRAM_ID
  );
}

export function getMetadataAddress(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );
}

export async function listNFT(
  program: Program,
  mint: PublicKey,
  ownerTokenAccount: PublicKey,
  dailyRentLamports: number,
  collateralLamports: number,
  minDurationDays: number,
  maxDurationDays: number
) {
  const [listing] = getListingAddress(mint);
  const [escrowTokenAccount] = getEscrowTokenAddress(mint);
  const [escrowVault] = getEscrowVaultAddress(mint);
  const [metadata] = getMetadataAddress(mint);

  return await program.methods
    .listNft(
      new BN(dailyRentLamports),
      new BN(collateralLamports),
      minDurationDays,
      maxDurationDays
    )
    .accounts({
      listing,
      escrowTokenAccount,
      escrowVault,
      ownerTokenAccount,
      mint,
      metadata,
      owner: program.provider.publicKey!,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();
}

export async function rentNFT(
  program: Program,
  mint: PublicKey,
  durationDays: number
) {
  const [listing] = getListingAddress(mint);
  const [escrowTokenAccount] = getEscrowTokenAddress(mint);
  const [escrowVault] = getEscrowVaultAddress(mint);
  
  // For now, we'll simulate getting the listing data since the program isn't deployed
  // In a real scenario, you'd fetch this from the blockchain
  const mockOwner = new PublicKey('11111111111111111111111111111111'); // Replace with actual owner
  
  const renterTokenAccount = await getAssociatedTokenAddress(
    mint,
    program.provider.publicKey!
  );

  return await program.methods
    .rentNft(durationDays)
    .accounts({
      listing,
      escrowTokenAccount,
      escrowVault,
      renterTokenAccount,
      owner: mockOwner,
      renter: program.provider.publicKey!,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .simulate(); // Use simulate for testing until program is deployed
}