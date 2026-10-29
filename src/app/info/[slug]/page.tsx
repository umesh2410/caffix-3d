import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import PageHero from "@/components/PageHero";
import { getInfoPage, INFO_PAGES } from "@/lib/info";

export function generateStaticParams() {
  return INFO_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/info/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = getInfoPage(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.sections?.[0]?.body ?? page.faqs?.[0]?.a ?? page.articles?.[0]?.summary,
    alternates: { canonical: `/info/${page.slug}` },
  };
}

// Every page is prerendered from generateStaticParams; blocking keeps unknown slugs a real 404.
export const instant = false;

export default async function InfoPage({ params }: PageProps<"/info/[slug]">) {
  const { slug } = await params;
  const page = getInfoPage(slug);
  if (!page) notFound();

  const words = page.title.split(" ");
  return (
    <>
      <PageHero eyebrow={page.kicker} title={words.slice(0, -1).join(" ")} accent={words.at(-1)} />
    <div className="page page--after-hero">
      {page.faqs && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: page.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }}
        />
      )}
      <article className="info">
        {page.sections?.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            <p>{s.body}</p>
          </section>
        ))}
        {page.faqs?.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
        {page.articles?.map((a) => (
          <section key={a.title}>
            <p className="eyebrow">
              {a.date} · {a.readTime}
            </p>
            <h2 style={{ marginTop: "0.5rem" }}>{a.title}</h2>
            <p>{a.summary}</p>
          </section>
        ))}
      </article>
    </div>
    </>
  );
}
