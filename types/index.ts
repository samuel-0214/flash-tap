// types.ts
export interface Player {
  address: string;
  hasPaid: boolean;
  answer?: string;
  timeStarted?: number;
  timeCompleted?: number;
}

export interface GameType {
  id: string;
  numPlayers: number;
  bidAmount: number;
  players: Player[];  // Changed from inline type to Player interface
  randomNumber: string;
  status: 'waiting' | 'active' | 'completed';
  createdAt: number;
  winner?: string;
  prizePool?: number;
}