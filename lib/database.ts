import type { GameType } from '@/types';

export class GameDatabase {
  private static instance: GameDatabase;
  private games: Map<string, GameType>;

  private constructor() {
    this.games = new Map();
  }

  public static getInstance(): GameDatabase {
    if (!GameDatabase.instance) {
      GameDatabase.instance = new GameDatabase();
    }
    return GameDatabase.instance;
  }

  public createGame(game: GameType): void {
    this.games.set(game.id, game);
  }

  public getGame(id: string): GameType | undefined {
    return this.games.get(id);
  }

  public updateGame(id: string, game: GameType): void {
    this.games.set(id, game);
  }
}