import Head from 'next/head';
import Image from 'next/image';
import { GetServerSideProps } from 'next';
import { Rec } from '@prisma/client';

import prisma from '../../lib/prisma';

interface Props {
  rec: Rec | null;
}

export const getServerSideProps: GetServerSideProps = async ({
  params,
}): Promise<{ props: Props }> => {
  const rec =
    params?.id != null
      ? await prisma.rec.findUnique({
          where: {
            id: String(params.id),
          },
        })
      : null;

  return {
    props: { rec },
  };
};

export default function RecPage({ rec }: Props) {
  return (
    <>
      <h1>{rec?.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: rec?.contentHTML || '' }} />
    </>
  );
}
