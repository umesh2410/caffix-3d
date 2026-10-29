"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollToY } from "@/components/SmoothScroll";
import { asset } from "@/lib/assets";
import { hasWebGL } from "@/lib/webgl";
import type { LabState } from "./BrewLabScene";

const BrewLabScene = dynamic(() => import("./BrewLabScene"), { ssr: false });

// Step photography and alt text come from the live site's brew sequence.
const STEPS = [
  {
    img: "/images/brew-scroll/step1empty.png",
    alt: "CAFFIX essentials: glass tumbler, 4 sachets, milk pitcher, frother, ice bowl on marble table",
    title: "The essentials",
    text: "A glass, a Caffix sachet, chilled milk and ice. That's the whole kit.",
    tag: "Your glass",
  },
  {
    img: "/images/brew-scroll/step2tear.png",
    alt: "Pouring CAFFIX Hazel Cold Coffee granules into the glass tumbler",
    title: "Tear & pour",
    text: "Empty one sachet — or 2–3 spoons from the jar — into the glass.",
    tag: "Caffix sachet",
  },
  {
    img: "/images/brew-scroll/step3milk.png",
    alt: "Pouring 220ml chilled milk into the coffee granules in the glass tumbler",
    title: "Add chilled milk",
    text: "Pour in about 220 ml of cold milk. No hot water needed.",
    tag: "Chilled milk · 220 ml",
  },
  {
    img: "/images/brew-scroll/step4mix.png",
    alt: "CAFFIX handheld electric frother whipping the cold coffee into a rich microfoam vortex",
    title: "Mix",
    text: "Stir, shake or froth. It dissolves straight into cold milk.",
    tag: "Mixer / frother",
  },
  {
    img: "/images/brew-scroll/step5ready.png",
    alt: "Finished creamy iced cold coffee with crystal ice cubes and velvety foam head",
    title: "Enjoy",
    text: "Add ice and sip café-style cold coffee. Ready in 5 secs.",
    tag: "Cold coffee, ready",
  },
];

type Mode = "pending" | "3d" | "static";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribe(cb: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getMode = (): Mode => (window.matchMedia(REDUCED_MOTION).matches || !hasWebGL() ? "static" : "3d");
const noopSubscribe = () => () => {};
const isLowPower = () => (navigator.hardwareConcurrency ?? 8) <= 4 || window.matchMedia("(max-width: 760px)").matches;

export default function BrewLab() {
  const mode = useSyncExternalStore(subscribe, getMode, () => "pending" as Mode);
  const lowPower = useSyncExternalStore(noopSubscribe, isLowPower, () => false);
  const [current, setCurrent] = useState(0);
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const labState = useRef<LabState>({ p: 0 });
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || mode !== "3d") return;
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        labState.current.p = self.progress;
        progressRef.current?.style.setProperty("--p", self.progress.toFixed(4));
        setCurrent(Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length)));
      },
    });
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: "200px 0px" });
    io.observe(el);
    return () => {
      st.kill();
      io.disconnect();
    };
  }, [mode]);

  const step = STEPS[current];

  if (mode === "static") {
    return (
      <section id="brew" className="lab lab--static" aria-labelledby="brew-title">
        <div className="lab__head">
          <p className="eyebrow">How it works</p>
          <h2 id="brew-title" className="lab__title">
            Less effort. <em>More coffee moments.</em>
          </h2>
        </div>
        <ol className="lab__stills">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <div className="lab__still">
                <Image src={asset(s.img)} alt={s.alt} fill sizes="(max-width: 760px) 92vw, 30vw" />
              </div>
              <span className="lab__num">0{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="brew"
      className={`lab${ready ? " is-ready" : ""}`}
      data-step={current}
      aria-labelledby="brew-title"
    >
      <div className="lab__sticky">
        {mode === "3d" && (
          <BrewLabScene stateRef={labState} tagRef={tagRef} active={active} lowPower={lowPower} onReady={onReady} />
        )}
        <div className="lab__vignette" aria-hidden="true" />

        <div className="lab__head">
          <p className="eyebrow">How it works · 3D brew lab</p>
          <h2 id="brew-title" className="lab__title">
            Less effort. <em>More coffee moments.</em>
          </h2>
        </div>

        <div ref={tagRef} className="lab__tag" aria-hidden="true">
          <span className="lab__tag-dot" />
          <span key={step.tag} className="lab__tag-text">
            {step.tag}
          </span>
        </div>

        <article key={step.title} className="lab__card" aria-live="polite">
          <div className="lab__card-media">
            <Image src={asset(step.img)} alt={step.alt} fill sizes="132px" />
          </div>
          <div>
            <span className="lab__num">
              0{current + 1} / 0{STEPS.length}
            </span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            <small>Real photo from the Caffix brew guide</small>
          </div>
        </article>

        <div className="lab__steps">
          <div ref={progressRef} className="lab__progress" aria-hidden="true">
            <span />
          </div>
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.title} className={i === current ? "is-current" : i < current ? "is-done" : undefined}>
                <button
                  type="button"
                  className="lab__jump"
                  aria-current={i === current ? "step" : undefined}
                  aria-label={`Go to step ${i + 1}: ${s.title}`}
                  onClick={() => {
                    const el = sectionRef.current;
                    if (!el) return;
                    // Land in the middle of the step's scroll range so its pose is fully settled.
                    const range = el.offsetHeight - window.innerHeight;
                    scrollToY(el.offsetTop + range * ((i + 0.5) / STEPS.length));
                  }}
                >
                  <span>0{i + 1}</span> {s.title}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
