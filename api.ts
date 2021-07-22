import { PrismaClient, Rec } from '@prisma/client';
import Discord from 'discord.js';
import _ from 'lodash';
require('dotenv').config();

import { recs } from './recs.json';

const client = new Discord.Client();

client.on('ready', async () => {
  console.log('ready!');
});

client.on('message', (msg) => {
  //console.log(msg.author.id);

  if (
    msg.author.id === process.env.TYLER_USER_ID &&
    msg.content === 'pi sync'
  ) {
  }

  if (msg.content === 'pi rec') {
    console.log('responding with rec!');

    const rec = _.sample(recs);

    const embed = new Discord.MessageEmbed()
      .setTitle([rec?.emoji, rec?.title].filter(Boolean).join(' '))
      // .setAuthor("Perfectly Imperfect", "https://cdn.substack.com/image/fetch/w_1360,c_limit,f_auto,q_auto:best,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2Fecbe78f0-ea9f-4221-8db1-6d10269a5c80_1000x1019.png")

      .setDescription(rec?.content)
      /*
       * Takes a Date object, defaults to current date.
       */
      .setTimestamp(new Date(rec?.feature.date))
      .addFields({ name: "Rec'd by", value: rec?.guest?.name, inline: true })
      .addFields({
        name: 'Feature URL',
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
});

client.on('error', (e) => {
  console.log('something went wrong');
  console.log(e);
});

client.login(process.env.BOT_TOKEN);
