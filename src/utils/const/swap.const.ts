import Web3 from 'web3';
import { TokenSymbol } from '../types';
import { ActionType } from '../enums/action-type.enum';

export type SwapActionTypes = ActionType.Mute | ActionType.SpaceFi | ActionType.SyncSwap | ActionType.Velocore;
// | ActionType.PancakeSwap;

export const SWAP_CONTRACT_ADDRESSES: Record<SwapActionTypes, string> = {
  [ActionType.Mute]: Web3.utils.toChecksumAddress('0x8B791913eB07C32779a16750e3868aA8495F5964'),
  [ActionType.SpaceFi]: Web3.utils.toChecksumAddress('0xbE7D1FD1f6748bbDefC4fbaCafBb11C6Fc506d1d'),
  [ActionType.SyncSwap]: Web3.utils.toChecksumAddress('0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295'),
  [ActionType.Velocore]: Web3.utils.toChecksumAddress('0xd999e16e68476bc749a28fc14a0c3b6d7073f50c'),
  // [ActionType.PancakeSwap]: Web3.utils.toChecksumAddress('0xf8b59f3c3Ab33200ec80a8A58b2aA5F5D2a8944C'),
};

export const SWAP_SUPPORTED_COINS: Record<string, TokenSymbol[]> = {
  [ActionType.Mute]: ['ETH', 'USDC', 'WBTC'],
  [ActionType.SpaceFi]: ['ETH', 'USDC', 'WBTC'],
  [ActionType.SyncSwap]: ['ETH', 'USDC', 'WBTC'],
  [ActionType.Velocore]: ['ETH', 'USDC', 'WBTC'],
  // [ActionType.PancakeSwap]: ['ETH', 'USDC', 'WBTC'],
};
