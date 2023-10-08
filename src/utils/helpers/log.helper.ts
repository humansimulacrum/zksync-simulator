import fs from 'fs';
import { moduleName, logFilePath } from '../const/config.const';
import cliProgress from 'cli-progress';
import colors from 'ansi-colors';
import { sleep } from '.';
import { ExecuteOutput } from '../interfaces/execute.interface';

export const log = (message: string) => {
  // Print the log message to the console
  console.log(message);

  // Append the log message to the log file
  fs.appendFile(logFilePath, message + '\n', (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
};

export const logWithFormatting = (protocolName: string, message: string) => {
  const logMessage = `${moduleName} | ${protocolName}. ${message}`;
  log(logMessage);
};

export const sleepLogWrapper = async (millis: number, walletAddr: string, message: string) => {
  console.log('\r');
  const bar = new cliProgress.SingleBar(
    {
      format:
        moduleName +
        '. ' +
        walletAddr +
        ': ' +
        colors.cyan('{bar}') +
        '  {percentage}% | Sleeping for {value}/{total} seconds' +
        ` ${message} `,
      hideCursor: true,
    },
    cliProgress.Presets.shades_grey
  );
  bar.start(millis / 1000, 0);

  const iters = millis / 1000;

  for (let i = 0; i < iters; i++) {
    bar.increment(1);
    await sleep(1000);
  }

  bar.stop();
};

export const logSuccessfullAction = (executeOutput: ExecuteOutput, walletAddress: string) => {
  const message = `${moduleName} | ${walletAddress} : ${executeOutput.protocolName} | ${executeOutput.message} | TX: ${executeOutput.chain.explorer}/${executeOutput.transactionHash}`;
  log(message);
};
