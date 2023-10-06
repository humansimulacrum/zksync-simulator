import Web3 from 'web3';
import { TokenSymbol } from '../types';

export const SWAP_CONTRACT_ADDRESSES: Record<string, string> = {
  Mute: Web3.utils.toChecksumAddress('0x8B791913eB07C32779a16750e3868aA8495F5964'),
  SpaceFi: Web3.utils.toChecksumAddress('0xbE7D1FD1f6748bbDefC4fbaCafBb11C6Fc506d1d'),
  SyncSwap: Web3.utils.toChecksumAddress('0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295'),
  Velocore: Web3.utils.toChecksumAddress('0xd999e16e68476bc749a28fc14a0c3b6d7073f50c'),
};

export const SWAP_SUPPORTED_COINS: Record<string, TokenSymbol[]> = {
  Mute: ['ETH', 'USDC', 'WBTC'],
  SpaceFi: ['ETH', 'USDC', 'WBTC'],
  SyncSwap: ['ETH', 'USDC', 'WBTC'],
  Velocore: ['ETH', 'USDC', 'WBTC'],
};
