use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use mpl_token_metadata::accounts::Metadata;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

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
        let listing = &mut ctx.accounts.listing;
        let clock = Clock::get()?;

        // Transfer NFT to escrow
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.owner_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, 1)?;

        // Initialize listing
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

    pub fn rent_nft(
        ctx: Context<RentNFT>,
        duration_days: u32,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let clock = Clock::get()?;

        require!(listing.is_active, RentalError::ListingNotActive);
        require!(listing.current_renter.is_none(), RentalError::AlreadyRented);
        require!(
            duration_days >= listing.min_duration_days && duration_days <= listing.max_duration_days,
            RentalError::InvalidDuration
        );

        let total_rent = (listing.daily_rent_lamports as u128)
            .checked_mul(duration_days as u128)
            .ok_or(RentalError::Overflow)? as u64;
        
        let total_payment = total_rent
            .checked_add(listing.collateral_lamports)
            .ok_or(RentalError::Overflow)?;

        // Transfer payment from renter to escrow
        let transfer_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.renter.to_account_info(),
                to: ctx.accounts.escrow_vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(transfer_ctx, total_payment)?;

        // Transfer NFT to renter
        let bump = ctx.bumps.escrow_token_account;
        let seeds = &[
            b"escrow",
            listing.mint.as_ref(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.renter_token_account.to_account_info(),
                authority: ctx.accounts.escrow_token_account.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_ctx, 1)?;

        // Update listing
        listing.current_renter = Some(ctx.accounts.renter.key());
        listing.rental_end_time = Some(
            clock.unix_timestamp + (duration_days as i64 * 24 * 60 * 60)
        );

        // Transfer rent to owner (keep collateral in escrow)
        let owner_payment_ctx = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.escrow_vault.to_account_info(),
                to: ctx.accounts.owner.to_account_info(),
            },
            signer_seeds,
        );
        anchor_lang::system_program::transfer(owner_payment_ctx, total_rent)?;

        Ok(())
    }

    pub fn return_nft(ctx: Context<ReturnNFT>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let clock = Clock::get()?;

        require!(listing.current_renter.is_some(), RentalError::NotRented);
        require!(
            listing.current_renter.unwrap() == ctx.accounts.renter.key(),
            RentalError::UnauthorizedRenter
        );

        // Transfer NFT back to escrow
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.renter_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.renter.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, 1)?;

        // Return collateral to renter
        let bump = ctx.bumps.escrow_vault;
        let seeds = &[
            b"vault",
            listing.mint.as_ref(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let collateral_ctx = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.escrow_vault.to_account_info(),
                to: ctx.accounts.renter.to_account_info(),
            },
            signer_seeds,
        );
        anchor_lang::system_program::transfer(collateral_ctx, listing.collateral_lamports)?;

        // Clear rental info
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

        // Transfer NFT back to owner
        let bump = ctx.bumps.escrow_token_account;
        let seeds = &[
            b"escrow",
            listing.mint.as_ref(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.owner_token_account.to_account_info(),
                authority: ctx.accounts.escrow_token_account.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_ctx, 1)?;

        // Transfer collateral to owner (penalty for not returning)
        let vault_bump = ctx.bumps.escrow_vault;
        let vault_seeds = &[
            b"vault",
            listing.mint.as_ref(),
            &[vault_bump],
        ];
        let vault_signer_seeds = &[&vault_seeds[..]];

        let collateral_ctx = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.escrow_vault.to_account_info(),
                to: ctx.accounts.owner.to_account_info(),
            },
            vault_signer_seeds,
        );
        anchor_lang::system_program::transfer(collateral_ctx, listing.collateral_lamports)?;

        // Clear rental info and deactivate listing
        listing.current_renter = None;
        listing.rental_end_time = None;
        listing.is_active = false;

        Ok(())
    }

    pub fn unlist_nft(ctx: Context<UnlistNFT>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;

        require!(listing.current_renter.is_none(), RentalError::CannotUnlistRentedNFT);

        // Transfer NFT back to owner
        let bump = ctx.bumps.escrow_token_account;
        let seeds = &[
            b"escrow",
            listing.mint.as_ref(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.owner_token_account.to_account_info(),
                authority: ctx.accounts.escrow_token_account.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_ctx, 1)?;

        listing.is_active = false;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct ListNFT<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 32 + 8 + 8 + 4 + 4 + 1 + 33 + 9 + 8,
        seeds = [b"listing", mint.key().as_ref()],
        bump
    )]
    pub listing: Account<'info, RentalListing>,
    
    #[account(
        init,
        payer = owner,
        seeds = [b"escrow", mint.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = escrow_token_account,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = owner,
        seeds = [b"vault", mint.key().as_ref()],
        bump,
        space = 0
    )]
    /// CHECK: This is a PDA used to hold SOL
    pub escrow_vault: AccountInfo<'info>,
    
    #[account(
        mut,
        constraint = owner_token_account.mint == mint.key(),
        constraint = owner_token_account.owner == owner.key(),
        constraint = owner_token_account.amount == 1
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    pub mint: Account<'info, Mint>,
    
    /// CHECK: Metadata account validation
    #[account(
        seeds = [b"metadata", mpl_token_metadata::ID.as_ref(), mint.key().as_ref()],
        bump,
        seeds::program = mpl_token_metadata::ID
    )]
    pub metadata: AccountInfo<'info>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct RentNFT<'info> {
    #[account(
        mut,
        seeds = [b"listing", listing.mint.as_ref()],
        bump
    )]
    pub listing: Account<'info, RentalListing>,
    
    #[account(
        mut,
        seeds = [b"escrow", listing.mint.as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"vault", listing.mint.as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used to hold SOL
    pub escrow_vault: AccountInfo<'info>,
    
    #[account(
        init_if_needed,
        payer = renter,
        associated_token::mint = listing.mint,
        associated_token::authority = renter
    )]
    pub renter_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: Owner account for rent payment
    #[account(mut, constraint = owner.key() == listing.owner)]
    pub owner: AccountInfo<'info>,
    
    #[account(mut)]
    pub renter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ReturnNFT<'info> {
    #[account(
        mut,
        seeds = [b"listing", listing.mint.as_ref()],
        bump
    )]
    pub listing: Account<'info, RentalListing>,
    
    #[account(
        mut,
        seeds = [b"escrow", listing.mint.as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"vault", listing.mint.as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used to hold SOL
    pub escrow_vault: AccountInfo<'info>,
    
    #[account(
        mut,
        constraint = renter_token_account.mint == listing.mint,
        constraint = renter_token_account.owner == renter.key(),
        constraint = renter_token_account.amount == 1
    )]
    pub renter_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub renter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimExpiredNFT<'info> {
    #[account(
        mut,
        seeds = [b"listing", listing.mint.as_ref()],
        bump,
        constraint = listing.owner == owner.key()
    )]
    pub listing: Account<'info, RentalListing>,
    
    #[account(
        mut,
        seeds = [b"escrow", listing.mint.as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"vault", listing.mint.as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used to hold SOL
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
        seeds = [b"listing", listing.mint.as_ref()],
        bump,
        constraint = listing.owner == owner.key()
    )]
    pub listing: Account<'info, RentalListing>,
    
    #[account(
        mut,
        seeds = [b"escrow", listing.mint.as_ref()],
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

#[error_code]
pub enum RentalError {
    #[msg("Listing is not active")]
    ListingNotActive,
    #[msg("NFT is already rented")]
    AlreadyRented,
    #[msg("Invalid rental duration")]
    InvalidDuration,
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
}
