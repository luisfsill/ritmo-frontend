export type LandingWhatsappResult = {
  href: string;
  isFallback: boolean;
};

const FALLBACK_NUMBER = '5537999216351';

function sanitizeWhatsappNumber(number: string | undefined): string {
  if (!number) return '';
  return number.replace(/\D+/g, '');
}

export function buildLandingWhatsappUrl(number: string | undefined, message: string): LandingWhatsappResult {
  const sanitized = sanitizeWhatsappNumber(number);
  const hasValidConfiguredNumber = sanitized.length > 0;
  const targetNumber = hasValidConfiguredNumber ? sanitized : FALLBACK_NUMBER;

  const encodedMessage = encodeURIComponent(message.trim());
  const href = encodedMessage.length > 0 ? `https://wa.me/${targetNumber}?text=${encodedMessage}` : `https://wa.me/${targetNumber}`;
  return { href, isFallback: !hasValidConfiguredNumber };
}
