import type { ReactNode } from "react";

interface Props {
  items: ReactNode[];
  variant?: "caramel" | "dark";
  reverse?: boolean;
  label: string;
}

/** Endless ticker band. The second copy exists only for the seamless loop and is hidden from AT. */
export default function Marquee({ items, variant = "caramel", reverse = false, label }: Props) {
  const group = (hidden: boolean) => (
    <div className="marquee__group" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <span key={i} className="marquee__item">
          {item}
          <span className="marquee__bean" aria-hidden="true" />
        </span>
      ))}
    </div>
  );
  return (
    <div
      className={`marquee${variant === "dark" ? " marquee--dark" : ""}${reverse ? " marquee--reverse" : ""}`}
      role="marquee"
      aria-label={label}
    >
      <div className="marquee__track">
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}
