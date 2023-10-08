export function isSameAddress(address1: string, address2: string) {
  return address1.toLowerCase() === address2.toLowerCase();
}

export function isSelfTransaction(fromAddress: string, toAddress: string, selfAddress: string) {
  return isSameAddress(fromAddress, selfAddress) && isSameAddress(toAddress, selfAddress);
}
