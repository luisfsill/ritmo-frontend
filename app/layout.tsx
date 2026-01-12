import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Ritmo - Agendamento Inteligente via WhatsApp',
  description: 'Automatize agendamentos do seu negócio com IA conversacional no WhatsApp. Reduza no-shows, gerencie sua equipe e aumente receita.',
  keywords: [
    'agendamento online',
    'sistema de agendamento',
    'agendamento whatsapp',
    'agendamento salão de beleza',
    'software para clínicas',
    'agendamento automático',
    'gestão de agendamentos',
    'SaaS agendamento',
  ],
  authors: [{ name: 'Ritmo' }],
  creator: 'Ritmo',
  publisher: 'Ritmo',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Ritmo - Agendamento Inteligente via WhatsApp',
    description: 'Automatize agendamentos do seu negócio com IA conversacional no WhatsApp. Reduza no-shows, gerencie sua equipe e aumente receita.',
    url: 'https://ritmo.app',
    siteName: 'Ritmo',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/favicon.svg',
        width: 200,
        height: 200,
        alt: 'Ritmo - Agendamento Inteligente',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ritmo - Agendamento Inteligente via WhatsApp',
    description: 'Automatize agendamentos do seu negócio com IA conversacional no WhatsApp.',
    images: ['/favicon.svg'],
  },
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
