export class Chain {
  name: string;
  chainId: number;
  rpc: string;
  explorer: string;
  token: string;

  constructor({
    name,
    chainId,
    rpc,
    explorer,
    token,
  }: {
    name: string;
    chainId: number;
    rpc: string;
    explorer: string;
    token: string;
  }) {
    this.name = name;
    this.chainId = chainId;
    this.rpc = rpc;
    this.explorer = explorer;
    this.token = token;
  }
}

export const ERA = new Chain({
  name: 'ERA',
  chainId: 324,
  rpc: 'https://rpc.ankr.com/zksync_era',
  explorer: 'https://explorer.zksync.io/tx',
  token: 'ETH',
});

export const ETH = new Chain({
  name: 'ETH',
  chainId: 1,
  rpc: 'https://rpc.ankr.com/eth/c838e2546976e80e04458e57c44b5bae4c29342eec0e2faf5c3febccc156ba83',
  explorer: 'https://etherscan.io/tx',
  token: 'ETH',
});
