import { Feature, Guest, Rec, PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import type { ParsedRec, ParsedGuest, ParsedFeature } from '../types';

const prisma = new PrismaClient();

export const deleteAll = async () => {
  await prisma.feature.deleteMany({});
  await prisma.guest.deleteMany({});
  await prisma.rec.deleteMany({});
};

export const saveRecs = async (
  guest: Guest,
  feature: Feature,
  parsedRecs: ParsedRec[]
) => {
  let recs = [];

  for (const parsedRec of parsedRecs) {
    let rec = await prisma.rec.findFirst({
      where: {
        content: parsedRec.content,
        feature: {
          id: feature.id,
        },
        guest: {
          id: guest.id,
        },
      },
    });

    if (rec == null) {
      rec = await prisma.rec.create({
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
      });
    } else {
      rec = await prisma.rec.update({
        where: {
          id: rec.id,
        },
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
      });
    }

    recs.push(rec);
  }

  return recs;
};

export const saveGuest = async (feature: Feature, { name }: ParsedGuest) => {
  let guest = await prisma.guest.findFirst({ where: { name } });

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
    guest = await prisma.guest.update({
      where: {
        id: guest.id,
      },
      data: {
        name: name || guest.name,
        features: {
          connect: { id: feature.id },
        },
      },
    });
  }

  return guest;
};

export const saveFeature = async ({
  title,
  url,
  intro,
  introHTML,
  date,
  thumbnailSrc,
  guests: parsedGuests,
}: ParsedFeature) => {
  let feature = await prisma.feature.findFirst({ where: { url } });

  if (!feature) {
    feature = await prisma.feature.create({
      data: {
        url,
        title,
        intro,
        introHTML,
        date,
        thumbnailSrc,
      },
    });
  } else {
    feature = await prisma.feature.update({
      where: {
        id: feature.id,
      },
      data: {
        url: url || feature.url,
        title: title || feature.title,
        intro: intro || feature.intro,
        introHTML: introHTML || feature.introHTML,
        date: date || feature.date,
        thumbnailSrc: thumbnailSrc || feature.thumbnailSrc,
      },
    });
  }

  for (const parsedGuest of parsedGuests) {
    const guest = await saveGuest(feature, parsedGuest);

    await saveRecs(guest, feature, parsedGuest.recs);
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

  await fs.writeFile(path.join('__dirname', '../recs.json'), recJSONStr);

  console.log('Done saving to JSON...');
};
