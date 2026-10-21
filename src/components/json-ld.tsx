import type { Thing, WithContext } from "schema-dts";

/**
 * Server-rendered `<script type="application/ld+json">`. `<` is escaped so text
 * from the database (a title containing "</script>") can't end the tag early.
 */
export function JsonLd({ data }: { data: WithContext<Exclude<Thing, string>> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
