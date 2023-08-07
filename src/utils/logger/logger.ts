import { moduleName } from '../const/config.const';

export const log = (protocolName: string, message: string) => {
  console.log(`${moduleName} - ${protocolName}. ${message}`);
};
