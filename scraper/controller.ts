import { Command } from 'commander';
import { syncDB } from './sync-utils';
import { promises as fs } from 'fs';
import path from 'path';
import prisma from '../lib/prisma';

const program = new Command();

program
  .option('-u, --url <url>', 'url to sync')
  .option('-f, --failed', 'resync failed')
  .option('-a, --all', 'sync all posts')
  .option('-n, --new', 'sync new posts');

program.parse(process.argv);

const options = program.opts();

(async () => {
  if (options.all) {
    return await syncDB(false);
  } else if (options.new) {
    return await syncDB(true);
  } else if (options.url != null) {
    return await syncDB(false, [options.url]);
  } else if (options.failed) {
    return await syncDB(false, await getFailedURLs());
  }

  return await syncDB(true);
})();

async function getFailedURLs() {
  const logData = await prisma.scraperLog.findFirst();

  if (logData == null || logData.failedUrls.length === 0) {
    throw new Error('No failed URLs found.');
  }

  console.log(`${logData.failedUrls.length} Failed URL(s) found`);

  return logData.failedUrls;
}
