import { GetStaticProps } from 'next';
import { Rec, Guest, Feature } from '@prisma/client';
import {
  Box,
  Heading,
  Text,
  Link,
  InputGroup,
  InputLeftElement,
  Image,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import prisma from '../lib/prisma';
import React, { useCallback, useEffect, useState } from 'react';
import { Input } from '@chakra-ui/react';
import _ from 'lodash';

type ResultRec = Rec & {
  guest: Guest;
  feature: Feature;
};

interface Props {
  recs: ResultRec[];
}

// import Image from 'next/image';

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

const searchableRecs: [string, string][] = [];
const recMap = new Map<string, ResultRec>();

function buildSearchables(recs: ResultRec[]) {
  const sortedRecs = recs.sort(
    // @ts-ignore
    (a, b) => (b?.feature?.date || 0) - (a?.feature?.date || 0)
  );

  for (let i = 0; i < sortedRecs.length; i++) {
    const rec = sortedRecs[i];
    recMap.set(rec.id, rec);

    const slug = [rec.title, rec.content, rec.guest.name]
      .map((s) => s.toLowerCase())
      .join('');

    searchableRecs.push([slug, rec.id]);
  }
}

export default function Search({ recs }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    buildSearchables(recs);
  }, []);

  const filterRecs = useCallback(() => {
    if (searchQuery.length === 0) {
      return [];
    }

    const searchQueryLower = searchQuery.toLowerCase();

    return searchableRecs
      .filter(([slug]) => slug.includes(searchQueryLower))
      .map(([_slug, recId]) => {
        const rec = recMap.get(recId);
        if (rec == null) throw new Error();
        return rec;
      });
  }, [searchQuery]);

  return (
    <Box p="45px" color="white" suppressHydrationWarning>
      <Box display="flex" justifyContent="center" marginTop="50px">
        <Box width="500px">
          <InputGroup>
            <InputLeftElement
              pointerEvents="none"
              children={<SearchIcon color="gray.300" />}
            />
            <Input
              placeholder="Search recommendations..."
              borderColor="#FF0"
              borderWidth="5px"
              focusBorderColor="#FF0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Box>
      </Box>
      <Box display="flex" justifyContent="center" marginTop="50px">
        <Box width="700px">
          {_.slice(filterRecs(), 0, 10).map((rec) => (
            <Box display="flex" key={rec.id} marginBottom="30px">
              <Box marginEnd="15px">
                {rec.feature.thumbnailSrc ? (
                  <Image
                    src={rec.feature.thumbnailSrc}
                    href={rec.feature.url}
                    width="100px"
                    height="100px"
                    border="5px solid #ff0"
                  ></Image>
                ) : (
                  <Box
                    width="100px"
                    height="100px"
                    border="5px solid #ff0"
                  ></Box>
                )}
              </Box>
              <Box>
                <Box fontWeight="bold" marginBottom="5px">
                  {rec.emoji} {rec.title}
                </Box>
                <Box marginBottom="5px">
                  <em>from</em>{' '}
                  <Box
                    as="a"
                    href={rec.feature.url}
                    color="#FF0"
                    fontWeight="bold"
                    target="_blank"
                  >
                    {rec.feature.title}
                  </Box>
                </Box>
                <Box marginBottom="5px">
                  {rec.contentHTML != null ? (
                    <Text
                      color="grey.100"
                      maxWidth="600px"
                      dangerouslySetInnerHTML={{ __html: rec.contentHTML }}
                      size="sm"
                      noOfLines={2}
                    />
                  ) : (
                    <Text
                      color="grey.100"
                      maxWidth="600px"
                      size="sm"
                      noOfLines={2}
                    >
                      {rec.content}
                    </Text>
                  )}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
