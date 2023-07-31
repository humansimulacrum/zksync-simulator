import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as stream from 'stream';
import { once } from 'events';

const __dirname = path.resolve();

export const importProxies = async () => {
  const proxies = [];

  const instream = fs.createReadStream(path.join(__dirname, `./proxies.txt`));
  const outstream = new stream.Stream();

  const rl = readline.createInterface(instream, outstream);

  rl.on('line', (line) => {
    proxies.push(line);
  });

  await once(rl, 'close');

  return proxies;
};

const parseProxy = (proxyString) => {
  const [username, password, host, port] = proxyString.split(':');

  return {
    protocol: 'http',
    host,
    port,
    auth: {
      username,
      password,
    },
  };
};
