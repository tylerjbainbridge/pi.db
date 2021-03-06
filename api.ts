import * as Discord from 'discord.js';
import _ from 'lodash';
require('dotenv').config();
import express from 'express';
const app = express();
const port = 3000;
import prisma from './lib/prisma';

import next from 'next';
import { SYNC_STATUS, syncDB, getFailedURLs } from './scraper/sync-utils';
import { Feature, Guest, Rec } from '@prisma/client';

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

type ResultRec = Rec & {
  guest: Guest;
  feature: Feature;
};

const trigger = dev ? 'pitest' : 'pi';

console.log(process.env.NODE_ENV);

const client = new Discord.Client();
let recs: ResultRec[] = [];

client.on('ready', async () => {
  console.log('ready!!');
});

client.on('message', async (msg) => {
  const content = msg.content?.toLowerCase()?.trim();

  if (!content.startsWith(trigger)) {
    return;
  }

  if (
    msg.channel.id === process.env.ADMIN_DATA_CHANNEL_ID &&
    (content === `${trigger} sync` || content === `${trigger} sync retry`)
  ) {
    if (SYNC_STATUS === 'ACTIVE') {
      msg.reply('Sync already in progress.');
      return;
    }

    let logData;

    msg.reply('Starting sync...');

    if (content === `${trigger} sync retry`) {
      logData = await syncDB(false, await getFailedURLs());
    } else {
      logData = await syncDB();
    }

    try {
      msg.reply(
        `Synced ${logData.syncedUrlsCount} features in ${logData.seconds} seconds.`
      );

      msg.reply(JSON.stringify(logData, null, 5));
    } catch (e) {
      msg.reply('Something went wrong while syncing...');
    }

    recs = await prisma.rec.findMany({
      include: {
        guest: true,
        feature: true,
      },
    });

    msg.reply('Done.');

    return;
  }

  if (content.startsWith(`${trigger} rec`)) {
    const [query] = content
      .split(`${trigger} rec`)
      .map((n) => n.trim())
      .filter(Boolean);

    if (recs.length === 0) {
      recs = await prisma.rec.findMany({
        include: {
          guest: true,
          feature: true,
        },
      });
    }

    const filteredRecs =
      query && query.length > 0
        ? recs.filter((rec) => {
            return [rec.title, rec.content, rec.guest.name]
              .join('')
              .toLowerCase()
              .includes(query.toLowerCase());
          })
        : recs;

    const rec = _.sample(filteredRecs);

    console.log('responding with rec!', rec?.id);

    if (rec == null) {
      msg.reply('No recommendations found.');
    } else {
      const embed = new Discord.MessageEmbed()
        .setTitle([rec?.emoji, rec?.title].filter(Boolean).join(' '))
        // .setAuthor("Perfectly Imperfect", "https://cdn.substack.com/image/fetch/w_1360,c_limit,f_auto,q_auto:best,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2Fecbe78f0-ea9f-4221-8db1-6d10269a5c80_1000x1019.png")

        .setDescription(rec?.content);
      /*
       * Takes a Date object, defaults to current date.
       */

      if (rec?.feature.date != null) {
        embed.setTimestamp(new Date(rec?.feature.date));
      }

      embed
        .addFields({ name: "Rec'd by", value: rec?.guest?.name, inline: true })
        .addFields({
          name: 'Feature',
          value: rec?.feature?.url,
          inline: true,
        })
        .setURL(rec?.feature?.url);

      if (rec?.url != null) {
        embed.setURL(rec?.url);
      }

      if (rec != null) {
        msg.reply(embed);
      }
    }
  }
});

client.on('error', (e) => {
  console.log('something went wrong');
  console.log(e);
});

client.login(process.env.BOT_TOKEN);

(async () => {
  try {
    await nextApp.prepare().then(() => {
      app.get('/api/health-check', (_req, res) => {
        res.sendStatus(200);
      });

      app.get('/api/recs', async (_req, res) => {
        res.json({
          recs: await prisma.rec.findMany({
            orderBy: [
              {
                date: 'asc',
              },
            ],
            include: {
              guest: true,
              feature: true,
            },
          }),
        });
      });

      app.get('*', (req, res) => {
        return handle(req, res);
      });

      app.listen(port, () => {
        console.log(`API listening at http://localhost:${port}`);
      });
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
