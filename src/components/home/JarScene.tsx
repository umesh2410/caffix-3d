"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { textureUrl } from "@/lib/assets";
import { getFlavour, LOGO_IMAGE, type Flavour, type FlavourId } from "@/lib/catalog";
import {
  drawLabel,
  drawPowder,
  drawShadow,
  drawSoftDot,
  ensureFonts,
  LABEL_H,
  LABEL_W,
  loadImage,
  readFonts,
  type LabelFonts,
} from "./labelTexture";
import { announceHeroReady } from "./heroReady";
import {
  canvasTexture,
  clamp01,
  easeInOutCubic,
  easeOutCubic,
  easeOutQuart,
  warmUp,
  isStacked,
  mulberry32,
  smooth,
  TAU,
  useAdaptiveDpr,
} from "./sceneUtils";

export type PartId = "lid" | "label" | "glass" | "sweetener" | "creamer" | "coffee";

/** Shared between the DOM and the scene without React re-renders. */
export interface SceneState {
  /** Scroll position of the stage, in viewport heights (0 = hero, 4 = flavour selector). */
  s: number;
  hover: PartId | null;
}

export type PartElements = Partial<Record<PartId, HTMLElement | null>>;

interface Props {
  stateRef: RefObject<SceneState>;
  partsRef: RefObject<PartElements>;
  flavour: FlavourId;
  lowPower: boolean;
  active: boolean;
  onReady: () => void;
}

interface Anim {
  ready: boolean;
  warm: boolean;
  announced: boolean;
  introStart: number;
  intro: number;
  spinStart: number; // -1 idle, -2 queued for next frame
  pending: Flavour | null;
  assets: { fonts: LabelFonts; logo: HTMLImageElement | null } | null;
}

type Key = {
  x: number;
  y: number;
  rot: number;
  tilt: number;
  pitch: number;
  scale: number;
  cam: number;
  explode: number;
};

const FOV = 30;

// One key per stage section: hero, "open it up", exploded view, range, flavour selector.
// x/y are fractions of the visible half-width/half-height. rot -1.92 shows the right label panel.
const DESKTOP: Key[] = [
  { x: 0.42, y: -0.04, rot: -0.38, tilt: 0.06, pitch: 0, scale: 1, cam: 9, explode: 0 },
  { x: 0.38, y: -0.12, rot: -1.92, tilt: -0.04, pitch: 0.1, scale: 1, cam: 10, explode: 0.32 },
  { x: 0.09, y: -0.1, rot: -5.6, tilt: 0, pitch: 0.28, scale: 0.94, cam: 14.2, explode: 1 },
  { x: 0, y: -0.52, rot: -TAU, tilt: 0, pitch: 0, scale: 0.78, cam: 9.6, explode: 0 },
  { x: 0.33, y: -0.02, rot: -TAU + 0.3, tilt: 0.04, pitch: 0, scale: 1.02, cam: 9, explode: 0 },
];
const TABLET: Key[] = [
  { x: 0.34, y: 0.02, rot: -0.38, tilt: 0.06, pitch: 0, scale: 0.86, cam: 10, explode: 0 },
  { x: 0.34, y: 0.04, rot: -1.92, tilt: -0.04, pitch: 0.1, scale: 0.86, cam: 11, explode: 0.32 },
  { x: 0.02, y: -0.08, rot: -5.6, tilt: 0, pitch: 0.28, scale: 0.84, cam: 15.5, explode: 1 },
  { x: 0, y: -0.52, rot: -TAU, tilt: 0, pitch: 0, scale: 0.7, cam: 10.4, explode: 0 },
  { x: 0.3, y: 0.28, rot: -TAU + 0.3, tilt: 0.04, pitch: 0, scale: 0.82, cam: 10, explode: 0 },
];
const MOBILE: Key[] = [
  { x: 0, y: 0.4, rot: -0.38, tilt: 0.05, pitch: 0, scale: 0.74, cam: 11.5, explode: 0 },
  { x: 0, y: 0.34, rot: -1.92, tilt: -0.04, pitch: 0.1, scale: 0.7, cam: 12.5, explode: 0.32 },
  { x: -0.2, y: -0.1, rot: -5.6, tilt: 0, pitch: 0.28, scale: 0.72, cam: 17, explode: 1 },
  { x: 0, y: -0.36, rot: -TAU, tilt: 0, pitch: 0, scale: 0.62, cam: 11.5, explode: 0 },
  { x: 0, y: 0.5, rot: -TAU + 0.3, tilt: 0.04, pitch: 0, scale: 0.64, cam: 11.5, explode: 0 },
];
// On short phones the jar shrinks and moves away from the copy: up where the copy sits below
// the jar (hero, open, flavours), down where it sits above (range).
const MOBILE_LIFT = [1, 1, 0, -1, 1];
// Narrower desktops (4:3, 16:10) push the jar further right where copy sits on the left.
const DESKTOP_NUDGE = [1, 1, 0, 0, 0.6];
const RANGE_ONLY = [0, 0, 0, 1, 0];
const stackedFit = (w: number, h: number) => Math.min(1, Math.max(0.72, h / w / 2.1));

// Exploded-view layout in jar space. Powder is shown as the three parts of the 3-in-1 mix.
const POWDER_BOTTOM = -1.08;
const POWDER_HEIGHT = 1.93;
const LAYER_H = POWDER_HEIGHT / 3;
const LAYERS: { id: PartId; assembled: number; exploded: number; color: string }[] = [
  { id: "sweetener", assembled: POWDER_BOTTOM + LAYER_H * 2.5, exploded: -1.62, color: "#f8f4ec" },
  { id: "creamer", assembled: POWDER_BOTTOM + LAYER_H * 1.5, exploded: -2.32, color: "#e9d6b6" },
  { id: "coffee", assembled: POWDER_BOTTOM + LAYER_H * 0.5, exploded: -3.02, color: "#4a2a16" },
];
// "The range": the other flavours fly in around the hero jar.
const MINI_FLAVOURS: FlavourId[] = ["vanilla", "hazelnut", "irish", "mocha"];
const MINI_SLOTS = [
  { x: -1.8, z: -1.2, s: 0.72 },
  { x: 1.8, z: -1.2, s: 0.72 },
  { x: -3.3, z: -2.6, s: 0.62 },
  { x: 3.3, z: -2.6, s: 0.62 },
];

function paintMini(tex: THREE.CanvasTexture, scratch: HTMLCanvasElement, flavour: Flavour, assets: NonNullable<Anim["assets"]>) {
  drawLabel(scratch, flavour, assets.fonts, assets.logo);
  const c = tex.image as HTMLCanvasElement;
  c.getContext("2d")?.drawImage(scratch, 0, 0, c.width, c.height);
  tex.needsUpdate = true;
}

const LID_LIFT = 1.55;
const BODY_LIFT = 0.35;
const LABEL_SPREAD = 0.3;

// Where each callout attaches on the right-hand silhouette: jar-space height and radius.
function partAnchor(id: PartId, e: number): { y: number; r: number } {
  switch (id) {
    case "lid":
      return { y: 1.2 + LID_LIFT * e, r: 0.74 };
    case "label":
      return { y: 0.3 + BODY_LIFT * e, r: 0.762 * (1 + LABEL_SPREAD * e) };
    case "glass":
      return { y: -0.92 + BODY_LIFT * e, r: 0.755 };
    default: {
      const layer = LAYERS.find((l) => l.id === id)!;
      const y = layer.assembled + (layer.exploded - layer.assembled) * e;
      return { y, r: 0.72 * (1 - 0.08 * e) };
    }
  }
}
const PART_IDS: PartId[] = ["lid", "label", "glass", "sweetener", "creamer", "coffee"];

const SWIRL_TILT = 0.58;

function ringPath(radius: number, arc: number, wave: number, phase: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const a = phase + (arc * i) / steps;
    pts.push([radius * Math.cos(a), wave * Math.sin(a * 3 + phase), radius * Math.sin(a)]);
  }
  return pts;
}
const COFFEE_PATH = ringPath(1.55, TAU * 0.82, 0.07, 0.4);
const MILK_PATH = ringPath(1.8, TAU * 0.7, 0.09, 2.2);

const scratchObject = new THREE.Object3D();
const scratchV = new THREE.Vector3();
const scratchRight = new THREE.Vector3();
const projected = Object.fromEntries(
  (["lid", "label", "glass", "sweetener", "creamer", "coffee"] as const).map((id) => [id, { x: 0, y: 0 }])
) as Record<PartId, { x: number; y: number }>;
const HIGHLIGHT = new THREE.Color("#d9a35b");

// Hold each pose while its section is centred, move between sections.
const plateau = (f: number) => {
  const t = clamp01((f - 0.18) / 0.64);
  return t * t * (3 - 2 * t);
};

function sampleScalar(values: number[], s: number): number {
  const max = values.length - 1;
  const c = Math.min(max, Math.max(0, s));
  const i = Math.min(max - 1, Math.floor(c));
  return values[i] + (values[i + 1] - values[i]) * plateau(c - i);
}

function sample(keys: Key[], s: number): Key {
  const max = keys.length - 1;
  const c = Math.min(max, Math.max(0, s));
  const i = Math.min(max - 1, Math.floor(c));
  const t = plateau(c - i);
  const a = keys[i];
  const b = keys[i + 1];
  const out = { ...a };
  for (const k of Object.keys(a) as (keyof Key)[]) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

function paintLabel(tex: THREE.CanvasTexture, flavour: Flavour, assets: NonNullable<Anim["assets"]>) {
  drawLabel(tex.image as HTMLCanvasElement, flavour, assets.fonts, assets.logo);
  tex.needsUpdate = true;
}

function makeRibbon(points: [number, number, number][], radius: number, radial: number) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
    false,
    "centripetal"
  );
  const tubular = 240;
  const geometry = new THREE.TubeGeometry(curve, tubular, 1, radial, false);
  const pos = geometry.attributes.position;
  const centre = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    curve.getPointAt(t, centre);
    const taper = (0.22 + 0.78 * Math.pow(Math.sin(Math.PI * t), 0.6)) * (0.85 + 0.15 * Math.sin(t * 11));
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, k).sub(centre).multiplyScalar(radius * taper).add(centre);
      pos.setXYZ(k, v.x, v.y, v.z);
    }
  }
  geometry.computeVertexNormals();
  return { geometry, curve, endRadius: radius * 0.22 };
}

/** Droplets trailing off both open ends of a ribbon. */
function makeDrops(curve: THREE.CatmullRomCurve3, endRadius: number) {
  const out: { p: THREE.Vector3; r: number; phase: number }[] = [];
  for (const [t, dir] of [
    [0, -1],
    [1, 1],
  ] as const) {
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).multiplyScalar(dir);
    out.push({ p: p.clone(), r: endRadius * 1.05, phase: 0 });
    [0.14, 0.3, 0.48].forEach((d, i) => {
      out.push({
        p: p.clone().addScaledVector(tangent, d).add(new THREE.Vector3(0, (i - 1) * 0.03, 0)),
        r: endRadius * (0.9 - i * 0.22),
        phase: i * 1.7 + t * 3,
      });
    });
  }
  return out;
}

function makeBeanGeometry() {
  const g = new THREE.SphereGeometry(1, 20, 14);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) * 0.62;
    let y = p.getY(i) * 0.42;
    const z = p.getZ(i) * 0.9;
    if (y > 0) y -= 0.17 * Math.exp(-(x * x) / 0.008) * (1 - Math.min(1, Math.abs(z) / 0.95));
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  g.scale(0.16, 0.16, 0.16);
  return g;
}

function makeLidGeometry() {
  const g = new THREE.CylinderGeometry(0.735, 0.735, 0.3, 192, 6, false);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (Math.hypot(x, z) < 0.7 || Math.abs(y) > 0.11) continue;
    const k = 1 + 0.011 * Math.max(0, Math.cos(Math.atan2(x, z) * 90));
    pos.setXYZ(i, x * k, y, z * k);
  }
  g.computeVertexNormals();
  return g;
}

export default function JarScene({ active, lowPower, ...rest }: Props) {
  const adaptive = useAdaptiveDpr(lowPower);
  return (
    <Canvas
      className="stage__canvas"
      dpr={adaptive.dpr}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: !lowPower, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: FOV, position: [0, 0.12, 9], near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <PerformanceMonitor flipflops={3} onChange={adaptive.onChange} onFallback={adaptive.onFallback} />
      <Scene lowPower={lowPower} {...rest} />
    </Canvas>
  );
}

function Scene({ stateRef, partsRef, flavour, lowPower, onReady }: Omit<Props, "active">) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const anim = useRef<Anim>({ ready: false, warm: false, announced: false, introStart: -1, intro: 0, spinStart: -1, pending: null, assets: null });
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const pose = useRef<Key | null>(null);
  const labelsShown = useRef(false);
  const initialFlavour = useRef(flavour);
  const glow = useRef<Record<PartId, number>>({ lid: 0, label: 0, glass: 0, sweetener: 0, creamer: 0, coffee: 0 });

  const root = useRef<THREE.Group>(null);
  const jar = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const labelMesh = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const layerMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const ribbons = useRef<THREE.Group>(null);
  const coffeeSpin = useRef<THREE.Group>(null);
  const milkSpin = useRef<THREE.Group>(null);
  const coffeeMesh = useRef<THREE.Mesh>(null);
  const milkMesh = useRef<THREE.Mesh>(null);
  const coffeeDrops = useRef<THREE.InstancedMesh>(null);
  const milkDrops = useRef<THREE.InstancedMesh>(null);
  const powderColor = useRef(new THREE.Color(getFlavour(flavour)?.label.powder ?? "#B98A5A"));
  const powderTarget = useRef(new THREE.Color(getFlavour(flavour)?.label.powder ?? "#B98A5A"));
  const layerColors = useMemo(() => LAYERS.map((l) => new THREE.Color(l.color)), []);

  const labelTex = useMemo(() => {
    const tex = canvasTexture(LABEL_W, LABEL_H, () => {});
    tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return tex;
  }, [gl]);
  const powderTex = useMemo(() => {
    const tex = canvasTexture(512, 512, drawPowder);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1.2);
    return tex;
  }, []);
  const shadowTex = useMemo(() => canvasTexture(256, 256, drawShadow), []);

  const glassGeo = useMemo(() => {
    const profile: [number, number][] = [
      [0, -1.1],
      [0.69, -1.1],
      [0.74, -1.07],
      [0.755, -1.0],
      [0.755, 0.86],
      [0.74, 0.93],
      [0.7, 0.98],
      [0.69, 1.0],
      [0.69, 1.06],
    ];
    return new THREE.LatheGeometry(
      profile.map(([x, y]) => new THREE.Vector2(x, y)),
      96
    );
  }, []);
  const labelGeo = useMemo(() => {
    const len = TAU * 0.92;
    return new THREE.CylinderGeometry(0.762, 0.762, 1.34, 128, 1, true, -len / 2, len);
  }, []);
  const layerGeo = useMemo(() => new THREE.CylinderGeometry(0.722, 0.722, LAYER_H, 72), []);
  const miniPowderGeo = useMemo(() => new THREE.CylinderGeometry(0.722, 0.722, POWDER_HEIGHT, 48), []);
  const miniTextures = useMemo(() => MINI_FLAVOURS.map(() => canvasTexture(1024, 320, () => {})), []);
  const miniRefs = useRef<(THREE.Group | null)[]>([]);
  const lidGeo = useMemo(() => makeLidGeometry(), []);
  const coffee = useMemo(() => makeRibbon(COFFEE_PATH, 0.085, lowPower ? 10 : 18), [lowPower]);
  const milk = useMemo(() => makeRibbon(MILK_PATH, 0.06, lowPower ? 10 : 18), [lowPower]);
  const coffeeDropData = useMemo(() => makeDrops(coffee.curve, coffee.endRadius), [coffee]);
  const milkDropData = useMemo(() => makeDrops(milk.curve, milk.endRadius), [milk]);

  // Load fonts + logo once, then paint the first label and start the intro.
  useEffect(() => {
    let cancelled = false;
    const fonts = readFonts();
    Promise.all([ensureFonts(fonts), loadImage(textureUrl(LOGO_IMAGE, 640))]).then(([, logo]) => {
      if (cancelled) return;
      const a = anim.current;
      a.assets = { fonts, logo };
      const f = getFlavour(initialFlavour.current);
      if (f) paintLabel(labelTex, f, a.assets);
      const scratch = document.createElement("canvas");
      scratch.width = LABEL_W;
      scratch.height = LABEL_H;
      MINI_FLAVOURS.forEach((id, i) => {
        const mf = getFlavour(id);
        if (mf && a.assets) paintMini(miniTextures[i], scratch, mf, a.assets);
      });
      a.ready = true;
      onReady();
      // Build the open-jar, range and ribbon shaders now, while the intro still covers the page.
      warmUp(gl, scene, camera, [labelTex, powderTex, shadowTex, ...miniTextures]).then(() => {
        a.warm = true;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, labelTex, powderTex, shadowTex, miniTextures, onReady]);

  // Flavour change: spin the jar once and swap the label while its back faces the camera.
  useEffect(() => {
    const f = getFlavour(flavour);
    const a = anim.current;
    if (!f || !a.assets || initialFlavour.current === flavour) return;
    initialFlavour.current = flavour;
    a.pending = f;
    a.spinStart = -2;
  }, [flavour]);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(
    () => () => {
      [labelTex, powderTex, shadowTex, ...miniTextures].forEach((t) => t.dispose());
      [glassGeo, labelGeo, layerGeo, miniPowderGeo, lidGeo, coffee.geometry, milk.geometry].forEach((g) => g.dispose());
    },
    [labelTex, powderTex, shadowTex, miniTextures, glassGeo, labelGeo, layerGeo, miniPowderGeo, lidGeo, coffee, milk]
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const a = anim.current;
    const now = state.clock.elapsedTime;
    const s = stateRef.current?.s ?? 0;
    const hover = stateRef.current?.hover ?? null;

    // Tell the intro the hero is ready once this first frame (shaders compiled) has been drawn.
    if (a.ready && a.warm && !a.announced) {
      a.announced = true;
      requestAnimationFrame(announceHeroReady);
    }
    // Start the jar's entrance once its label is painted and the page intro has opened.
    if (a.ready && a.introStart < 0 && !document.documentElement.classList.contains("intro-active")) a.introStart = now;
    // Short and front-loaded: the jar is most of the way up while the intro doors are still opening.
    const intro = easeOutQuart(a.introStart < 0 ? 0 : clamp01((now - a.introStart) / 1.05));
    a.intro = intro;

    // Flavour spin
    if (a.spinStart === -2) a.spinStart = now;
    let spin = 0;
    if (a.spinStart >= 0) {
      const t = (now - a.spinStart) / 1.1;
      if (t >= 0.5 && a.pending && a.assets) {
        paintLabel(labelTex, a.pending, a.assets);
        powderTarget.current.set(a.pending.label.powder);
        a.pending = null;
      }
      if (t >= 1) a.spinStart = -1;
      else spin = -TAU * easeInOutCubic(t);
    }
    powderColor.current.lerp(powderTarget.current, 1 - Math.exp(-dt * 4));

    // Pose for the current scroll position
    const aspect = state.size.width / Math.max(1, state.size.height);
    const stacked = isStacked(state.size.width, state.size.height);
    const keys = stacked ? MOBILE : aspect < 1.25 ? TABLET : DESKTOP;
    const target = sample(keys, s);
    if (stacked) {
      const fit = stackedFit(state.size.width, state.size.height);
      target.scale *= fit;
      target.y += sampleScalar(MOBILE_LIFT, s) * (1 - fit) * 0.35;
    } else {
      if (keys === DESKTOP) {
        target.x += Math.min(0.07, Math.max(0, (1.75 - aspect) * 0.16)) * sampleScalar(DESKTOP_NUDGE, s);
      }
      // Short laptop screens: the range copy takes more of the height, so its jars shrink a little.
      const short = 1 - Math.min(1, Math.max(0.84, state.size.height / 800));
      target.scale *= 1 - short * sampleScalar(RANGE_ONLY, s);
    }
    if (!pose.current) pose.current = { ...target };
    const p = pose.current;
    for (const k of Object.keys(target) as (keyof Key)[]) p[k] = THREE.MathUtils.damp(p[k], target[k], 4.2, dt);
    const e = easeInOutCubic(clamp01(p.explode));

    const ptr = pointer.current;
    ptr.sx = THREE.MathUtils.damp(ptr.sx, ptr.x, 3, dt);
    ptr.sy = THREE.MathUtils.damp(ptr.sy, ptr.y, 3, dt);

    const cam = state.camera;
    cam.position.set(ptr.sx * 0.22, 0.12 - ptr.sy * 0.14, p.cam);
    cam.lookAt(ptr.sx * 0.08, 0, 0);
    cam.updateMatrixWorld();

    const halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * p.cam;
    const halfW = halfH * aspect;
    if (root.current) {
      root.current.position.set(p.x * halfW, p.y * halfH - (1 - intro) * 1.9 + Math.sin(now * 0.8) * 0.035, 0);
      root.current.scale.setScalar(p.scale * (0.86 + 0.14 * intro));
    }
    if (jar.current) {
      jar.current.rotation.set(
        p.pitch + ptr.sy * 0.07 + Math.sin(now * 0.6) * 0.015,
        p.rot + spin + ptr.sx * 0.24 - (1 - intro) * 1.6,
        p.tilt + Math.sin(now * 0.5) * 0.01
      );
    }

    // Exploded view
    if (lid.current) {
      lid.current.position.y = LID_LIFT * e;
      lid.current.rotation.y = Math.PI * 0.9 * e;
    }
    if (body.current) body.current.position.y = BODY_LIFT * e;
    if (labelMesh.current) {
      const k = 1 + LABEL_SPREAD * e;
      labelMesh.current.scale.set(k, 1, k);
    }
    LAYERS.forEach((layer, i) => {
      const m = layerMeshes.current[i];
      if (!m) return;
      m.position.y = layer.assembled + (layer.exploded - layer.assembled) * e;
      const r = 1 - 0.08 * e;
      m.scale.set(r, 1 - 0.3 * e, r);
      m.rotation.y = e * (i + 1) * 0.6;
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.color.copy(powderColor.current).lerp(layerColors[i], e);
    });
    if (shadow.current) (shadow.current.material as THREE.MeshBasicMaterial).opacity = 1 - e;

    // The range: other flavours fly in around the hero jar
    const rangeVis = smooth(2.4, 2.92, s) * (1 - smooth(3.3, 3.8, s)) * intro;
    const spread = Math.min(1, Math.max(0.45, aspect / 1.6));
    MINI_SLOTS.forEach((slot, i) => {
      const g = miniRefs.current[i];
      if (!g) return;
      g.visible = rangeVis > 0.01;
      const t = easeOutCubic(rangeVis);
      g.position.set(slot.x * spread * t, -0.05 + Math.sin(now * 0.9 + i * 1.3) * 0.05, -3.5 + (slot.z + 3.5) * t);
      g.scale.setScalar(slot.s * (0.55 + 0.45 * t));
      g.rotation.set(0, -0.3 * Math.sign(slot.x) + Math.sin(now * 0.5 + i) * 0.18 + (1 - t) * 2, 0);
    });

    // Hover highlight (exploded view)
    const glows = glow.current;
    for (const id of PART_IDS) glows[id] = THREE.MathUtils.damp(glows[id], hover === id && e > 0.5 ? 1 : 0, 8, dt);
    const setGlow = (mat: THREE.Material | THREE.Material[] | undefined, amount: number) => {
      const m = mat as THREE.MeshStandardMaterial | undefined;
      if (!m || !("emissive" in m)) return;
      m.emissive.copy(HIGHLIGHT);
      m.emissiveIntensity = amount * 0.45;
    };
    lid.current?.children.forEach((c) => setGlow((c as THREE.Mesh).material, glows.lid));
    setGlow(labelMesh.current?.material, glows.label);
    body.current?.children.forEach((c) => c !== labelMesh.current && setGlow((c as THREE.Mesh).material, glows.glass));
    LAYERS.forEach((l, i) => setGlow(layerMeshes.current[i]?.material, glows[l.id]));

    // Project callouts onto the DOM
    const parts = partsRef.current;
    const jarObj = jar.current;
    const visible = clamp01((e - 0.72) / 0.22);
    // Only touch the DOM while the callouts are (or just stopped being) visible.
    if (parts && jarObj && (visible > 0 || labelsShown.current)) {
      labelsShown.current = visible > 0;
      const w = state.size.width;
      const h = state.size.height;
      scratchRight.setFromMatrixColumn(cam.matrixWorld, 0).normalize();
      const worldScale = root.current?.scale.x ?? 1;
      // Leader lines run from each part's right edge to one shared text column.
      let column = 0;
      for (const id of PART_IDS) {
        const anchor = partAnchor(id, e);
        jarObj.localToWorld(scratchV.set(0, anchor.y, 0));
        scratchV.addScaledVector(scratchRight, anchor.r * worldScale * 1.04).project(cam);
        const x = (scratchV.x * 0.5 + 0.5) * w;
        const y = (-scratchV.y * 0.5 + 0.5) * h;
        projected[id].x = x;
        projected[id].y = y;
        column = Math.max(column, x);
      }
      column += Math.min(56, w * 0.05);
      for (const id of PART_IDS) {
        const el = parts[id];
        if (!el) continue;
        const { x, y } = projected[id];
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        el.style.setProperty("--len", `${(column - x).toFixed(1)}px`);
        el.style.opacity = visible.toFixed(3);
        el.style.visibility = visible > 0.02 ? "visible" : "hidden";
      }
    }

    // Liquid swirls: pour in with the intro, hide while the jar is open.
    const heroVis = 1 - clamp01(s / 0.7);
    const flavourVis = clamp01((s - 3.35) / 0.6) * 0.6;
    const vis = Math.max(heroVis, flavourVis) * clamp01(intro * 1.4) * (1 - e);
    const pour = a.introStart < 0 ? 0 : easeOutCubic(clamp01((now - a.introStart - 0.1) / 1.25));
    if (ribbons.current) ribbons.current.visible = vis > 0.01;
    if (coffeeSpin.current) coffeeSpin.current.rotation.y = now * 0.22;
    if (milkSpin.current) milkSpin.current.rotation.y = -now * 0.16;
    for (const mesh of [coffeeMesh.current, milkMesh.current]) {
      if (!mesh) continue;
      const idx = mesh.geometry.index;
      if (idx) mesh.geometry.setDrawRange(0, Math.floor(idx.count * pour));
      (mesh.material as THREE.MeshPhysicalMaterial).opacity = vis;
    }
    const dropScale = clamp01((pour - 0.85) * 6);
    for (const [mesh, data] of [
      [coffeeDrops.current, coffeeDropData],
      [milkDrops.current, milkDropData],
    ] as const) {
      if (!mesh) continue;
      data.forEach((d, i) => {
        scratchObject.position.set(d.p.x, d.p.y + Math.sin(now * 1.2 + d.phase) * 0.025, d.p.z);
        scratchObject.scale.setScalar(d.r * dropScale);
        scratchObject.updateMatrix();
        mesh.setMatrixAt(i, scratchObject.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      (mesh.material as THREE.MeshPhysicalMaterial).opacity = vis;
    }
  });

  return (
    <>
      <ambientLight intensity={0.35} color="#ffe9d2" />
      <directionalLight position={[4, 5, 6]} intensity={2.1} color="#fff1e0" />
      <directionalLight position={[-5, 2, -4]} intensity={2.6} color="#ffc98f" />
      <pointLight position={[0, -3, 3]} intensity={6} distance={9} color="#ffb877" />

      <Environment resolution={lowPower ? 128 : 256} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#fff4e6" position={[0, 5, 4]} scale={[9, 2.5, 1]} />
        <Lightformer form="rect" intensity={4.5} color="#ffffff" position={[-5, 0.5, 2]} scale={[0.7, 9, 1]} />
        <Lightformer form="rect" intensity={2} color="#ffe2c2" position={[5, 0, 1.5]} scale={[0.45, 9, 1]} />
        <Lightformer form="ring" intensity={2.2} color="#c58a4c" position={[0, 1, -7]} scale={7} />
      </Environment>

      <group ref={root}>
        <group ref={jar}>
          {/* Powder: the three parts of the 3-in-1 mix */}
          {LAYERS.map((layer, i) => (
            <mesh
              key={layer.id}
              ref={(m) => {
                layerMeshes.current[i] = m;
              }}
              geometry={layerGeo}
              position={[0, layer.assembled, 0]}
              renderOrder={1}
            >
              <meshStandardMaterial map={powderTex} roughness={0.95} metalness={0} />
            </mesh>
          ))}

          <group ref={body}>
            <mesh ref={labelMesh} geometry={labelGeo} position={[0, -0.12, 0]} renderOrder={2}>
              <meshPhysicalMaterial map={labelTex} roughness={0.5} metalness={0} clearcoat={0.35} clearcoatRoughness={0.4} />
            </mesh>
            <mesh geometry={glassGeo} renderOrder={3}>
              <meshPhysicalMaterial
                color="#ffffff"
                transparent
                opacity={0.2}
                roughness={0.04}
                metalness={0}
                clearcoat={1}
                clearcoatRoughness={0.03}
                envMapIntensity={2.2}
                depthWrite={false}
              />
            </mesh>
          </group>

          <group ref={lid}>
            <mesh geometry={lidGeo} position={[0, 1.12, 0]}>
              <meshPhysicalMaterial color="#141110" roughness={0.3} metalness={0.15} clearcoat={0.6} clearcoatRoughness={0.18} />
            </mesh>
            <mesh position={[0, 1.27, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.713, 0.024, 12, 128]} />
              <meshPhysicalMaterial color="#1a1614" roughness={0.25} metalness={0.2} clearcoat={0.8} />
            </mesh>
          </group>
        </group>

        {MINI_FLAVOURS.map((id, i) => (
          <group
            key={id}
            ref={(g) => {
              miniRefs.current[i] = g;
            }}
            visible={false}
          >
            <mesh geometry={miniPowderGeo} position={[0, -0.115, 0]}>
              <meshStandardMaterial map={powderTex} color={getFlavour(id)?.label.powder} roughness={0.95} />
            </mesh>
            <mesh geometry={labelGeo} position={[0, -0.12, 0]}>
              <meshPhysicalMaterial map={miniTextures[i]} roughness={0.5} clearcoat={0.35} clearcoatRoughness={0.4} />
            </mesh>
            <mesh geometry={glassGeo} renderOrder={3}>
              <meshPhysicalMaterial color="#ffffff" transparent opacity={0.18} roughness={0.05} clearcoat={1} envMapIntensity={2} depthWrite={false} />
            </mesh>
            <mesh geometry={lidGeo} position={[0, 1.12, 0]}>
              <meshPhysicalMaterial color="#141110" roughness={0.3} metalness={0.15} clearcoat={0.6} />
            </mesh>
          </group>
        ))}

        <mesh ref={shadow} position={[0, -1.22, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={0}>
          <planeGeometry args={[3.4, 3.4]} />
          <meshBasicMaterial map={shadowTex} transparent depthWrite={false} toneMapped={false} />
        </mesh>

        <group ref={ribbons} position={[0, -0.2, 0]} rotation={[SWIRL_TILT, 0, -0.08]}>
          <group ref={coffeeSpin}>
            <mesh ref={coffeeMesh} geometry={coffee.geometry}>
              <meshPhysicalMaterial color="#6b3b1c" roughness={0.2} clearcoat={1} clearcoatRoughness={0.08} transparent envMapIntensity={1.6} />
            </mesh>
            <instancedMesh ref={coffeeDrops} args={[undefined, undefined, coffeeDropData.length]}>
              <sphereGeometry args={[1, 16, 12]} />
              <meshPhysicalMaterial color="#6b3b1c" roughness={0.2} clearcoat={1} transparent />
            </instancedMesh>
          </group>
          <group ref={milkSpin} rotation={[0.1, 0, 0.06]}>
            <mesh ref={milkMesh} geometry={milk.geometry}>
              <meshPhysicalMaterial color="#efe2cf" roughness={0.26} clearcoat={1} clearcoatRoughness={0.1} transparent envMapIntensity={1.2} />
            </mesh>
            <instancedMesh ref={milkDrops} args={[undefined, undefined, milkDropData.length]}>
              <sphereGeometry args={[1, 16, 12]} />
              <meshPhysicalMaterial color="#efe2cf" roughness={0.26} clearcoat={1} transparent />
            </instancedMesh>
          </group>
        </group>
      </group>

      <Beans stateRef={stateRef} anim={anim} count={lowPower ? 14 : 34} />
      <Dust stateRef={stateRef} count={lowPower ? 80 : 170} />
    </>
  );
}

function Beans({ stateRef, anim, count }: { stateRef: RefObject<SceneState>; anim: RefObject<Anim>; count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => makeBeanGeometry(), []);
  const beans = useMemo(() => {
    const rand = mulberry32(11);
    return Array.from({ length: count }, () => {
      let x = (rand() * 2 - 1) * 6.2;
      const z = -5 + rand() * 7;
      // Keep the jar's neighbourhood clear of beans that would sit in front of it.
      if (z > -1 && Math.abs(x) < 1.6) x += Math.sign(x || 1) * 1.8;
      return {
        x,
        y: (rand() * 2 - 1) * 4.6,
        z,
        rx: rand() * TAU,
        ry: rand() * TAU,
        rz: rand() * TAU,
        spin: (rand() - 0.5) * 0.5,
        phase: rand() * TAU,
        speed: 0.4 + rand() * 0.5,
        scale: 0.7 + rand() * 0.6,
      };
    });
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    const s = stateRef.current?.s ?? 0;
    const intro = anim.current?.intro ?? 0;
    beans.forEach((b, i) => {
      const depth = (b.z + 5) / 7;
      let y = b.y + Math.sin(t * b.speed + b.phase) * 0.15 + s * (0.9 + depth * 1.5);
      y = ((((y + 4.6) % 9.2) + 9.2) % 9.2) - 4.6;
      scratchObject.position.set(b.x + Math.sin(t * 0.2 + b.phase) * 0.1, y, b.z);
      scratchObject.rotation.set(b.rx + t * b.spin, b.ry + t * b.spin * 0.7, b.rz);
      scratchObject.scale.setScalar(b.scale * intro);
      scratchObject.updateMatrix();
      m.setMatrixAt(i, scratchObject.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, count]}>
      <meshStandardMaterial color="#3a2114" roughness={0.38} metalness={0.08} />
    </instancedMesh>
  );
}

function Dust({ stateRef, count }: { stateRef: RefObject<SceneState>; count: number }) {
  const points = useRef<THREE.Points>(null);
  const { geometry, seeds } = useMemo(() => {
    const rand = mulberry32(23);
    const positions = new Float32Array(count * 3);
    const seeds = Array.from({ length: count }, (_, i) => {
      const seed = { x: (rand() * 2 - 1) * 7, y: (rand() * 2 - 1) * 5, z: -6 + rand() * 9, v: 0.04 + rand() * 0.08 };
      positions.set([seed.x, seed.y, seed.z], i * 3);
      return seed;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry: g, seeds };
  }, [count]);
  const texture = useMemo(() => canvasTexture(64, 64, (c) => drawSoftDot(c)), []);

  useEffect(
    () => () => {
      geometry.dispose();
      texture.dispose();
    },
    [geometry, texture]
  );

  useFrame((state) => {
    const p = points.current;
    if (!p) return;
    const attr = p.geometry.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    const s = stateRef.current?.s ?? 0;
    seeds.forEach((d, i) => {
      let y = d.y + t * d.v + s * 0.7;
      y = ((((y + 5) % 10) + 10) % 10) - 5;
      attr.setXYZ(i, d.x + Math.sin(t * 0.3 + i) * 0.08, y, d.z);
    });
    attr.needsUpdate = true;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        map={texture}
        size={0.05}
        sizeAttenuation
        transparent
        opacity={0.5}
        depthWrite={false}
        color="#f1d7b5"
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
