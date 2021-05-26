import puppeteer from 'puppeteer';
import fs from 'fs';
import scrollPageToBottom from 'puppeteer-autoscroll-down';

import { deleteAll, persistFeature } from './persist';
import type { ParsedRec, ParsedGuest, ParsedFeature } from './types';

const ARCHIVE_URL = 'https://www.perfectlyimperfect.fyi/archive?sort=new';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function parseRecs(
  browser: puppeteer.Browser,
  url: string
): Promise<ParsedFeature> {
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'load' });

  page.on('pageerror', (err) => {
    let str = err.toString();
    console.log(`Error parsing ${url}:`, str);
  });

  page.on('error', (err) => {
    let str = err.toString();
    console.log(`Error parsing ${url}:`, str);
  });

  page.on('console', (msg) => {
    // console.log(`Message ${url}:`);
    // for (let i = 0; i < msg.args().length; i++) {
    //   console.log(msg.args()[i]);
    // }
  });

  const f = await page.evaluate(() => {
    const parsedFeature: ParsedFeature = {
      title: '',
      url: '',
      intro: '',
      guests: [],
    };

    parsedFeature.title = (
      document.querySelectorAll('h1.post-title')[0] as HTMLElement
    )?.innerText;

    console.log(parsedFeature);

    let [bodyMarkup] = Array.from(document.querySelectorAll('.body'));

    parsedFeature.date = new Date(
      (document.querySelectorAll('.post-date')[0] as HTMLElement).innerText
    );

    parsedFeature.intro = (() => {
      return (
        Array.from(document.querySelectorAll('p'))
          .filter((n) => {
            console.log(n.parentElement, bodyMarkup);
            return n.parentElement === bodyMarkup;
          })[1]
          ?.innerText?.split('\n')?.[0] || ''
      );
    })();

    const banners = Array.from(
      document.querySelectorAll('a.image-link')
    ).reduce((acc: any[], n) => {
      const width = Number(n?.className.split('-').pop());

      if (width > 500) {
        let topLevelNode = [n.parentElement, n?.parentElement].includes(
          bodyMarkup as HTMLElement
        )
          ? n
          : n.parentElement?.parentElement;

        return [...acc, topLevelNode];
      }

      return acc;
    }, []);

    for (let i = 0; i < banners.length; i++) {
      const guest: ParsedGuest = { name: '', recs: [] };

      const bannerContainer = banners[i];

      const nameContainer = bannerContainer?.nextElementSibling;

      guest.name = nameContainer?.innerText?.split('(')[0].trim();

      let iter = nameContainer.nextElementSibling;
      let currRec: ParsedRec = { title: '', content: '', emoji: '', url: '' };

      while (iter != null && ['P', 'BLOCKQUOTE'].includes(iter.tagName)) {
        switch (iter.tagName) {
          case 'P': {
            const innerText = iter.innerText;
            currRec.title = innerText.trim();
            currRec.emoji = innerText?.match(/\p{Extended_Pictographic}/u)?.[0];

            let stack = [iter];
            let node;

            while (stack.length > 0) {
              node = stack.pop();
              if (node.tagName === 'A') {
                currRec.url = node.getAttribute('href');
                currRec.title = node.innerText?.trim();
                currRec.emoji = innerText?.match(
                  /\p{Extended_Pictographic}/u
                )?.[0];

                break;
              } else if (node.children?.length) {
                stack = [...stack, ...node.children];
              }
            }

            break;
          }

          case 'BLOCKQUOTE': {
            currRec.content = iter.innerText;
            guest.recs.push(currRec);
            currRec = { title: '', content: '', url: '', emoji: '' };
            break;
          }
        }

        iter = iter.nextElementSibling;
      }

      if (guest.recs.length > 0) {
        parsedFeature.guests.push(guest);
      }
    }

    return parsedFeature;
  });

  await page.close();

  f.url = url;

  return f;
}

async function getRecLinksFromArchive(
  browser: puppeteer.Browser
): Promise<(string | null)[]> {
  const page = await browser.newPage();

  await page.goto(ARCHIVE_URL);

  const scrollStep = 500;
  const scrollDelay = 200;

  // Ignore this type error
  await scrollPageToBottom(page, scrollStep, scrollDelay);

  const urls = (
    await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a.post-preview-title')).map(
        (node) => node.getAttribute('href')
      );
    })
  ).filter(Boolean);

  await page.close();

  return urls;
}

async function run() {
  const browser = await puppeteer.launch();

  console.log('clearing DB');

  await deleteAll();

  console.log('Searching for posts...');

  const urls = await getRecLinksFromArchive(browser);

  console.log(`Found ${urls.length} posts.`);

  let i = 0;

  const retried = new Set();
  const failedUrls = [];

  const retry = async (url: string) => {
    console.log(`Retrying "${url}" in 10 seconds...`);
    retried.add(url);
    urls.unshift(url);
    // Probably throttled or something idk.
    await sleep(10000);
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
        failedUrls.push(url);
        continue;
      }

      console.log(`Saving feature: "${parsedFeature.title}"`);
      const feature = await persistFeature(parsedFeature);
      console.log(`Saved feature: "${feature.id}"`);
    } catch (e) {
      console.log(e);

      if (!retried.has(url)) {
        await retry(url);
      } else {
        failedUrls.push(url);
      }
    }

    await sleep(1000);
  }

  console.log({ failedUrls });

  await browser.close();

  process.exit();
}

const test = async () => {
  const browser = await puppeteer.launch();

  console.log('test');

  const parsed = await parseRecs(
    browser,
    'https://www.perfectlyimperfect.fyi/p/1-japanese-hip-hop-cowboy-hats-and'
  );

  console.log({ parsed: JSON.stringify(parsed, null, 2) });
};

// test();
run();
