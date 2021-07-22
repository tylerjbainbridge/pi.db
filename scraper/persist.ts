import { Feature, Guest, PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import type { ParsedRec, ParsedGuest, ParsedFeature } from '../types';

const prisma = new PrismaClient();

const SHOULD_REPLACE = false;

export const deleteAll = async () => {
  await prisma.feature.deleteMany({});
  await prisma.guest.deleteMany({});
  await prisma.rec.deleteMany({});
};

export const persistRecs = async (
  guest: Guest,
  feature: Feature,
  parsedRecs: ParsedRec[]
) => {
  let recs = [];

  for (const parsedRec of parsedRecs) {
    recs.push(
      await prisma.rec.create({
        data: {
          ...parsedRec,
          guest: {
            connect: {
              id: guest.id,
            },
          },
          feature: {
            connect: {
              id: feature.id,
            },
          },
        },
      })
    );
  }

  return recs;
};

export const persistGuest = async (feature: Feature, { name }: ParsedGuest) => {
  let [guest] = await prisma.guest.findMany({ where: { name } });

  if (guest == null) {
    return await prisma.guest.create({
      data: {
        name,
        features: {
          connect: { id: feature.id },
        },
      },
    });
  } else {
    await prisma.guest.update({
      where: {
        id: guest.id,
      },
      data: {
        features: {
          connect: { id: feature.id },
        },
      },
    });
  }

  return guest;
};

export const persistFeature = async ({
  title,
  url,
  intro,
  introHTML,
  guests: parsedGuests,
}: ParsedFeature) => {
  let [feature] = await prisma.feature.findMany({ where: { url } });

  if (!feature) {
    feature = await prisma.feature.create({
      data: {
        url,
        title,
        intro,
        introHTML,
      },
    });
  }

  for (const parsedGuest of parsedGuests) {
    const guest = await persistGuest(feature, parsedGuest);

    await persistRecs(guest, feature, parsedGuest.recs);
  }

  return feature;
};

export const saveToJson = async () => {
  console.log('Saving to JSON...');

  const recJSONStr = JSON.stringify(
    {
      recs: await prisma.rec.findMany({
        include: {
          guest: true,
          feature: true,
        },
      }),
    },
    null,
    4
  );

  fs.writeFileSync(path.join('__dirname', '../recs.json'), recJSONStr);
};
