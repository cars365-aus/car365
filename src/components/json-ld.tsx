/** Renders one or more JSON-LD schema objects as a script tag. */
export function JsonLd({ schema }: { schema: object | object[] }) {
  const data = Array.isArray(schema) ? schema : [schema];
  return (
    <>
      {data.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Schema objects are built server-side from our own data — safe to inline.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
    </>
  );
}
