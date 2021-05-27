import puppeteer from 'puppeteer';

import { deleteAll, persistFeature } from './persist';
import type { ParsedFeature } from './types';
import { getRecLinksFromArchive, parseRecs } from './scrape';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const browser = await puppeteer.launch();

  console.log('clearing DB');

  await deleteAll();

  console.log('Searching for posts...');

  const urls = await getRecLinksFromArchive(browser);

  console.log(`Found ${urls.length} posts.`);

  const retried = new Set();
  const failedUrls: string[] = [];
  const skippedUrls: string[] = [];

  const retry = async (url: string) => {
    if (!retried.has(url)) {
      console.log(`Retrying "${url}" in 10 seconds...`);
      retried.add(url);
      urls.unshift(url);
      // Probably throttled or something idk.
      await sleep(10000);
    } else {
      failedUrls.push(url);
    }
  };

  while (urls.length > 0) {
    const url = urls.shift();

    if (url == null) continue;

    try {
      console.log(`Parsing: "${url}"`);
      const parsedFeature: ParsedFeature = await parseRecs(browser, url);
      console.log(`Parsed feature: "${parsedFeature.title}"`);

      if (!parsedFeature?.title) {
        console.log('No title...what the heck');
        await retry(url);
        continue;
      }

      if (
        !parsedFeature?.title?.startsWith('#') ||
        parsedFeature?.title?.startsWith('#1: ')
      ) {
        console.log('Nothing to save here...');
        skippedUrls.push(url);
        continue;
      }

      console.log(`Saving feature: "${parsedFeature.title}"`);
      const feature = await persistFeature(parsedFeature);
      console.log(`Saved feature: "${feature.id}"`);
    } catch (e) {
      console.log(e);

      await retry(url);
    }

    await sleep(1000);
  }

  console.log({ failedUrls, skippedUrls });

  await browser.close();

  process.exit();
}

const test = async () => {
  const browser = await puppeteer.launch();

  console.log('test');

  const parsed = await parseRecs(
    browser,
    'https://www.perfectlyimperfect.fyi/p/77-kathleen-sorbara-chickees-vintage'
  );

  console.log(JSON.stringify(parsed, null, 2));
};

// test();
run();
