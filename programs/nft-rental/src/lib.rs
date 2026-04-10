use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, accessor, Mint, Token, TokenAccount, Transfer},
};

declare_id!("B5D4oqW13D5tGhBm9qNSUQxpxeiRZFPJUo6Eh5BYoWdW");

#[program]
pub mod nft_rental {
    use super::*;

    pub fn list_nft(
        ctx: Context<ListNFT>,
        daily_rent_lamports: u64,
        collateral_lamports: u64,
        min_duration_days: u32,
        max_duration_days: u32,
    ) -> Result<()> {
        require!(daily_rent_lamports > 0, RentalError::InvalidPrice);
        require!(min_duration_days > 0, RentalError::InvalidDuration);
        require!(max_duration_days >= min_duration_days, RentalError::InvalidDuration);
        require!(
            accessor::mint(&ctx.accounts.owner_token_account)? == ctx.accounts.mint.key(),
            RentalError::InvalidSwapMint
        );
        require!(
            accessor::authority(&ctx.accounts.owner_token_account)? == ctx.accounts.owner.key(),
            RentalError::UnauthorizedOwner
        );
        require!(
            accessor::amount(&ctx.accounts.owner_token_account)? >= 1,
            RentalError::InvalidDuration
        );

        let listing = &mut ctx.accounts.listing;
        let clock = Clock::get()?;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.owner_token_account.to_account_info(),
                    to: ctx.accounts.escrow_token_account.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            1,
        )?;

        listing.owner = ctx.accounts.owner.key();
        listing.mint = ctx.accounts.mint.key();
        listing.daily_rent_lamports = daily_rent_lamports;
        listing.collateral_lamports = collateral_lamports;
        listing.min_duration_days = min_duration_days;
        listing.max_duration_days = max_duration_days;
        listing.is_active = true;
        listing.current_renter = None;
        listing.rental_end_time = None;
        listing.created_at = clock.unix_timestamp;

        Ok(())
    }

    pub fn rent_nft(ctx: Context<RentNFT>, duration_days: u32) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let clock = Clock::get()?;

        require!(listing.is_active, RentalError::ListingNotActive);
        require!(listing.current_renter.is_none(), RentalError::AlreadyRented);
        require!(
            duration_days >= listing.min_duration_days && duration_days <= listing.max_duration_days,
            RentalError::InvalidDuration
        );
        require!(
            ctx.accounts.owner.key() == listing.owner,
            RentalError::UnauthorizedOwner
        );

        let total_rent = (listing.daily_rent_lamports as u128)
            .checked_mul(duration_days as u128)
            .ok_or(RentalError::Overflow)? as u64;
        let total_payment = total_rent
            .checked_add(listing.collateral_lamports)
            .ok_or(RentalError::Overflow)?;

        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.renter.to_account_info(),
                    to: ctx.accounts.escrow_vault.to_account_info(),
                },
            ),
            total_payment,
        )?;

        // NFT stays in program escrow for the lease so the lender can recover it after expiry
        // without the renter transferring the SPL token back.
        require!(
            ctx.accounts.escrow_token_account.amount == 1,
            RentalError::EscrowMissingNft
        );

        listing.current_renter = Some(ctx.accounts.renter.key());
        listing.rental_end_time = Some(clock.unix_timestamp + (duration_days as i64 * SECONDS_PER_DAY));

        let vault_bump = [ctx.bumps.escrow_vault];
        let vault_seeds: &[&[u8]] = &[b"rental_vault", listing.mint.as_ref(), &vault_bump];
        let vault_signer = &[vault_seeds];
        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.escrow_vault.to_account_info(),
                    to: ctx.accounts.owner.to_account_info(),
                },
                vault_signer,
            ),
            total_rent,
        )?;

        Ok(())
    }

    pub fn return_nft(ctx: Context<ReturnNFT>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;

        require!(listing.current_renter.is_some(), RentalError::NotRented);
        require!(
            listing.current_renter.unwrap() == ctx.accounts.renter.key(),
            RentalError::UnauthorizedRenter
        );

        let vault_bump = [ctx.bumps.escrow_vault];
        let vault_seeds: &[&[u8]] = &[b"rental_vault", listing.mint.as_ref(), &vault_bump];
        let vault_signer = &[vault_seeds];
        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.escrow_vault.to_account_info(),
                    to: ctx.accounts.renter.to_account_info(),
                },
                vault_signer,
            ),
            listing.collateral_lamports,
        )?;

        listing.current_renter = None;
        listing.rental_end_time = None;
        Ok(())
    }

    pub fn claim_expired_nft(ctx: Context<ClaimExpiredNFT>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let clock = Clock::get()?;

        require!(listing.current_renter.is_some(), RentalError::NotRented);
        require!(
            clock.unix_timestamp >= listing.rental_end_time.unwrap(),
            RentalError::RentalNotExpired
        );

        let escrow_bump = [ctx.bumps.escrow_token_account];
        let escrow_seeds: &[&[u8]] = &[b"rental_escrow", listing.mint.as_ref(), &escrow_bump];
        let escrow_signer = &[escrow_seeds];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.owner_token_account.to_account_info(),
                    authority: ctx.accounts.escrow_token_account.to_account_info(),
                },
                escrow_signer,
            ),
            1,
        )?;

        let vault_bump = [ctx.bumps.escrow_vault];
        let vault_seeds: &[&[u8]] = &[b"rental_vault", listing.mint.as_ref(), &vault_bump];
        let vault_signer = &[vault_seeds];
        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.escrow_vault.to_account_info(),
                    to: ctx.accounts.owner.to_account_info(),
                },
                vault_signer,
            ),
            listing.collateral_lamports,
        )?;

        listing.current_renter = None;
        listing.rental_end_time = None;
        listing.is_active = false;
        Ok(())
    }

    pub fn unlist_nft(ctx: Context<UnlistNFT>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(listing.current_renter.is_none(), RentalError::CannotUnlistRentedNFT);

        let escrow_bump = [ctx.bumps.escrow_token_account];
        let escrow_seeds: &[&[u8]] = &[b"rental_escrow", listing.mint.as_ref(), &escrow_bump];
        let escrow_signer = &[escrow_seeds];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.owner_token_account.to_account_info(),
                    authority: ctx.accounts.escrow_token_account.to_account_info(),
                },
                escrow_signer,
            ),
            1,
        )?;

        listing.is_active = false;
        Ok(())
    }

    pub fn list_for_sale(ctx: Context<ListForSale>, price_lamports: u64) -> Result<()> {
        require!(price_lamports > 0, RentalError::InvalidPrice);
        let listing = &mut ctx.accounts.sale_listing;
        let clock = Clock::get()?;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.owner_token_account.to_account_info(),
                    to: ctx.accounts.sale_escrow_token.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            1,
        )?;

        listing.seller = ctx.accounts.owner.key();
        listing.mint = ctx.accounts.mint.key();
        listing.price_lamports = price_lamports;
        listing.is_active = true;
        listing.created_at = clock.unix_timestamp;
        Ok(())
    }

    pub fn buy_sale(ctx: Context<BuySale>) -> Result<()> {
        let listing = &mut ctx.accounts.sale_listing;
        require!(listing.is_active, RentalError::SaleNotActive);
        require!(listing.seller != ctx.accounts.buyer.key(), RentalError::CannotBuyOwnListing);

        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.seller.to_account_info(),
                },
            ),
            listing.price_lamports,
        )?;

        let sale_bump = [ctx.bumps.sale_escrow_token];
        let sale_seeds: &[&[u8]] = &[b"sale_escrow", listing.mint.as_ref(), &sale_bump];
        let escrow_signer = &[sale_seeds];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.sale_escrow_token.to_account_info(),
                    to: ctx.accounts.buyer_token_account.to_account_info(),
                    authority: ctx.accounts.sale_escrow_token.to_account_info(),
                },
                escrow_signer,
            ),
            1,
        )?;

        listing.is_active = false;
        Ok(())
    }

    pub fn cancel_sale(ctx: Context<CancelSale>) -> Result<()> {
        let listing = &mut ctx.accounts.sale_listing;
        require!(listing.is_active, RentalError::SaleNotActive);

        let sale_bump = [ctx.bumps.sale_escrow_token];
        let sale_seeds: &[&[u8]] = &[b"sale_escrow", listing.mint.as_ref(), &sale_bump];
        let escrow_signer = &[sale_seeds];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.sale_escrow_token.to_account_info(),
                    to: ctx.accounts.owner_token_account.to_account_info(),
                    authority: ctx.accounts.sale_escrow_token.to_account_info(),
                },
                escrow_signer,
            ),
            1,
        )?;

        listing.is_active = false;
        Ok(())
    }

    pub fn create_swap(
        ctx: Context<CreateSwap>,
        taker_mint: Pubkey,
        maker_sol_delta_lamports: u64,
    ) -> Result<()> {
        let offer = &mut ctx.accounts.swap_offer;
        let clock = Clock::get()?;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.maker_token_account.to_account_info(),
                    to: ctx.accounts.swap_escrow_maker.to_account_info(),
                    authority: ctx.accounts.maker.to_account_info(),
                },
            ),
            1,
        )?;

        offer.maker = ctx.accounts.maker.key();
        offer.maker_mint = ctx.accounts.maker_mint.key();
        offer.taker_mint = taker_mint;
        offer.maker_sol_delta_lamports = maker_sol_delta_lamports;
        offer.state = OfferState::Active;
        offer.created_at = clock.unix_timestamp;
        Ok(())
    }

    pub fn accept_swap(ctx: Context<AcceptSwap>) -> Result<()> {
        let offer = &mut ctx.accounts.swap_offer;
        require!(offer.state == OfferState::Active, RentalError::SwapNotActive);
        require!(offer.maker != ctx.accounts.taker.key(), RentalError::CannotSwapWithSelf);
        require!(
            ctx.accounts.taker_token_account.mint == offer.taker_mint,
            RentalError::InvalidSwapMint
        );

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.taker_token_account.to_account_info(),
                    to: ctx.accounts.maker_receive_token_account.to_account_info(),
                    authority: ctx.accounts.taker.to_account_info(),
                },
            ),
            1,
        )?;

        let maker_escrow_bump = [ctx.bumps.swap_escrow_maker];
        let maker_escrow_seeds: &[&[u8]] =
            &[b"swap_escrow_maker", offer.maker_mint.as_ref(), &maker_escrow_bump];
        let maker_escrow_signer = &[maker_escrow_seeds];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.swap_escrow_maker.to_account_info(),
                    to: ctx.accounts.taker_receive_token_account.to_account_info(),
                    authority: ctx.accounts.swap_escrow_maker.to_account_info(),
                },
                maker_escrow_signer,
            ),
            1,
        )?;

        if offer.maker_sol_delta_lamports > 0 {
            anchor_lang::system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    anchor_lang::system_program::Transfer {
                        from: ctx.accounts.taker.to_account_info(),
                        to: ctx.accounts.maker.to_account_info(),
                    },
                ),
                offer.maker_sol_delta_lamports,
            )?;
        }

        offer.state = OfferState::Filled;
        Ok(())
    }

    pub fn cancel_swap(ctx: Context<CancelSwap>) -> Result<()> {
        let offer = &mut ctx.accounts.swap_offer;
        require!(offer.state == OfferState::Active, RentalError::SwapNotActive);

        let maker_escrow_bump = [ctx.bumps.swap_escrow_maker];
        let maker_escrow_seeds: &[&[u8]] =
            &[b"swap_escrow_maker", offer.maker_mint.as_ref(), &maker_escrow_bump];
        let maker_escrow_signer = &[maker_escrow_seeds];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.swap_escrow_maker.to_account_info(),
                    to: ctx.accounts.maker_token_account.to_account_info(),
                    authority: ctx.accounts.swap_escrow_maker.to_account_info(),
                },
                maker_escrow_signer,
            ),
            1,
        )?;

        offer.state = OfferState::Cancelled;
        Ok(())
    }
}

const SECONDS_PER_DAY: i64 = 24 * 60 * 60;

#[derive(Accounts)]
pub struct ListNFT<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + RentalListing::INIT_SPACE,
        seeds = [b"rental_listing", mint.key().as_ref()],
        bump
    )]
    pub listing: Box<Account<'info, RentalListing>>,
    #[account(
        init,
        payer = owner,
        seeds = [b"rental_escrow", mint.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = escrow_token_account,
    )]
    pub escrow_token_account: Box<Account<'info, TokenAccount>>,
    /// CHECK: validated at runtime via token accessor checks.
    #[account(mut)]
    pub owner_token_account: AccountInfo<'info>,
    pub mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RentNFT<'info> {
    #[account(
        mut,
        seeds = [b"rental_listing", listing.mint.as_ref()],
        bump
    )]
    pub listing: Account<'info, RentalListing>,
    #[account(
        mut,
        seeds = [b"rental_escrow", listing.mint.as_ref()],
        bump,
        constraint = escrow_token_account.mint == listing.mint
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"rental_vault", listing.mint.as_ref()],
        bump
    )]
    /// CHECK: PDA used as SOL vault.
    pub escrow_vault: AccountInfo<'info>,
    /// CHECK: receives rent payout.
    #[account(mut)]
    pub owner: AccountInfo<'info>,
    #[account(mut)]
    pub renter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReturnNFT<'info> {
    #[account(
        mut,
        seeds = [b"rental_listing", listing.mint.as_ref()],
        bump
    )]
    pub listing: Account<'info, RentalListing>,
    #[account(
        mut,
        seeds = [b"rental_vault", listing.mint.as_ref()],
        bump
    )]
    /// CHECK: PDA used as SOL vault.
    pub escrow_vault: AccountInfo<'info>,
    #[account(mut)]
    pub renter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimExpiredNFT<'info> {
    #[account(
        mut,
        seeds = [b"rental_listing", listing.mint.as_ref()],
        bump,
        constraint = listing.owner == owner.key()
    )]
    pub listing: Account<'info, RentalListing>,
    #[account(
        mut,
        seeds = [b"rental_escrow", listing.mint.as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"rental_vault", listing.mint.as_ref()],
        bump
    )]
    /// CHECK: PDA used as SOL vault.
    pub escrow_vault: AccountInfo<'info>,
    #[account(
        mut,
        constraint = owner_token_account.mint == listing.mint,
        constraint = owner_token_account.owner == owner.key()
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UnlistNFT<'info> {
    #[account(
        mut,
        seeds = [b"rental_listing", listing.mint.as_ref()],
        bump,
        constraint = listing.owner == owner.key()
    )]
    pub listing: Account<'info, RentalListing>,
    #[account(
        mut,
        seeds = [b"rental_escrow", listing.mint.as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = owner_token_account.mint == listing.mint,
        constraint = owner_token_account.owner == owner.key()
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ListForSale<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + SaleListing::INIT_SPACE,
        seeds = [b"sale_listing", mint.key().as_ref()],
        bump
    )]
    pub sale_listing: Account<'info, SaleListing>,
    #[account(
        init,
        payer = owner,
        seeds = [b"sale_escrow", mint.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = sale_escrow_token,
    )]
    pub sale_escrow_token: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = owner_token_account.mint == mint.key(),
        constraint = owner_token_account.owner == owner.key(),
        constraint = owner_token_account.amount == 1
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BuySale<'info> {
    #[account(mut, seeds = [b"sale_listing", sale_listing.mint.as_ref()], bump)]
    pub sale_listing: Account<'info, SaleListing>,
    #[account(mut, seeds = [b"sale_escrow", sale_listing.mint.as_ref()], bump)]
    pub sale_escrow_token: Account<'info, TokenAccount>,
    /// CHECK: seller wallet receives SOL.
    #[account(mut, address = sale_listing.seller)]
    pub seller: AccountInfo<'info>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = mint,
        associated_token::authority = buyer
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,
    #[account(mut, address = sale_listing.mint)]
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CancelSale<'info> {
    #[account(
        mut,
        seeds = [b"sale_listing", sale_listing.mint.as_ref()],
        bump,
        constraint = sale_listing.seller == owner.key()
    )]
    pub sale_listing: Account<'info, SaleListing>,
    #[account(
        mut,
        seeds = [b"sale_escrow", sale_listing.mint.as_ref()],
        bump
    )]
    pub sale_escrow_token: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = owner_token_account.mint == sale_listing.mint,
        constraint = owner_token_account.owner == owner.key()
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CreateSwap<'info> {
    #[account(
        init,
        payer = maker,
        space = 8 + SwapOffer::INIT_SPACE,
        seeds = [b"swap_offer", maker_mint.key().as_ref()],
        bump
    )]
    pub swap_offer: Account<'info, SwapOffer>,
    #[account(
        init,
        payer = maker,
        seeds = [b"swap_escrow_maker", maker_mint.key().as_ref()],
        bump,
        token::mint = maker_mint,
        token::authority = swap_escrow_maker
    )]
    pub swap_escrow_maker: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = maker_token_account.mint == maker_mint.key(),
        constraint = maker_token_account.owner == maker.key(),
        constraint = maker_token_account.amount == 1
    )]
    pub maker_token_account: Account<'info, TokenAccount>,
    pub maker_mint: Account<'info, Mint>,
    #[account(mut)]
    pub maker: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AcceptSwap<'info> {
    #[account(mut, seeds = [b"swap_offer", swap_offer.maker_mint.as_ref()], bump)]
    pub swap_offer: Box<Account<'info, SwapOffer>>,
    #[account(mut, seeds = [b"swap_escrow_maker", swap_offer.maker_mint.as_ref()], bump)]
    pub swap_escrow_maker: Box<Account<'info, TokenAccount>>,
    /// CHECK: maker wallet receives optional SOL delta.
    #[account(mut, address = swap_offer.maker)]
    pub maker: AccountInfo<'info>,
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(
        mut,
        constraint = taker_token_account.owner == taker.key(),
        constraint = taker_token_account.amount == 1
    )]
    pub taker_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = maker_mint,
        associated_token::authority = taker
    )]
    pub taker_receive_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = taker_mint,
        associated_token::authority = maker
    )]
    pub maker_receive_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut, address = swap_offer.maker_mint)]
    pub maker_mint: Box<Account<'info, Mint>>,
    #[account(mut, address = swap_offer.taker_mint)]
    pub taker_mint: Box<Account<'info, Mint>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CancelSwap<'info> {
    #[account(
        mut,
        seeds = [b"swap_offer", swap_offer.maker_mint.as_ref()],
        bump,
        constraint = swap_offer.maker == maker.key()
    )]
    pub swap_offer: Account<'info, SwapOffer>,
    #[account(
        mut,
        seeds = [b"swap_escrow_maker", swap_offer.maker_mint.as_ref()],
        bump
    )]
    pub swap_escrow_maker: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = maker_token_account.owner == maker.key(),
        constraint = maker_token_account.mint == swap_offer.maker_mint
    )]
    pub maker_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub maker: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct RentalListing {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub daily_rent_lamports: u64,
    pub collateral_lamports: u64,
    pub min_duration_days: u32,
    pub max_duration_days: u32,
    pub is_active: bool,
    pub current_renter: Option<Pubkey>,
    pub rental_end_time: Option<i64>,
    pub created_at: i64,
}

impl RentalListing {
    pub const INIT_SPACE: usize = 32 + 32 + 8 + 8 + 4 + 4 + 1 + (1 + 32) + (1 + 8) + 8;
}

#[account]
pub struct SaleListing {
    pub seller: Pubkey,
    pub mint: Pubkey,
    pub price_lamports: u64,
    pub is_active: bool,
    pub created_at: i64,
}

impl SaleListing {
    pub const INIT_SPACE: usize = 32 + 32 + 8 + 1 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum OfferState {
    Active,
    Filled,
    Cancelled,
}

#[account]
pub struct SwapOffer {
    pub maker: Pubkey,
    pub maker_mint: Pubkey,
    pub taker_mint: Pubkey,
    pub maker_sol_delta_lamports: u64,
    pub state: OfferState,
    pub created_at: i64,
}

impl SwapOffer {
    pub const INIT_SPACE: usize = 32 + 32 + 32 + 8 + 1 + 8;
}

#[error_code]
pub enum RentalError {
    #[msg("Listing is not active")]
    ListingNotActive,
    #[msg("NFT is already rented")]
    AlreadyRented,
    #[msg("Invalid rental duration")]
    InvalidDuration,
    #[msg("Rental escrow must hold the NFT")]
    EscrowMissingNft,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("NFT is not currently rented")]
    NotRented,
    #[msg("Unauthorized renter")]
    UnauthorizedRenter,
    #[msg("Rental period has not expired yet")]
    RentalNotExpired,
    #[msg("Cannot unlist an NFT that is currently rented")]
    CannotUnlistRentedNFT,
    #[msg("Price must be greater than zero")]
    InvalidPrice,
    #[msg("Sale listing is not active")]
    SaleNotActive,
    #[msg("Cannot buy your own listing")]
    CannotBuyOwnListing,
    #[msg("Unauthorized owner account")]
    UnauthorizedOwner,
    #[msg("Swap offer is not active")]
    SwapNotActive,
    #[msg("Cannot swap with self")]
    CannotSwapWithSelf,
    #[msg("Swap mint did not match required mint")]
    InvalidSwapMint,
}
