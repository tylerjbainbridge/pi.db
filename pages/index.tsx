import { GetStaticProps } from 'next';
import { Rec, Guest, Feature } from '@prisma/client';
import {
  Box,
  Text,
  InputGroup,
  InputLeftElement,
  Image,
  LinkBox,
  LinkOverlay,
  Button,
  ButtonGroup,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import prisma from '../lib/prisma';
import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '@chakra-ui/react';
import _ from 'lodash';

const PAGE_SIZE = 50;

type ResultRec = Rec & {
  guest: Guest;
  feature: Feature;
};

interface Props {
  recs: ResultRec[];
}

import NextImage from 'next/image';
import Subscribe from '../components/subscribe';

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
  const [isReady, setIsReady] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

  useEffect(() => {
    document.title = 'PI Search';
  }, []);

  useEffect(() => {
    buildSearchables(recs);
    setIsReady(true);
  }, []);

  const filteredRecs = useMemo(() => {
    if (limit !== PAGE_SIZE) setLimit(PAGE_SIZE);

    if (searchQuery.length === 0) {
      return recs;
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
        <a href="https://www.perfectlyimperfect.fyi/" target="_blank">
          <NextImage
            src="/static/pi-logo.png"
            alt="pi-logo"
            width="200px"
            height="80px"
          />
        </a>
        {/* <br /> */}
        {/* <Subscribe /> */}
      </Box>
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
          {isReady &&
            _.slice(filteredRecs, 0, limit).map((rec) => {
              const href = `${rec.feature.url}#:~:text=${encodeURI(rec.title)}`;
              return (
                <Box display="flex" key={rec.id} marginBottom="30px">
                  <LinkBox marginEnd="15px" as={Box}>
                    <LinkOverlay
                      href={href}
                      alt={rec.feature.title}
                      target="_blank"
                    />
                    {rec.feature.thumbnailSrc ? (
                      <Image
                        src={rec.feature.thumbnailSrc}
                        width="100px"
                        height="100px"
                        maxWidth="100px"
                        maxHeight="100px"
                        border="5px solid #ff0"
                      ></Image>
                    ) : (
                      <Box
                        maxWidth="100px"
                        maxHeight="100px"
                        border="5px solid #ff0"
                      ></Box>
                    )}
                  </LinkBox>
                  <Box>
                    <Box
                      fontWeight="bold"
                      marginBottom="5px"
                      as="a"
                      color="#FF0"
                      href={href}
                    >
                      {rec.emoji} {rec.title}
                    </Box>
                    <Box marginBottom="5px">
                      <em>from</em>{' '}
                      <Box as="a" href={href} fontWeight="bold" target="_blank">
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
              );
            })}

          <ButtonGroup spacing="6">
            {filteredRecs.length > limit && (
              <Button
                bgColor="blue"
                color="#ff0"
                _hover={{ bg: '#ff0', color: 'blue' }}
                onClick={() => setLimit(limit + PAGE_SIZE)}
              >
                Show more ({Math.min(limit, filteredRecs.length)}/
                {filteredRecs.length})
              </Button>
            )}
            <Button
              bgColor="blue"
              color="#ff0"
              _hover={{ bg: '#ff0', color: 'blue' }}
              onClick={() => {
                document.body.scrollTop = 0; // For Safari
                document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
              }}
            >
              Back to top
            </Button>
          </ButtonGroup>
        </Box>
      </Box>
    </Box>
  );
}
