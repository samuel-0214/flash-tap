import { Connection } from "@solana/web3.js";
import { GameType } from '@/types';
import { HELIUS_RPC_URL } from '@/constants';

export function generateRandomNumber(length: number): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

export function handleError(error: any): Response {
  console.error('Error:', error);
  return new Response('Internal server error', { 
    status: 500,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export async function distributeRewards(game: GameType): Promise<void> {
  if (!game.winner || !game.prizePool) return;

  const connection = new Connection(HELIUS_RPC_URL);
  // Implement reward distribution logic here
}