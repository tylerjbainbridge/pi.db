import { GetStaticProps } from 'next';
import { Rec, Guest, Feature } from '@prisma/client';
import { Box, Heading, Text, Link } from '@chakra-ui/react';

import prisma from '../lib/prisma';
import React, { useEffect, useState } from 'react';

type ResultRec = Rec & {
  guest: Guest;
  feature: Feature;
};

interface Props {
  recs: ResultRec[];
}

// index.tsx
export const getStaticProps: GetStaticProps = async (): Promise<{
  props: Props;
}> => {
  const recs = await prisma.rec.findMany({
    where: {},
    include: { guest: true, feature: true },
  });

  return { props: { recs } };
};

export default function Random({ recs }: Props) {
  const [rec, setRec] = useState<ResultRec | null>(null);

  useEffect(() => {
    document.title = 'PI Random';
  }, []);

  useEffect(() => {
    setRec(recs[Math.floor(Math.random() * recs.length)]);
  }, []);

  const displayOptions = [
    {
      justifyContent: 'center',
      alignItems: 'center',
    },
    {
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    },
    {
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
    },
    {
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
    },
    {
      justifyContent: 'flex-end',
      alignItems: 'flex-start',
    },
  ];

  const randomOption =
    displayOptions[Math.floor(Math.random() * displayOptions.length)];

  return (
    rec != null && (
      <Box
        p="45px"
        display="flex"
        color="white"
        suppressHydrationWarning
        {...randomOption}
      >
        <Box p="30px" border="15px solid #FFFF00" width="700px">
          <Heading as="h4" size="lg">
            {rec.emoji}{' '}
            {rec.url != null ? (
              <Link isExternal href={rec.url}>
                {rec.title.trim()}
              </Link>
            ) : (
              rec.title.trim()
            )}
          </Heading>
          <br />
          <Box marginBottom="3px">
            <em>from</em>{' '}
            <Box
              as="a"
              href={rec.feature.url}
              fontWeight="bold"
              target="_blank"
            >
              {rec.feature.title}
            </Box>
          </Box>
          <br />
          {rec.contentHTML != null ? (
            <Text
              maxWidth="600px"
              dangerouslySetInnerHTML={{ __html: rec.contentHTML }}
              size="md"
            />
          ) : (
            <Text maxWidth="600px" size="md">
              {rec.content}
            </Text>
          )}
        </Box>
      </Box>
    )
  );
}
