import Head from 'next/head';
import Image from 'next/image';
import { GetStaticProps } from 'next';
import { Rec } from '@prisma/client';

import prisma from '../lib/prisma';

interface Props {
  recs: Rec[];
}

// index.tsx
export const getStaticProps: GetStaticProps = async (): Promise<{
  props: Props;
}> => {
  const recs = await prisma.rec.findMany({});

  return { props: { recs } };
};

export default function Recs({ recs }: Props) {
  return (
    <ol>
      {recs.map((rec) => (
        <li>{rec.title}</li>
      ))}
    </ol>
  );
}
