/**
 * Renders one or more JSON-LD structured-data blocks. Server-rendered into the
 * HTML so crawlers read it without executing JS. Pass a single schema object or
 * an array; each becomes its own <script type="application/ld+json">.
 */
export function JsonLd({ schema }: { schema: object | object[] }) {
  const blocks = Array.isArray(schema) ? schema : [schema];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Static, server-built objects — no user input — so this is safe.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
