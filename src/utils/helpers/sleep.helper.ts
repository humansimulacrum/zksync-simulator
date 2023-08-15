import cliProgress from 'cli-progress';
import colors from 'ansi-colors';
import { moduleName } from '../const/config.const';

export const sleepUtil = async (millis) => new Promise((resolve) => setTimeout(resolve, millis));

export const sleep = async (millis, walletAddr, message) => {
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
    await sleepUtil(1000);
  }

  bar.stop();
};
