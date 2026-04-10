import { expect } from 'chai';
import { PublicKey } from '@solana/web3.js';
import {
  PROGRAM_ID,
  getRentalListingAddress,
  getRentalEscrowAddress,
  getSaleListingAddress,
  getSaleEscrowAddress,
  getSwapOfferAddress,
  getSwapMakerEscrowAddress,
} from '../src/lib/anchor';

describe('on-chain address derivations', () => {
  const makerMint = new PublicKey('So11111111111111111111111111111111111111112');
  const otherMint = new PublicKey('11111111111111111111111111111111');

  it('derives unique PDAs for rental and sale listing namespaces', () => {
    const [rentalListing] = getRentalListingAddress(makerMint);
    const [saleListing] = getSaleListingAddress(makerMint);
    expect(rentalListing.equals(saleListing)).to.eq(false);
  });

  it('derives deterministic escrow PDAs for each namespace', () => {
    const [rentalEscrow1] = getRentalEscrowAddress(makerMint);
    const [rentalEscrow2] = getRentalEscrowAddress(makerMint);
    const [saleEscrow] = getSaleEscrowAddress(makerMint);

    expect(rentalEscrow1.equals(rentalEscrow2)).to.eq(true);
    expect(rentalEscrow1.equals(saleEscrow)).to.eq(false);
  });

  it('derives deterministic swap offer and maker escrow PDAs', () => {
    const [offer1] = getSwapOfferAddress(makerMint);
    const [offer2] = getSwapOfferAddress(makerMint);
    const [makerEscrow] = getSwapMakerEscrowAddress(makerMint);
    const [otherOffer] = getSwapOfferAddress(otherMint);

    expect(offer1.equals(offer2)).to.eq(true);
    expect(offer1.equals(otherOffer)).to.eq(false);
    expect(offer1.equals(makerEscrow)).to.eq(false);
  });

  it('derivations are tied to the project program id', () => {
    const [listing] = getRentalListingAddress(makerMint);
    const [manual] = PublicKey.findProgramAddressSync(
      [Buffer.from('rental_listing'), makerMint.toBuffer()],
      PROGRAM_ID
    );
    expect(listing.equals(manual)).to.eq(true);
  });
});
