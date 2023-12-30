import Web3 from 'web3';
import { invert } from 'lodash';
import { ActionType } from '../enums/action-type.enum';
import { SWAP_CONTRACT_ADDRESSES, SwapActionTypes } from './swap.const';

export type CheapDoableActions = SwapActionTypes | ActionType.Dmail;

export const singleActionTypeToContractMapper: Record<CheapDoableActions, string> = {
  ...SWAP_CONTRACT_ADDRESSES,
  [ActionType.Dmail]: Web3.utils.toChecksumAddress('0x981f198286e40f9979274e0876636e9144b8fb8e'),
};

export const contractToCheapActionTypeMapper = invert(singleActionTypeToContractMapper) as Record<
  string,
  CheapDoableActions
>;
export const allCheapContracts = Object.keys(contractToCheapActionTypeMapper);
