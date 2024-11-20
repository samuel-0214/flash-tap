// app/api/submit/route.ts
import { NextRequest } from 'next/server';
import { ActionPostResponse, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions";
import { Transaction, Connection, PublicKey } from "@solana/web3.js";
import { GameDatabase } from '@/lib/database';
import { handleError, distributeRewards } from '@/lib/utils';
import { ACTION_URL, HELIUS_RPC_URL } from '@/constants';
import type { GameType } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const gameId = req.nextUrl.searchParams.get('gameId');
    const answer = body.answer;

    if (!gameId || !answer) {
      return new Response('Game ID and answer required', { status: 400 });
    }

    const db = GameDatabase.getInstance();
    const game = db.getGame(gameId);

    if (!game) {
      return new Response('Game not found', { status: 404 });
    }

    const playerIndex = game.players.findIndex(p => p.address === body.account);
    if (playerIndex === -1) {
      return new Response('Player not found', { status: 404 });
    }

    game.players[playerIndex].answer = answer;
    game.players[playerIndex].timeCompleted = Date.now();

    const allAnswered = game.players.every(p => p.answer);
    if (allAnswered) {
      const winner = game.players.find(p => p.answer === game.randomNumber);
      if (winner) {
        game.winner = winner.address;
        game.status = 'completed';
        game.prizePool = game.bidAmount * game.players.length;
        await distributeRewards(game);
      }
    }

    db.updateGame(gameId, game);

    // Create an empty transaction
    const connection = new Connection(HELIUS_RPC_URL);
    const transaction = new Transaction();
    
    // Set recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    
    // Set fee payer
    transaction.feePayer = new PublicKey(game.players[playerIndex].address);

    const response = await createPostResponse({
      fields: {
        type: "transaction",
        transaction,
        message: `Answer submitted successfully. ${allAnswered ? 'Game completed!' : 'Waiting for other players...'}`,
        links: allAnswered ? {
          next: {
            type: "post",
            href: `${ACTION_URL}/game`,
          }
        } : undefined
      }
    });

    return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
  } catch (error) {
    return handleError(error);
  }
}