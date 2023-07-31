import * as path from 'path';
import * as fs from 'fs';

const __dirname = path.resolve();

export const getAbiByRelativePath = (relativePath) => {
  return JSON.parse(fs.readFileSync(path.join(__dirname, relativePath), 'utf-8'));
};
