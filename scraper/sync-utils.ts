import { launch } from 'puppeteer';
import { saveFeature, saveToJson } from './persist-utils';
import type { ParsedFeature } from '../types';
import {
  getFeatureLinksFromArchive,
  getDataFromFeatureLinks,
} from './scrape-utils';
import prisma from '../lib/prisma';
import { URL_BLACKLIST_SET } from './constants';
import { promises as fs } from 'fs';
import path from 'path';

export let SYNC_STATUS = 'INACTIVE';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function syncDB(
  shouldOnlySyncNew: boolean = true,
  urlsToSync?: string[]
): Promise<[seconds: number, syncedFeatures: number]> {
  SYNC_STATUS = 'ACTIVE';

  const startTime = new Date();

  const browser = await launch();

  console.log('Searching for posts...');

  let urls = urlsToSync || (await getFeatureLinksFromArchive(browser));

  if (shouldOnlySyncNew) {
    const lastFeatureToSync = await prisma.feature.findFirst({
      orderBy: [
        {
          date: 'desc',
        },
      ],
    });

    const lastUrlIndex = urls.findIndex(
      (url) => url === lastFeatureToSync?.url
    );
    urls = urls.splice(0, lastUrlIndex);
  }

  console.log(`Syncing ${urls.length} posts.`);

  await sleep(2000);

  const retried = new Set();
  const failedUrls: string[] = [];
  const skippedUrls: string[] = [];
  const syncedUrls: string[] = [];

  let syncedUrlsCount = 0;

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

    if (url == null || URL_BLACKLIST_SET.has(url)) continue;

    try {
      console.log(`Parsing: "${url}"`);
      const parsedFeature: ParsedFeature = await getDataFromFeatureLinks(
        browser,
        url
      );
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

      if (shouldOnlySyncNew) {
        const existingFeature = await prisma.feature.findUnique({
          where: { url: parsedFeature.url },
        });

        if (existingFeature != null) {
          console.log('Up to date...returning early.');
          break;
        }
      }

      console.log(`Saving feature: "${parsedFeature.title}"`);
      const feature = await saveFeature(parsedFeature);
      console.log(`Saved feature: "${feature.id}"`);
      syncedUrlsCount++;
      syncedUrls.push(url);
    } catch (e) {
      console.log(e);

      await retry(url);
    }

    await sleep(5000);
  }

  await saveToJson();

  await browser.close();

  const endTime = new Date();

  const seconds = Math.round((Number(endTime) - Number(startTime)) / 1000);

  console.log(`Completed in ${seconds} seconds.`);

  SYNC_STATUS = 'INACTIVE';

  const logData = {
    timestamp: new Date(),
    seconds,
    failedUrls,
    skippedUrls,
    syncedUrlsCount,
    syncedUrls,
  };

  console.log(JSON.stringify(logData, null, 4));

  await fs.writeFile(
    path.join('__dirname', '../scraper-log.json'),
    JSON.stringify(logData, null, 4)
  );

  await prisma.scraperLog.create({
    data: {
      seconds,
      failedUrls,
      skippedUrls,
      syncedUrlsCount,
      syncedUrls,
    },
  });

  return [seconds, syncedUrlsCount];
}
