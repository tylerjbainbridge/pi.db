import puppeteer from 'puppeteer';
import scrollPageToBottom from 'puppeteer-autoscroll-down';

import type { ParsedRec, ParsedGuest, ParsedFeature } from '../types';

const ARCHIVE_URL = 'https://www.perfectlyimperfect.fyi/archive?sort=new';

export async function parseRecs(
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

    parsedFeature.thumbnailSrc =
      (
        document.querySelectorAll(
          'head > meta[property="og:image"]'
        )[0] as HTMLMetaElement
      )?.content || null;

    let [bodyMarkup] = Array.from(document.querySelectorAll('.body'));

    const dateStr = (
      document.querySelectorAll('.post-date')[0] as HTMLElement
    )?.getAttribute('title');

    try {
      parsedFeature.date =
        dateStr != null ? new Date(dateStr)?.toISOString() : null;
    } catch (e) {
      parsedFeature.date = null;
    }

    const introNode = Array.from(document.querySelectorAll('p')).filter(
      (n) => n.parentElement === bodyMarkup
    )?.[1];

    parsedFeature.intro = introNode?.innerText?.split('\n')?.[0] || '';
    parsedFeature.introHTML = introNode?.innerHTML?.split('\n')?.[0] || '';

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

    // This is mostly useful for the boy posts, where there are multiple guests.
    for (let i = 0; i < banners.length; i++) {
      const EMPTY_REC = { title: '', content: '', emoji: '', url: '' };

      const guest: ParsedGuest = { name: '', recs: [] };

      // The whole parsing flow starts at the banner.
      const bannerContainer = banners[i];

      // Name container is directly after the banner.
      const nameContainer = bannerContainer?.nextElementSibling;

      guest.name = nameContainer?.innerText?.split('(')[0].trim();

      let iter = nameContainer.nextElementSibling;
      let currRec: ParsedRec = { ...EMPTY_REC };

      // Continue walking the nodes under the banner until we encounter
      // Something that isn't a <p> or <blockquote> (not relevant)
      while (iter != null && ['P', 'BLOCKQUOTE'].includes(iter.tagName)) {
        switch (iter.tagName) {
          // This is the title of the rec.
          case 'P': {
            const innerText = iter.innerText;
            currRec.title = innerText.split(':').pop().trim();
            currRec.date = parsedFeature.date;

            const emojis = innerText?.match(/\p{Extended_Pictographic}/gu);
            currRec.emoji = emojis?.join(' ');

            let stack = [iter];
            let node;

            while (stack.length > 0) {
              node = stack.pop();
              if (node.tagName === 'A') {
                currRec.url = node.getAttribute('href');
                // currRec.title = node.innerText?.trim();

                break;
              } else if (node.children?.length) {
                stack = [...stack, ...node.children];
              }
            }

            currRec.title = (emojis || [])
              .reduce(
                (t: string, emoji: string) => t.replace(emoji, ''),
                currRec.title
              )
              ?.trim();

            break;
          }

          // This is the actual content of the rec.
          case 'BLOCKQUOTE': {
            currRec.content = iter.innerText;
            currRec.contentHTML = iter?.innerHTML;
            guest.recs.push(currRec);

            // Clear current rec.
            currRec = { ...EMPTY_REC };
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

export async function getRecLinksFromArchive(
  browser: puppeteer.Browser
): Promise<(string | null)[]> {
  const page = await browser.newPage();

  await page.goto(ARCHIVE_URL);

  const scrollStep = 500;
  const scrollDelay = 200;

  // Ignore this type error
  // @ts-ignore
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
