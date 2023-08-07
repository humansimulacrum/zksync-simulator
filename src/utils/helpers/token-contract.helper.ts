import { ERA } from '../const/chains.const';
import { zkSyncEraTokenCodeToContractMapper } from '../const/token-contacts/era.contracts';

const chainNameToTokenMapMapper = {
  [ERA.name]: zkSyncEraTokenCodeToContractMapper,
};

export function getTokenContractsFromCode(tokenCodes, chainName, web3) {
  const map = chainNameToTokenMapMapper[chainName];

  const tokenContracts = tokenCodes.map((code) => {
    let contractAddress;

    if (code === 'ETH') {
      contractAddress = map['WETH'];
    } else {
      contractAddress = map[code];
    }

    const isContract = web3.utils.isAddress(contractAddress);

    if (!isContract) {
      throw new Error('Invalid token code');
    }

    return contractAddress;
  });

  return tokenContracts;
}
