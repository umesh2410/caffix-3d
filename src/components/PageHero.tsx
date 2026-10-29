import type { CSSProperties, ReactNode } from "react";

interface Props {
  eyebrow: string;
  title: string;
  accent?: string;
  lede?: ReactNode;
  children?: ReactNode;
}

/** Dark editorial header shared by the inner pages, echoing the home page stage. */
export default function PageHero({ eyebrow, title, accent, lede, children }: Props) {
  return (
    <header className="page-hero">
      <div className="page-hero__beans" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} style={{ "--i": i } as CSSProperties} />
        ))}
      </div>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="page-hero__title">
        {title} {accent && <em>{accent}</em>}
      </h1>
      {lede && <p className="page-hero__lede">{lede}</p>}
      {children}
    </header>
  );
}
