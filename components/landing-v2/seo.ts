/**
 * SEO Metadata for Landing V2
 * Provides comprehensive meta tags, Open Graph, Twitter Cards, and JSON-LD
 */

import { Metadata } from 'next';

export interface LandingV2SeoData {
  title: string;
  description: string;
  url: string;
  image: string;
  locale?: string;
  siteName?: string;
}

/**
 * Generate complete metadata for Landing V2
 */
export function generateLandingV2Metadata(data: LandingV2SeoData): Metadata {
  const {
    title,
    description,
    url,
    image,
    locale = 'pt-BR',
    siteName = 'Ritmo',
  } = data;

  return {
    title,
    description,
    keywords: [
      'agenda online',
      'agendamento whatsapp',
      'gestão de salão',
      'gestão de clínica',
      'confirmação automática',
      'lembretes whatsapp',
      'software para salão',
      'software para clínica',
      'automação de agendamentos',
      'reengajamento de clientes',
    ],
    authors: [{ name: 'Ritmo' }],
    creator: 'Ritmo',
    publisher: 'Ritmo',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: url,
      languages: {
        'pt-BR': url,
      },
    },
    openGraph: {
      type: 'website',
      locale,
      url,
      title,
      description,
      siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@ritmoapp',
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };
}

/**
 * Generate JSON-LD structured data for Landing V2
 */
export function generateLandingV2JsonLd(data: LandingV2SeoData) {
  const { title, description, url, image, siteName = 'Ritmo' } = data;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      // Website
      {
        '@type': 'WebSite',
        '@id': `${url}#website`,
        url,
        name: siteName,
        description,
        publisher: {
          '@id': `${url}#organization`,
        },
        inLanguage: 'pt-BR',
      },
      // Organization
      {
        '@type': 'Organization',
        '@id': `${url}#organization`,
        name: siteName,
        url,
        logo: {
          '@type': 'ImageObject',
          url: `${url}/logo.png`,
        },
        sameAs: [
          'https://www.instagram.com/ritmoapp',
          'https://www.linkedin.com/company/ritmoapp',
        ],
      },
      // WebPage
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description,
        isPartOf: {
          '@id': `${url}#website`,
        },
        about: {
          '@id': `${url}#organization`,
        },
        image: {
          '@type': 'ImageObject',
          url: image,
        },
        inLanguage: 'pt-BR',
      },
      // SoftwareApplication
      {
        '@type': 'SoftwareApplication',
        name: siteName,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, iOS, Android',
        offers: {
          '@type': 'AggregateOffer',
          lowPrice: '197',
          highPrice: '397',
          priceCurrency: 'BRL',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '197',
            priceCurrency: 'BRL',
            billingDuration: 'P1M',
          },
        },
      },
    ],
  };
}

/**
 * Generate FAQ JSON-LD structured data
 */
export function generateFaqJsonLd(faqItems: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
