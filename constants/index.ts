// constants/index.ts
export const ACTION_URL = process.env.ACTION_URL || 'http://localhost:3000/api';
export const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
export const PRICE_PER_GAME = 10000000; // 0.01 SOL in lamports
export const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS!;
export const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';