import Web3 from 'web3';

export const zkSyncEraTokenCodeToContractMapper = {
  ETH: Web3.utils.toChecksumAddress('0x000000000000000000000000000000000000800A'),
  WETH: Web3.utils.toChecksumAddress('0x5aea5775959fbc2557cc8789bc1bf90a239d9a91'),
  USDC: Web3.utils.toChecksumAddress('0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4'),
  MUTE: Web3.utils.toChecksumAddress('0x0e97C7a0F8B2C9885C8ac9fC6136e829CbC21d42'),
  WBTC: Web3.utils.toChecksumAddress('0xBBeB516fb02a01611cBBE0453Fe3c580D7281011'),
};
