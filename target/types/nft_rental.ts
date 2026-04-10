/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/nft_rental.json`.
 */
export type NftRental = {
  "address": "B5D4oqW13D5tGhBm9qNSUQxpxeiRZFPJUo6Eh5BYoWdW",
  "metadata": {
    "name": "nftRental",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "acceptSwap",
      "discriminator": [
        166,
        173,
        240,
        207,
        167,
        11,
        3,
        20
      ],
      "accounts": [
        {
          "name": "swapOffer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  119,
                  97,
                  112,
                  95,
                  111,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "swap_offer.maker_mint",
                "account": "swapOffer"
              }
            ]
          }
        },
        {
          "name": "swapEscrowMaker",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  119,
                  97,
                  112,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  109,
                  97,
                  107,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "swap_offer.maker_mint",
                "account": "swapOffer"
              }
            ]
          }
        },
        {
          "name": "maker",
          "writable": true
        },
        {
          "name": "taker",
          "writable": true,
          "signer": true
        },
        {
          "name": "takerTokenAccount",
          "writable": true
        },
        {
          "name": "takerReceiveTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "taker"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "makerMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "makerReceiveTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "maker"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "takerMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "makerMint",
          "writable": true
        },
        {
          "name": "takerMint",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "buySale",
      "discriminator": [
        128,
        43,
        75,
        244,
        133,
        181,
        175,
        23
      ],
      "accounts": [
        {
          "name": "saleListing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  97,
                  108,
                  101,
                  95,
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "sale_listing.mint",
                "account": "saleListing"
              }
            ]
          }
        },
        {
          "name": "saleEscrowToken",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  97,
                  108,
                  101,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "sale_listing.mint",
                "account": "saleListing"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "buyerTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "buyer"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "cancelSale",
      "discriminator": [
        82,
        137,
        56,
        136,
        94,
        9,
        205,
        10
      ],
      "accounts": [
        {
          "name": "saleListing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  97,
                  108,
                  101,
                  95,
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "sale_listing.mint",
                "account": "saleListing"
              }
            ]
          }
        },
        {
          "name": "saleEscrowToken",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  97,
                  108,
                  101,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "sale_listing.mint",
                "account": "saleListing"
              }
            ]
          }
        },
        {
          "name": "ownerTokenAccount",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "cancelSwap",
      "discriminator": [
        88,
        174,
        98,
        148,
        24,
        252,
        93,
        89
      ],
      "accounts": [
        {
          "name": "swapOffer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  119,
                  97,
                  112,
                  95,
                  111,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "swap_offer.maker_mint",
                "account": "swapOffer"
              }
            ]
          }
        },
        {
          "name": "swapEscrowMaker",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  119,
                  97,
                  112,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  109,
                  97,
                  107,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "swap_offer.maker_mint",
                "account": "swapOffer"
              }
            ]
          }
        },
        {
          "name": "makerTokenAccount",
          "writable": true
        },
        {
          "name": "maker",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "claimExpiredNft",
      "discriminator": [
        252,
        207,
        106,
        177,
        245,
        6,
        77,
        36
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  110,
                  116,
                  97,
                  108,
                  95,
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "listing.mint",
                "account": "rentalListing"
              }
            ]
          }
        },
        {
          "name": "escrowTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  110,
                  116,
                  97,
                  108,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "listing.mint",
                "account": "rentalListing"
              }
            ]
          }
        },
        {
          "name": "escrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  110,
                  116,
                  97,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "listing.mint",
                "account": "rentalListing"
              }
            ]
          }
        },
        {
          "name": "ownerTokenAccount",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "createSwap",
      "discriminator": [
        176,
        207,
        238,
        60,
        195,
        2,
        203,
        91
      ],
      "accounts": [
        {
          "name": "swapOffer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  119,
                  97,
                  112,
                  95,
                  111,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "makerMint"
              }
            ]
          }
        },
        {
          "name": "swapEscrowMaker",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  119,
                  97,
                  112,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  109,
                  97,
                  107,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "makerMint"
              }
            ]
          }
        },
        {
          "name": "makerTokenAccount",
          "writable": true
        },
        {
          "name": "makerMint"
        },
        {
          "name": "maker",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "takerMint",
          "type": "pubkey"
        },
        {
          "name": "makerSolDeltaLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "listForSale",
      "discriminator": [
        188,
        214,
        1,
        112,
        93,
        215,
        124,
        207
      ],
      "accounts": [
        {
          "name": "saleListing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  97,
                  108,
                  101,
                  95,
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "saleEscrowToken",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  97,
                  108,
                  101,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "ownerTokenAccount",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "priceLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "listNft",
      "discriminator": [
        88,
        221,
        93,
        166,
        63,
        220,
        106,
        232
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  110,
                  116,
                  97,
                  108,
                  95,
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "escrowTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  110,
                  116,
                  97,
                  108,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "ownerTokenAccount",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "dailyRentLamports",
          "type": "u64"
        },
        {
          "name": "collateralLamports",
          "type": "u64"
        },
        {
          "name": "minDurationDays",
          "type": "u32"
        },
        {
          "name": "maxDurationDays",
          "type": "u32"
        }
      ]
    },
    {
      "name": "rentNft",
      "discriminator": [
        171,
        71,
        244,
        6,
        182,
        65,
        239,
        94
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  110,
                  116,
                  97,
                  108,
                  95,
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "listing.mint",
                "account": "rentalListing"
              }
            ]
          }
        },
        {
          "name": "escrowTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  110,
                  116,
                  97,
                  108,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "listing.mint",
                "account": "rentalListing"
              }
            ]
          }
        },
        {
          "name": "escrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  110,
                  116,
                  97,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "listing.mint",
                "account": "rentalListing"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true
        },
        {
          "name": "renter",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "durationDays",
          "type": "u32"
        }
      ]
    },
    {
      "name": "returnNft",
      "discriminator": [
        224,
        67,
        212,
        248,
        72,
        43,
        233,
        1
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  110,
                  116,
                  97,
                  108,
                  95,
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "listing.mint",
                "account": "rentalListing"
              }
            ]
          }
        },
        {
          "name": "escrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  110,
                  116,
                  97,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "listing.mint",
                "account": "rentalListing"
              }
            ]
          }
        },
        {
          "name": "renter",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "unlistNft",
      "discriminator": [
        29,
        27,
        34,
        4,
        146,
        64,
        249,
        21
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  110,
                  116,
                  97,
                  108,
                  95,
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "listing.mint",
                "account": "rentalListing"
              }
            ]
          }
        },
        {
          "name": "escrowTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  110,
                  116,
                  97,
                  108,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "listing.mint",
                "account": "rentalListing"
              }
            ]
          }
        },
        {
          "name": "ownerTokenAccount",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "rentalListing",
      "discriminator": [
        76,
        239,
        227,
        36,
        98,
        137,
        187,
        158
      ]
    },
    {
      "name": "saleListing",
      "discriminator": [
        167,
        97,
        203,
        156,
        150,
        97,
        238,
        220
      ]
    },
    {
      "name": "swapOffer",
      "discriminator": [
        7,
        43,
        1,
        115,
        121,
        33,
        172,
        68
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "listingNotActive",
      "msg": "Listing is not active"
    },
    {
      "code": 6001,
      "name": "alreadyRented",
      "msg": "NFT is already rented"
    },
    {
      "code": 6002,
      "name": "invalidDuration",
      "msg": "Invalid rental duration"
    },
    {
      "code": 6003,
      "name": "escrowMissingNft",
      "msg": "Rental escrow must hold the NFT"
    },
    {
      "code": 6004,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6005,
      "name": "notRented",
      "msg": "NFT is not currently rented"
    },
    {
      "code": 6006,
      "name": "unauthorizedRenter",
      "msg": "Unauthorized renter"
    },
    {
      "code": 6007,
      "name": "rentalNotExpired",
      "msg": "Rental period has not expired yet"
    },
    {
      "code": 6008,
      "name": "cannotUnlistRentedNft",
      "msg": "Cannot unlist an NFT that is currently rented"
    },
    {
      "code": 6009,
      "name": "invalidPrice",
      "msg": "Price must be greater than zero"
    },
    {
      "code": 6010,
      "name": "saleNotActive",
      "msg": "Sale listing is not active"
    },
    {
      "code": 6011,
      "name": "cannotBuyOwnListing",
      "msg": "Cannot buy your own listing"
    },
    {
      "code": 6012,
      "name": "unauthorizedOwner",
      "msg": "Unauthorized owner account"
    },
    {
      "code": 6013,
      "name": "swapNotActive",
      "msg": "Swap offer is not active"
    },
    {
      "code": 6014,
      "name": "cannotSwapWithSelf",
      "msg": "Cannot swap with self"
    },
    {
      "code": 6015,
      "name": "invalidSwapMint",
      "msg": "Swap mint did not match required mint"
    }
  ],
  "types": [
    {
      "name": "offerState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "filled"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "rentalListing",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "dailyRentLamports",
            "type": "u64"
          },
          {
            "name": "collateralLamports",
            "type": "u64"
          },
          {
            "name": "minDurationDays",
            "type": "u32"
          },
          {
            "name": "maxDurationDays",
            "type": "u32"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "currentRenter",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "rentalEndTime",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "saleListing",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "priceLamports",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "swapOffer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maker",
            "type": "pubkey"
          },
          {
            "name": "makerMint",
            "type": "pubkey"
          },
          {
            "name": "takerMint",
            "type": "pubkey"
          },
          {
            "name": "makerSolDeltaLamports",
            "type": "u64"
          },
          {
            "name": "state",
            "type": {
              "defined": {
                "name": "offerState"
              }
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
