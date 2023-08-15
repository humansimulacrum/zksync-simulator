import { schedule } from 'node-cron';
import { main } from './main';
import { randomIntInRange } from '../utils/helpers';

function getRandomTime() {
  // Generate a random hour between 0 and 23
  const randomHour = Math.floor(Math.random() * 24);

  // Generate a random minute between 0 and 59
  const randomMinute = randomIntInRange(33, 38);
  return `${randomMinute} ${randomHour} * * *`; // minute hour * * *
}

// Create a CronJob that runs every day at a random time
const cronExpression = getRandomTime();
const job = schedule(cronExpression, main);

job.start();
