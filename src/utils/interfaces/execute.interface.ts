import { Chain } from '../const/chains.const';

export interface ExecuteOutput {
  transactionHash: string;
  chain: Chain;
  protocolName: string;
  message: string;
}

export interface ModuleOutput {
  transactionHash: string;
  message: string;
}

export abstract class ExecutableModule {
  abstract execute(): Promise<ExecuteOutput>;
}
