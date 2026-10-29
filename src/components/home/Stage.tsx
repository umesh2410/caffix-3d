"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type TouchEvent,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AddToCartButton from "@/components/AddToCartButton";
import { asset } from "@/lib/assets";
import { FLAVOURS, getFlavour, getProduct, HERO_JARS_ART_IMAGE, HERO_JARS_IMAGE, type FlavourId } from "@/lib/catalog";
import { formatINR } from "@/lib/pricing";
import { hasWebGL } from "@/lib/webgl";
import { announceHeroReady } from "./heroReady";
import type { PartElements, PartId, SceneState } from "./JarScene";

// Start downloading the 3D chunk as soon as this module runs, in parallel with hydration.
const loadJarScene = () => import("./JarScene");
if (typeof window !== "undefined") void loadJarScene();
const JarScene = dynamic(loadJarScene, { ssr: false });

type Mode = "pending" | "3d" | "static";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getMode = (): Mode => (window.matchMedia(REDUCED_MOTION).matches || !hasWebGL() ? "static" : "3d");
const getServerMode = (): Mode => "pending";

const noopSubscribe = () => () => {};
function isLowPower() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (
    (nav.hardwareConcurrency ?? 8) <= 4 ||
    (nav.deviceMemory ?? 8) <= 4 ||
    window.matchMedia("(max-width: 760px)").matches
  );
}

// Background for each stage section; the last one follows the selected flavour.
const STAGE_COLORS = ["#120b07", "#1d120b", "#24160d", "#3a2412"];

// Exploded-view callouts. Copy is limited to what the brand states on thecaffix.in.
const PARTS: { id: PartId; name: string; note: string }[] = [
  { id: "lid", name: "Airtight lid", note: "Keep it tightly closed after opening" },
  { id: "label", name: "Flavour label", note: "Classic · Vanilla · Hazel · Irish · Mocha" },
  { id: "glass", name: "125 g glass jar", note: "About 5 tall glasses per jar" },
  { id: "sweetener", name: "Sweetener", note: "Already in the mix" },
  { id: "creamer", name: "Creamer", note: "Already in the mix" },
  { id: "coffee", name: "100% Arabica", note: "Granulated to dissolve in cold milk" },
];

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const plateau = (f: number) => {
  const t = Math.min(1, Math.max(0, (f - 0.25) / 0.5));
  return t * t * (3 - 2 * t);
};

export default function Stage() {
  const mode = useSyncExternalStore(subscribeMotion, getMode, getServerMode);
  const lowPower = useSyncExternalStore(noopSubscribe, isLowPower, () => false);
  const [flavourId, setFlavourId] = useState<FlavourId>("classic");
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const partsRef = useRef<PartElements>({});
  const sceneState = useRef<SceneState>({ s: 0, hover: null });
  const flavourColor = useRef(hexToRgb(FLAVOURS[0].stage));
  const paintRef = useRef<() => void>(() => {});
  const onReady = useCallback(() => setReady(true), []);

  const flavour = getFlavour(flavourId) ?? FLAVOURS[0];
  const jar = getProduct(flavour.jarId);
  const sachet = getProduct(flavour.sachetId);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const stops = STAGE_COLORS.map(hexToRgb);
    // The sticky layer always covers the visible part of the stage, so only that viewport-sized box
    // is repainted on scroll instead of the whole multi-screen section.
    const backdrop = el.querySelector<HTMLElement>(".stage__sticky") ?? el;

    const paint = () => {
      const s = sceneState.current.s;
      const all = [...stops, flavourColor.current];
      const max = all.length - 1;
      const c = Math.min(max, Math.max(0, s));
      const i = Math.min(max - 1, Math.floor(c));
      const t = plateau(c - i);
      const a = all[i];
      const b = all[i + 1];
      const mix = (p: number, q: number) => Math.round(p + (q - p) * t);
      backdrop.style.backgroundColor = `rgb(${mix(a.r, b.r)},${mix(a.g, b.g)},${mix(a.b, b.b)})`;
    };
    paintRef.current = paint;

    // Measure in section heights (100svh), not innerHeight, so the 3D poses stay in sync with the
    // copy on phones where the address bar grows and shrinks the viewport.
    const hero = el.querySelector<HTMLElement>(".hero");
    const update = (self: ScrollTrigger) => {
      const unit = hero?.offsetHeight || window.innerHeight;
      sceneState.current.s = Math.max(0, self.scroll() - self.start) / unit;
      paint();
    };
    const main = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: update,
      onRefresh: update,
    });
    const chapters = gsap.utils.toArray<HTMLElement>("[data-chapter]", el);
    const triggers = chapters.map((ch) =>
      ScrollTrigger.create({
        trigger: ch,
        start: "top 62%",
        end: "bottom 38%",
        toggleClass: { targets: ch, className: "is-active" },
      })
    );
    paint();

    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: "120px 0px" });
    io.observe(el);

    return () => {
      main.kill();
      triggers.forEach((t) => t.kill());
      io.disconnect();
    };
  }, []);

  // Without WebGL there is nothing to wait for: let the intro open straight away.
  useEffect(() => {
    if (mode === "static") announceHeroReady();
  }, [mode]);

  const selectFlavour = (id: FlavourId) => {
    const next = getFlavour(id);
    if (!next || id === flavourId) return;
    setFlavourId(id);
    gsap.to(flavourColor.current, {
      ...hexToRgb(next.stage),
      duration: 0.9,
      ease: "power2.out",
      onUpdate: () => paintRef.current(),
    });
  };

  // Phones: swipe sideways across the panel to move between flavours.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onSwipeStart = (e: TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    swipe.current = { x: t.clientX, y: t.clientY };
  };
  const onSwipeEnd = (e: TouchEvent<HTMLDivElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    const index = FLAVOURS.findIndex((f) => f.id === flavourId);
    const next = (index + (dx < 0 ? 1 : -1) + FLAVOURS.length) % FLAVOURS.length;
    selectFlavour(FLAVOURS[next].id);
  };

  const onChipKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const nextIndex = (index + delta + FLAVOURS.length) % FLAVOURS.length;
    selectFlavour(FLAVOURS[nextIndex].id);
    chipRefs.current[nextIndex]?.focus();
  };

  const setHover = (id: PartId | null) => {
    sceneState.current.hover = id;
    for (const p of PARTS) partsRef.current[p.id]?.classList.toggle("is-hover", p.id === id);
  };

  return (
    <div ref={stageRef} className={`stage stage--${mode}${ready ? " is-ready" : ""}`}>
      <div className="stage__sticky">
        <div className="stage__glow" aria-hidden="true" />
        {mode === "3d" && (
          <JarScene
            stateRef={sceneState}
            partsRef={partsRef}
            flavour={flavourId}
            lowPower={lowPower}
            active={active}
            onReady={onReady}
          />
        )}
        {mode === "3d" && (
          <div className="parts" aria-hidden="true">
            {PARTS.map((part, i) => (
              <div
                key={part.id}
                ref={(node) => {
                  partsRef.current[part.id] = node;
                }}
                className="part"
                onPointerEnter={() => setHover(part.id)}
                onPointerLeave={() => setHover(null)}
              >
                <span className="part__dot" />
                <span className="part__line" />
                <span className="part__text">
                  <span className="part__num">0{i + 1}</span>
                  <strong>{part.name}</strong>
                  <small>{part.note}</small>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <p className="eyebrow hero__eyebrow">Instant cold coffee · Ready in 5 secs</p>
          <h1 id="hero-title" className="hero__title">
            <span className="hero__line">
              <span>Your coffee.</span>
            </span>
            <span className="hero__line hero__line--serif">
              <span>Your moment.</span>
            </span>
          </h1>
          <p className="hero__lede">Meet your new cold coffee ritual. Rich flavour, effortless preparation, pure Caffix.</p>
          <div className="hero__ctas">
            <a href="#story" className="btn btn--primary magnetic">
              Explore the blend
            </a>
            <a href="#shop" className="btn btn--ghost magnetic">
              Shop Caffix
            </a>
          </div>
        </div>
        <ul className="hero__meta">
          <li>5 flavours</li>
          <li>Jars &amp; single-serve sachets</li>
          <li>Mixes straight into cold milk</li>
        </ul>
        <div className="scroll-cue" aria-hidden="true">
          <span>Scroll to open</span>
          <i />
        </div>
        <div className="hero__badge" aria-hidden="true">
          <svg viewBox="0 0 120 120">
            <defs>
              <path id="hero-badge-ring" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
            </defs>
            <text>
              <textPath href="#hero-badge-ring">Ready in 5 secs · Mix in cold milk · 3 in 1 ·</textPath>
            </text>
          </svg>
          <span className="hero__badge-core">
            5<small>secs</small>
          </span>
        </div>
        <figure className="stage-figure stage-figure--hero">
          <Image
            src={asset(HERO_JARS_IMAGE)}
            alt="Caffix instant cold coffee jars in Classic, Hazelnut and Vanilla"
            width={1398}
            height={892}
            sizes="(max-width: 760px) 92vw, 46vw"
          />
        </figure>
      </section>

      <section className="chapter chapter--a" id="story" data-chapter="1" aria-labelledby="ch1-title">
        <div className="chapter__copy">
          <p className="chapter__index">01 — Open it up</p>
          <h2 id="ch1-title" className="chapter__title">
            Twist the lid. <em>Meet the blend.</em>
          </h2>
          <p className="chapter__body">
            Every Caffix jar is 125 g of instant cold coffee in an airtight glass jar — made with 100% Arabica and
            specially granulated to dissolve straight into ice-cold milk. No hot water, no lumps.
          </p>
        </div>
        <figure className="stage-figure">
          <Image
            src={asset("/images/jar_classic_crest.png")}
            alt="Caffix Classic Crest jar beside an iced coffee"
            width={571}
            height={1024}
            sizes="(max-width: 760px) 70vw, 30vw"
          />
        </figure>
      </section>

      <section className="chapter chapter--x" data-chapter="2" aria-labelledby="ch2-title">
        <div className="chapter__copy">
          <p className="chapter__index">02 — What&apos;s inside</p>
          <h2 id="ch2-title" className="chapter__title">
            Three in one. <em>Opened up.</em>
          </h2>
          <p className="chapter__body">
            Coffee, creamer and sweetener — already mixed, so all you add is cold milk.
          </p>
          <p className="chapter__hint">
            <span className="chapter__hint-mouse">Hover a part to explore</span>
            <span className="chapter__hint-touch">Every part, labelled</span>
          </p>
          <ul className="sr-only">
            {PARTS.map((p) => (
              <li key={p.id}>
                {p.name}: {p.note}
              </li>
            ))}
          </ul>
        </div>
        <figure className="stage-figure">
          <Image
            src={asset("/images/caffix_how_to_brew_guide.png")}
            alt="Caffix how-to-brew guide"
            width={686}
            height={1024}
            sizes="(max-width: 760px) 70vw, 28vw"
          />
        </figure>
      </section>

      <section className="chapter chapter--c" data-chapter="3" aria-labelledby="ch3-title">
        <div className="chapter__copy">
          <p className="chapter__index">03 — The range</p>
          <h2 id="ch3-title" className="chapter__title">
            Five flavours. <em>One ritual.</em>
          </h2>
          <p className="chapter__body">
            Classic Crest, Vanilla Velvet, Hazel Gold, Irish Emerald and Mocha Bliss — in 125g airtight glass jars and
            single-serve sachets.
          </p>
          <a href="#flavours" className="text-link">
            Find your flavour
          </a>
        </div>
        <figure className="stage-figure">
          <Image
            src={asset(HERO_JARS_ART_IMAGE)}
            alt="The Caffix jar range"
            width={1388}
            height={892}
            sizes="(max-width: 760px) 92vw, 50vw"
          />
        </figure>
      </section>

      <section
        className="flavours"
        id="flavours"
        aria-labelledby="flavours-title"
        style={{ "--accent": flavour.label.accent, "--swatch": flavour.color } as CSSProperties}
      >
        <div className="flavours__panel" onTouchStart={onSwipeStart} onTouchEnd={onSwipeEnd}>
          <p className="eyebrow">Interactive flavour selector</p>
          <h2 id="flavours-title" className="flavours__title">
            Find your <em>flavour.</em>
          </h2>

          <div role="radiogroup" aria-label="Choose a flavour" className="flavour-chips">
            {FLAVOURS.map((f, i) => (
              <button
                key={f.id}
                ref={(node) => {
                  chipRefs.current[i] = node;
                }}
                type="button"
                role="radio"
                aria-checked={f.id === flavourId}
                tabIndex={f.id === flavourId ? 0 : -1}
                className="flavour-chip"
                style={{ "--chip": f.color } as CSSProperties}
                onClick={() => selectFlavour(f.id)}
                onKeyDown={(e) => onChipKey(e, i)}
              >
                <span className="flavour-chip__dot" aria-hidden="true" />
                {f.name}
              </button>
            ))}
          </div>

          <p className="flavours__swipe" aria-hidden="true">
            <span>←</span> Swipe to change flavour <span>→</span>
          </p>

          <div key={flavour.id} className="flavours__detail">
            <p className="flavours__sub">{flavour.sub}</p>
            <h3 className="flavours__name">{flavour.name}</h3>
            {jar && <p className="flavours__desc">{jar.description}</p>}
            {jar && (
              <p className="flavours__price">
                <strong>{formatINR(jar.price)}</strong>
                <span>{jar.packLabel}</span>
              </p>
            )}
            {jar && (
              <div className="flavours__actions">
                <AddToCartButton productId={jar.id} label="Add jar to cart" />
                <Link href={`/products/${jar.id}`} className="btn btn--ghost">
                  View details
                </Link>
              </div>
            )}
            {sachet && (
              <Link href={`/products/${sachet.id}`} className="flavours__sachet">
                Prefer single-serve? {sachet.name} · {formatINR(sachet.price)}
                <span aria-hidden="true"> →</span>
              </Link>
            )}
          </div>
        </div>

        <figure className="flavours__photo">
          <div className="flavours__photo-frame">
            {FLAVOURS.map((f) => (
              <Image
                key={f.id}
                src={asset(f.photo)}
                alt={f.id === flavourId ? `${f.name} jar photographed with an iced coffee` : ""}
                aria-hidden={f.id !== flavourId}
                fill
                sizes="(max-width: 760px) 40vw, 240px"
                className={f.id === flavourId ? "is-current" : undefined}
              />
            ))}
          </div>
          <figcaption>The real jar · {flavour.name}</figcaption>
        </figure>
      </section>
    </div>
  );
}
