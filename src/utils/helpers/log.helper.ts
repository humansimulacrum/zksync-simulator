import fs from 'fs';
import path from 'path';

import { logFilePath } from '../const/config.const';
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
  const logMessage = `${protocolName}. ${message}`;
  log(logMessage);
};

export const sleepLogWrapper = async (millis: number, walletAddr: string, message: string) => {
  console.log('\r');
  const bar = new cliProgress.SingleBar(
    {
      format:
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
  const message = `${walletAddress} : ${executeOutput.protocolName} | ${executeOutput.message} | TX: ${executeOutput.chain.explorer}/${executeOutput.transactionHash}`;
  log(message);
};

// Function to convert array of objects to CSV
function toCSV(data: any[]) {
  const csvRows = [];
  // Get the headers (column names)
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(','));

  // Loop over the rows and turn each object into a CSV string
  for (const row of data) {
    const values = headers.map((header) => {
      const escaped = ('' + row[header]).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export function writeToCsvFile(data: any[], filename = 'export.csv') {
  // Write CSV to a file
  const csvData = toCSV(data);
  const outputDir = 'output';
  const filePath = path.join(outputDir, filename);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(filePath, csvData, 'utf8');

  logWithFormatting(`Activity Output`, `CSV file written to ${filePath}`);
}
