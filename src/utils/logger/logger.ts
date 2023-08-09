import fs from 'fs';
import { moduleName, logFilePath } from '../const/config.const';

export const log = (protocolName, message) => {
  const logMessage = `${moduleName} - ${protocolName}. ${message}`;

  // Print the log message to the console
  console.log(logMessage);

  // Append the log message to the log file
  fs.appendFile(logFilePath, logMessage + '\n', (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
};
