import { NextRequest } from 'next/server';
import { ActionPostResponse, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions";
import { Transaction, PublicKey, ComputeBudgetProgram, SystemProgram } from "@solana/web3.js";
import { GameDatabase } from '@/lib/database';
import { generateRandomNumber, handleError } from '@/lib/utils';
import { PRICE_PER_GAME, ACTION_URL, MEMO_PROGRAM_ID, TREASURY_ADDRESS } from '@/config';
import type { GameType } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const account = new PublicKey(body.account);
    
    const game: GameType = {
      id: generateRandomNumber(10),
      numPlayers: body.numPlayers || 2,
      bidAmount: PRICE_PER_GAME,
      players: [{
        address: account.toString(),
        hasPaid: false
      }],
      randomNumber: generateRandomNumber(6),
      status: 'waiting' as const, // explicitly type as 'waiting'
      createdAt: Date.now()
    };

    const db = GameDatabase.getInstance();
    db.createGame(game);

    const transaction = new Transaction();

    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 300_000 }),
      SystemProgram.transfer({
        fromPubkey: account,
        toPubkey: new PublicKey(TREASURY_ADDRESS),
        lamports: PRICE_PER_GAME,
      })
    );

    const response = await createPostResponse({
      fields: {
        type: "transaction", // Add this line
        transaction,
        message: "Create FlashTap Game",
        links: {
          next: {
            type: "post",
            href: `${ACTION_URL}/game?gameId=${game.id}`,
          }
        }
      }
    });

    return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
  } catch (error) {
    return handleError(error);
  }
}