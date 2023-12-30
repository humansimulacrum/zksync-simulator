import * as path from 'path';
import * as fs from 'fs';

export const getAbiByRelativePath = (relativePath: string) => {
  return JSON.parse(fs.readFileSync(path.join(__dirname, relativePath), 'utf-8'));
};
