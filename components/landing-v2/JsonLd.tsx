/**
 * JSON-LD Script Component
 * Renders structured data for SEO
 */

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Server Component to render JSON-LD structured data
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, process.env.NODE_ENV === 'development' ? 2 : 0),
      }}
    />
  );
}
