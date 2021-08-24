import { GetStaticProps } from 'next';
import { Rec, Guest, Feature } from '@prisma/client';
import { Box, Heading, Text, Link } from '@chakra-ui/react';

import prisma from '../lib/prisma';
import React, { useEffect, useState } from 'react';

interface Props {
  recs: (Rec & {
    guest: Guest;
    feature: Feature;
  })[];
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

export default function Recs({ recs }: Props) {
  const [rec, setRec] = useState<Rec | null>(null);

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
        width="100vw"
        height="100vh"
        display="flex"
        bg="#0000ff"
        color="white"
        fontFamily="Times New Roman"
        suppressHydrationWarning
        {...randomOption}
      >
        <Box p="30px" border="15px solid #FFFF00" width="700px">
          <Heading as="h2" size="xl" fontFamily="Times New Roman">
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
          <Heading as="h4" size="md" fontFamily="Times New Roman">
            By {rec?.guest?.name || ''}
          </Heading>
          <br />
          {rec.contentHTML != null ? (
            <Text
              maxWidth="600px"
              dangerouslySetInnerHTML={{ __html: rec.contentHTML }}
              fontWeight="bold"
              size="lg"
            />
          ) : (
            <Text maxWidth="600px" size="lg" fontWeight="bold">
              {rec.content}
            </Text>
          )}
        </Box>
      </Box>
    )
  );
}
