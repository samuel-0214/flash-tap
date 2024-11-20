import { NextRequest } from 'next/server';
import { 
  ActionGetResponse, 
  ActionPostResponse, 
  ACTIONS_CORS_HEADERS, 
  createPostResponse,
  MEMO_PROGRAM_ID 
} from "@solana/actions";
import { 
  Transaction, 
  PublicKey, 
  ComputeBudgetProgram, 
  SystemProgram,
  TransactionInstruction 
} from "@solana/web3.js";
import { GameDatabase } from '@/lib/database';
import { generateRandomNumber } from '@/lib/utils';
import { PRICE_PER_GAME, ACTION_URL, TREASURY_ADDRESS } from '@/constants';
import type { GameType } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const gameId = req.nextUrl.searchParams.get('gameId');
    const db = GameDatabase.getInstance();

    if (!gameId) {
      const payload: ActionGetResponse = {
        type: "action",
        icon: "../../../public/flash-tap logo.pn",
        title: "FlashTap Game",
        label: "Start New Game",
        description: `Create a new FlashTap game\nBid Amount: ${PRICE_PER_GAME / 1e9} SOL`,
      };

      return Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS
      });
    }

    const game = db.getGame(gameId);
    if (!game) {
      return new Response('Game not found', { status: 404 });
    }

    const payload: ActionGetResponse = {
      type: "action",
      icon: "https://your-icon-url.com/flashtap.png",
      title: `FlashTap Game #${gameId}`,
      label: game.status === 'waiting' ? 'Join Game' : 'Play Game',
      description: `Bid Amount: ${game.bidAmount / 1e9} SOL\nPlayers: ${game.players.length}/${game.numPlayers}`
    };

    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const account = new PublicKey(body.account);
    const gameId = req.nextUrl.searchParams.get('gameId');
    const db = GameDatabase.getInstance();

    // Create new game
    if (!gameId) {
      const newGame: GameType = {
        id: generateRandomNumber(10),
        numPlayers: 2,
        bidAmount: PRICE_PER_GAME,
        players: [{
          address: account.toString(),
          hasPaid: false
        }],
        randomNumber: generateRandomNumber(6),
        status: 'waiting',
        createdAt: Date.now()
      };

      db.createGame(newGame);

      const transaction = new Transaction();

      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 400_000
        }),
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: 300_000
        })
      );

      transaction.add(
        new TransactionInstruction({
          programId: new PublicKey(MEMO_PROGRAM_ID),
          data: Buffer.from(`flashtap_create_${newGame.id}`, "utf-8"),
          keys: []
        })
      );

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: account,
          toPubkey: new PublicKey(TREASURY_ADDRESS),
          lamports: PRICE_PER_GAME,
        })
      );

      const response = await createPostResponse({
        fields: {
          type: "transaction",
          transaction,
          message: "Creating new FlashTap game",
          links: {
            next: {
              type: "post",
              href: `${ACTION_URL}/game?gameId=${newGame.id}`,
            }
          }
        }
      });

      return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
    }

    // Handle existing game
    const game = db.getGame(gameId);
    if (!game) {
      return new Response('Game not found', { status: 404 });
    }

    if (game.players.length >= game.numPlayers) {
      return new Response('Game is full', { status: 400 });
    }

    const transaction = new Transaction();

    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 400_000
      }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 300_000
      }),
      new TransactionInstruction({
        programId: new PublicKey(MEMO_PROGRAM_ID),
        data: Buffer.from(`flashtap_join_${gameId}`, "utf-8"),
        keys: []
      }),
      SystemProgram.transfer({
        fromPubkey: account,
        toPubkey: new PublicKey(TREASURY_ADDRESS),
        lamports: game.bidAmount,
      })
    );

    const response = await createPostResponse({
      fields: {
        type: "transaction",
        transaction,
        message: "Joining FlashTap game",
        links: {
          next: {
            type: "post",
            href: `${ACTION_URL}/submit?gameId=${gameId}`,
          }
        }
      }
    });

    return Response.json(response, { headers: ACTIONS_CORS_HEADERS });

  } catch (error) {
    console.error('Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}