import type { CSSProperties } from "react";
import { asset } from "@/lib/assets";
import { FLAVOURS, LOGO_IMAGE } from "@/lib/catalog";
import IntroController from "./IntroController";

// Runs before the overlay paints. Every full load of the home page gets the intro (it also hides
// the 3D scene while it loads); reduced-motion users skip it.
// The doors always open onto the hero, so a refresh starts from the top instead of a restored scroll.
const decide = `(function(){var d=document.documentElement;try{if(matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("intro-skip")}else{d.classList.add("intro-active");if(!location.hash){history.scrollRestoration="manual";scrollTo(0,0)}}}catch(e){d.classList.add("intro-skip")}})();`;

// Jar silhouette that mirrors the 3D hero jar: black lid, glass body, label band.
const BODY = "M22 44 Q22 36 30 34 H90 Q98 36 98 44 V150 Q98 162 86 162 H34 Q22 162 22 150 Z";

export default function Intro() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: decide }} />
      <div id="intro" className="intro" aria-hidden="true">
        <div className="intro__half intro__half--top" />
        <div className="intro__half intro__half--bottom" />
        <div className="intro__beans">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} style={{ "--i": i } as CSSProperties} />
          ))}
        </div>

        <div className="intro__center">
          <div className="intro__jar">
            <svg viewBox="0 0 120 170" className="intro__svg">
              <defs>
                <clipPath id="intro-jar-clip">
                  <path d={BODY} />
                </clipPath>
                <linearGradient id="intro-coffee" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#d9a35b" />
                  <stop offset="0.45" stopColor="#a86d38" />
                  <stop offset="1" stopColor="#5a3218" />
                </linearGradient>
              </defs>
              <g clipPath="url(#intro-jar-clip)">
                <g className="intro__coffee">
                  <path
                    className="intro__crema"
                    d="M-120 34 Q-105 28 -90 34 T-60 34 T-30 34 T0 34 T30 34 T60 34 T90 34 T120 34 T150 34 T180 34 T210 34 T240 34 V180 H-120 Z"
                  />
                  <rect x="-10" y="38" width="140" height="140" fill="url(#intro-coffee)" />
                </g>
              </g>
              <path d={BODY} className="intro__glass" />
              <rect x="26" y="70" width="68" height="58" rx="2" className="intro__label" />
              <rect x="24" y="14" width="72" height="22" rx="4" className="intro__lid" />
              <path d="M28 20 H92 M28 25 H92 M28 30 H92" className="intro__lid-ribs" />
            </svg>
            {/* eslint-disable-next-line @next/next/no-img-element -- must paint before hydration */}
            <img className="intro__logo" src={asset(LOGO_IMAGE)} alt="" width={120} height={51} />
          </div>

          <p className="intro__flavours">
            {FLAVOURS.map((f, i) => (
              <span key={f.id} style={{ "--i": i, "--c": f.color } as CSSProperties}>
                {f.name}
              </span>
            ))}
          </p>
          <p className="intro__meter">
            <span className="intro__tag">Brewing your moment</span>
            <span className="intro__pct">
              <span id="intro-pct">0</span>%
            </span>
          </p>
        </div>
        <p className="intro__skip">Tap to skip</p>
      </div>
      <IntroController />
    </>
  );
}
