import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  return {
    title: `Agendar com @${slug} | Ritmo`,
    description: `Agende seu horário com @${slug} de forma rápida e fácil pelo Ritmo.`,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `Agendar com @${slug}`,
      description: `Agende seu horário com @${slug} de forma rápida e fácil.`,
      type: 'website',
    },
  };
}

export default function PublicBookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
