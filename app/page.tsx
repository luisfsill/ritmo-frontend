import type { Metadata } from 'next';
import { LandingV2Client } from '@/components/landing-v2';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://ritmo.app').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Ritmo | Agenda inteligente via WhatsApp',
  description:
    'Ritmo ajuda saloes e clinicas a reduzir faltas, organizar a agenda e aumentar previsibilidade com automacao no WhatsApp.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: '/',
  },
};

export default function LandingPage() {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ritmo',
    url: siteUrl,
    logo: `${siteUrl}/favicon.svg`,
    description:
      'Plataforma de agendamento inteligente com automacao conversacional para negocios de servicos.',
  };

  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Ritmo',
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
    },
    url: `${siteUrl}/`,
    description:
      'Agendamento de servicos com WhatsApp, automacoes de confirmacao e rotina de reengajamento.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <LandingV2Client />
    </>
  );
}

