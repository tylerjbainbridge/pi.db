import Head from 'next/head';
import Image from 'next/image';
import { GetStaticProps } from 'next';
import { Rec } from '@prisma/client';

import prisma from '../lib/prisma';

// index.tsx
export const getStaticProps: GetStaticProps = async () => {
  const recs = await prisma.rec.findMany({});

  return { props: { recs } };
};

interface Props {
  recs: Rec[];
}

export default function Recs({ recs }: Props) {
  return (
    <ol>
      {recs.map((rec) => (
        <li>{rec.title}</li>
      ))}
    </ol>
  );
}
