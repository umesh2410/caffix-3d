"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, PerformanceMonitor, RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { textureUrl } from "@/lib/assets";
import { LOGO_IMAGE } from "@/lib/catalog";
import { ensureFonts, loadImage, readFonts } from "./labelTexture";
import {
  canvasTexture,
  clamp01,
  easeInOutCubic,
  easeOutBounce,
  lerp,
  mulberry32,
  smooth,
  isStacked,
  TAU,
  useAdaptiveDpr,
  warmUp,
} from "./sceneUtils";

/** Scroll progress through the brew lab, 0 → 1 across five steps. */
export interface LabState {
  p: number;
}

interface Props {
  stateRef: RefObject<LabState>;
  tagRef: RefObject<HTMLDivElement | null>;
  active: boolean;
  lowPower: boolean;
  onReady: () => void;
}

const STEPS = 5;
const BG = "#140d08";

// Glass geometry (y up, base on the counter at y = 0)
const GLASS_FLOOR = 0.2;
const GLASS_TOP = 2.0;
const INNER_BOTTOM_R = 0.585;
const INNER_TOP_R = 0.71;
const innerRadius = (y: number) =>
  INNER_BOTTOM_R + ((INNER_TOP_R - INNER_BOTTOM_R) * (y - GLASS_FLOOR)) / (GLASS_TOP - GLASS_FLOOR);
const MILK_FULL = 1.5;

const MILK = new THREE.Color("#f4eee4");
const LATTE = new THREE.Color("#b37b4a");
const GRANULE = new THREE.Color("#3a2112");
const FOAM = new THREE.Color("#ecdcc1");

// Poses
const SACHET_IDLE = new THREE.Vector3(-1.6, 0.5, 0.35);
const SACHET_POUR = new THREE.Vector3(0.24, 2.7, 0);
const SACHET_MOUTH_LOCAL = new THREE.Vector3(0, 0.47, 0);
const PITCHER_IDLE = new THREE.Vector3(1.15, 0, -1.15);
const PITCHER_POUR = new THREE.Vector3(0.95, 2.95, 0);
const SPOUT_LOCAL = new THREE.Vector3(-0.43, 0.9, 0);
const FROTHER_IDLE = new THREE.Vector3(1.65, 0.2, 0.45);
const FROTHER_ABOVE = new THREE.Vector3(0, 2.75, 0);
const FROTHER_IN = new THREE.Vector3(0, 0.6, 0);

// Camera at the centre of each step: position + look-at target.
const CAMERA: { pos: [number, number, number]; target: [number, number, number] }[] = [
  { pos: [0.2, 2.7, 7.6], target: [0, 1.1, 0] },
  { pos: [-1.1, 3.3, 5.8], target: [-0.05, 1.7, 0] },
  { pos: [1.2, 3.1, 5.8], target: [0.35, 1.6, 0] },
  { pos: [0.3, 4.6, 4.1], target: [0, 1.25, 0] },
  { pos: [0.5, 1.7, 5.3], target: [0, 1.15, 0] },
];
// Half-width (scene units) that must stay in frame at each step: the whole kit, then close-ups.
const FOCUS_HALF_WIDTH = [2.15, 1.25, 1.3, 1.0, 1.0];
const FOCUS_STACKED = [1.6, 1.15, 1.2, 0.95, 0.95];
const sachetIdle = SACHET_IDLE.clone();
const pitcherIdle = PITCHER_IDLE.clone();
const frotherIdle = FROTHER_IDLE.clone();
const MAX_PULL = 7;

const tmpV = new THREE.Vector3();
const tmpV2 = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();
const tmpObj = new THREE.Object3D();
const tmpColor = new THREE.Color();

/** Frustum (open top) whose profile is updated in place as liquid levels change. */
function makeFrustum(segments = 48) {
  const g = new THREE.LatheGeometry(
    [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, 1)],
    segments
  );
  return g;
}
function setFrustum(g: THREE.BufferGeometry, yb: number, yt: number, rb: number, rt: number) {
  // Skip the rebuild (and normal recompute) when nothing moved since last frame.
  const key = `${yb.toFixed(4)}|${yt.toFixed(4)}|${rb.toFixed(4)}|${rt.toFixed(4)}`;
  if (g.userData.key === key) return;
  g.userData.key = key;
  const pos = g.attributes.position as THREE.BufferAttribute;
  const segments = pos.count / 3;
  for (let i = 0; i < segments; i++) {
    const phi = (i / (segments - 1)) * TAU;
    const s = Math.sin(phi);
    const c = Math.cos(phi);
    pos.setXYZ(i * 3, 0, yb, 0);
    pos.setXYZ(i * 3 + 1, rb * s, yb, rb * c);
    pos.setXYZ(i * 3 + 2, rt * s, yt, rt * c);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  g.computeBoundingSphere();
}

/** Bends the liquid surface into a vortex (plus ripples while spinning and a bumpy foam head). */
function shapeSurface(
  g: THREE.BufferGeometry,
  base: Float32Array,
  vortex: number,
  ripple: number,
  foamy: boolean,
  now: number
) {
  // A still surface only needs rebuilding when it switches between flat and foamy.
  const still = vortex < 0.0005 && ripple < 0.00002;
  const key = still ? `still|${foamy}` : "moving";
  if (still && g.userData.key === key) return;
  g.userData.key = key;
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3];
    const z = base[i * 3 + 2];
    const d = Math.min(1, Math.hypot(x, z));
    const wave = Math.sin(d * 14 - now * 6) * ripple;
    const bump = foamy ? Math.sin(x * 40) * Math.cos(z * 37) * 0.006 : 0;
    pos.setY(i, -vortex * Math.pow(1 - d, 2) + wave + bump);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
}

function makeGlass() {
  const profile: [number, number][] = [
    [0, 0],
    [0.6, 0],
    [0.625, 0.025],
    [0.745, GLASS_TOP],
    [INNER_TOP_R, GLASS_TOP],
    [INNER_BOTTOM_R, GLASS_FLOOR],
    [0, GLASS_FLOOR - 0.01],
  ];
  return new THREE.LatheGeometry(
    profile.map(([x, y]) => new THREE.Vector2(x, y)),
    96
  );
}

function makePitcher() {
  const profile: [number, number][] = [
    [0, 0],
    [0.34, 0],
    [0.38, 0.05],
    [0.42, 0.86],
    [0.44, 0.9],
    [0.41, 0.9],
    [0.39, 0.86],
    [0.355, 0.08],
    [0, 0.1],
  ];
  return new THREE.LatheGeometry(
    profile.map(([x, y]) => new THREE.Vector2(x, y)),
    64
  );
}

function makeSachet() {
  const g = new THREE.BoxGeometry(0.62, 0.95, 0.06, 16, 20, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / 0.31;
    const y = p.getY(i) / 0.475;
    const z = p.getZ(i);
    const bulge = (1 - x * x) * (1 - y * y) * 0.07;
    p.setZ(i, z + Math.sign(z) * bulge);
  }
  g.computeVertexNormals();
  return g;
}

/** Spring coil around a ring, like a milk-frother whisk. */
function makeWhisk() {
  const pts: THREE.Vector3[] = [];
  const turns = 46;
  const steps = 900;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * TAU;
    const b = t * TAU * turns;
    const r = 0.15 + 0.032 * Math.cos(b);
    pts.push(new THREE.Vector3(r * Math.cos(a), 0.032 * Math.sin(b), r * Math.sin(a)));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), steps, 0.006, 5, true);
}

function drawMarble(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#ece6dd");
  g.addColorStop(1, "#d8d0c4");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const rand = mulberry32(3);
  for (let v = 0; v < 26; v++) {
    ctx.beginPath();
    let x = rand() * W;
    let y = rand() * H;
    ctx.moveTo(x, y);
    for (let s = 0; s < 8; s++) {
      x += (rand() - 0.3) * 220;
      y += (rand() - 0.5) * 160;
      ctx.quadraticCurveTo(x + (rand() - 0.5) * 120, y + (rand() - 0.5) * 120, x, y);
    }
    ctx.strokeStyle = `rgba(${110 + rand() * 40},${100 + rand() * 30},${90 + rand() * 30},${0.08 + rand() * 0.18})`;
    ctx.lineWidth = 0.6 + rand() * 2.4;
    ctx.stroke();
  }
}

function drawSwirl(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width: W } = canvas;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, W);
  ctx.translate(W / 2, W / 2);
  for (let arm = 0; arm < 5; arm++) {
    ctx.beginPath();
    for (let i = 0; i < 220; i++) {
      const t = i / 220;
      const a = arm * (TAU / 5) + t * TAU * 1.6;
      const r = t * W * 0.5;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(120,80,45,0.35)";
    ctx.lineWidth = 10;
    ctx.stroke();
  }
}

function drawGranules(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  const rand = mulberry32(9);
  for (let i = 0; i < 9000; i++) {
    const v = 120 + rand() * 135;
    ctx.fillStyle = `rgb(${v},${v - 10},${v - 25})`;
    ctx.fillRect(rand() * W, rand() * H, 2 + rand() * 3, 2 + rand() * 3);
  }
}

async function drawSachetLabel(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const fonts = readFonts();
  const [, logo] = await Promise.all([ensureFonts(fonts), loadImage(textureUrl(LOGO_IMAGE, 640))]);
  const { width: W, height: H } = canvas;
  ctx.fillStyle = "#3a2315";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  for (let y = 0; y < H; y += 8) ctx.fillRect(0, y, W, 2);
  // Tear notch
  ctx.strokeStyle = "rgba(247,240,228,0.55)";
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(24, 70);
  ctx.lineTo(W - 24, 70);
  ctx.stroke();
  ctx.setLineDash([]);
  if (logo) {
    const lw = W * 0.72;
    ctx.drawImage(logo, (W - lw) / 2, H * 0.22, lw, (logo.naturalHeight / logo.naturalWidth) * lw);
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#d9a35b";
  ctx.font = `italic 400 64px ${fonts.serif}`;
  ctx.fillText("Hazelnut", W / 2, H * 0.62);
  ctx.fillStyle = "#f4ebdd";
  ctx.font = `700 26px ${fonts.sans}`;
  ctx.letterSpacing = "8px";
  ctx.fillText("COLD COFFEE", W / 2, H * 0.72);
  ctx.font = `600 22px ${fonts.sans}`;
  ctx.fillText("SINGLE SERVE", W / 2, H * 0.9);
  ctx.letterSpacing = "0px";
}

export default function BrewLabScene({ active, lowPower, ...rest }: Props) {
  const adaptive = useAdaptiveDpr(lowPower);
  return (
    <Canvas
      className="lab__canvas"
      dpr={adaptive.dpr}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: !lowPower, powerPreference: "high-performance" }}
      camera={{ fov: 32, position: CAMERA[0].pos, near: 0.1, far: 60 }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
        scene.background = new THREE.Color(BG);
        scene.fog = new THREE.Fog(BG, 9, 17);
      }}
    >
      <PerformanceMonitor flipflops={3} onChange={adaptive.onChange} onFallback={adaptive.onFallback} />
      <Lab lowPower={lowPower} {...rest} />
    </Canvas>
  );
}

function Lab({ stateRef, tagRef, lowPower, onReady }: Omit<Props, "active">) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const cam = useRef({ pos: new THREE.Vector3(...CAMERA[0].pos), target: new THREE.Vector3(...CAMERA[0].target) });
  const motion = useRef({ spin: 0, spinSpeed: 0, vortex: 0, swirl: 0, p: -1 });
  const pointer = useRef({ x: 0, y: 0 });

  const glassGeo = useMemo(() => makeGlass(), []);
  const pitcherGeo = useMemo(() => makePitcher(), []);
  const sachetGeo = useMemo(() => makeSachet(), []);
  const whiskGeo = useMemo(() => makeWhisk(), []);
  const granuleGeo = useMemo(() => makeFrustum(), []);
  const liquidGeo = useMemo(() => makeFrustum(), []);
  const foamGeo = useMemo(() => makeFrustum(), []);
  const surfaceGeo = useMemo(() => {
    const g = new THREE.RingGeometry(0.001, 1, 64, 10);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const surfaceBase = useMemo(() => Float32Array.from(surfaceGeo.attributes.position.array), [surfaceGeo]);

  const marbleTex = useMemo(() => {
    const t = canvasTexture(1024, 1024, drawMarble);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return t;
  }, [gl]);
  const swirlTex = useMemo(() => {
    const t = canvasTexture(512, 512, drawSwirl);
    t.center.set(0.5, 0.5);
    return t;
  }, []);
  const granuleTex = useMemo(() => {
    const t = canvasTexture(256, 256, drawGranules);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(5, 1);
    return t;
  }, []);
  const sachetTex = useMemo(() => canvasTexture(310, 475, () => {}), []);

  // Falling granules and condensation droplets
  const granules = useMemo(() => {
    const rand = mulberry32(17);
    return Array.from({ length: lowPower ? 90 : 180 }, () => ({
      start: 0.26 + rand() * 0.46,
      dur: 0.1 + rand() * 0.06,
      dx: (rand() - 0.5) * 0.18,
      dz: (rand() - 0.5) * 0.18,
      ex: (rand() - 0.5) * 0.75,
      ez: (rand() - 0.5) * 0.75,
      rot: rand() * TAU,
      s: 0.6 + rand() * 0.8,
    }));
  }, [lowPower]);
  const droplets = useMemo(() => {
    const rand = mulberry32(29);
    return Array.from({ length: lowPower ? 40 : 90 }, () => {
      const y = 0.35 + rand() * 1.35;
      const a = rand() * TAU;
      const r = 0.6 + ((0.745 - 0.6) * y) / GLASS_TOP + 0.012;
      return { p: new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r), s: 0.008 + rand() * 0.016, delay: rand() * 0.5 };
    });
  }, [lowPower]);
  const ice = useMemo(
    () => [
      { x: -0.22, z: 0.12, land: 0.12, rot: [0.4, 0.3, 0.2] },
      { x: 0.24, z: -0.1, land: 0.26, rot: [0.1, 0.9, 0.5] },
      { x: 0.02, z: 0.28, land: 0.4, rot: [0.7, 0.2, 0.9] },
      { x: 0.08, z: -0.3, land: 0.54, rot: [0.3, 1.2, 0.1] },
    ],
    []
  );

  const granuleMesh = useRef<THREE.Mesh>(null);
  const liquidMesh = useRef<THREE.Mesh>(null);
  const foamMesh = useRef<THREE.Mesh>(null);
  const surfaceMesh = useRef<THREE.Mesh>(null);
  const liquidMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const surfaceMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const sachet = useRef<THREE.Group>(null);
  const pitcher = useRef<THREE.Group>(null);
  const stream = useRef<THREE.Mesh>(null);
  const frother = useRef<THREE.Group>(null);
  const whisk = useRef<THREE.Mesh>(null);
  const granuleInst = useRef<THREE.InstancedMesh>(null);
  const dropletInst = useRef<THREE.InstancedMesh>(null);
  const iceRefs = useRef<(THREE.Group | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    drawSachetLabel(sachetTex.image as HTMLCanvasElement).then(() => {
      if (cancelled) return;
      sachetTex.needsUpdate = true;
      onReady();
      // The milk, foam, ice and droplets start hidden; build their shaders now rather than mid-scroll.
      warmUp(gl, scene, camera, [marbleTex, swirlTex, granuleTex, sachetTex]);
    });
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, marbleTex, swirlTex, granuleTex, sachetTex, onReady]);

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
      [glassGeo, pitcherGeo, sachetGeo, whiskGeo, granuleGeo, liquidGeo, foamGeo, surfaceGeo].forEach((g) => g.dispose());
      [marbleTex, swirlTex, granuleTex, sachetTex].forEach((t) => t.dispose());
    },
    [glassGeo, pitcherGeo, sachetGeo, whiskGeo, granuleGeo, liquidGeo, foamGeo, surfaceGeo, marbleTex, swirlTex, granuleTex, sachetTex]
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const now = state.clock.elapsedTime;
    const m = motion.current;
    // Ease toward the scroll position so separate wheel notches still read as one continuous pour.
    const target = clamp01(stateRef.current?.p ?? 0);
    m.p = m.p < 0 ? target : THREE.MathUtils.damp(m.p, target, 7, dt);
    const k = m.p * STEPS;
    // Phones/portrait tablets: gather the kit closer to the glass so the opening shot fits.
    const stacked = isStacked(state.size.width, state.size.height);
    const gather = stacked ? 0.68 : 1;
    sachetIdle.set(SACHET_IDLE.x * gather, SACHET_IDLE.y, SACHET_IDLE.z);
    pitcherIdle.set(PITCHER_IDLE.x * gather, PITCHER_IDLE.y, PITCHER_IDLE.z);
    frotherIdle.set(FROTHER_IDLE.x * gather, FROTHER_IDLE.y, FROTHER_IDLE.z);
    const u = (i: number) => clamp01(k - i);
    const u1 = u(1);
    const u2 = u(2);
    const u3 = u(3);
    const u4 = u(4);

    // ---- Contents of the glass (pure functions of scroll, so scrubbing works both ways)
    const g = 0.16 * smooth(0.3, 0.8, u1) * (1 - smooth(0.42, 0.85, u3));
    const milkLevel = lerp(GLASS_FLOOR, MILK_FULL, smooth(0.22, 0.85, u2));
    const mix = smooth(0.42, 0.85, u3);
    const foam = 0.12 * smooth(0.55, 0.95, u3);
    const hasMilk = milkLevel > GLASS_FLOOR + g + 0.005;
    const level = hasMilk ? milkLevel : GLASS_FLOOR + g;

    if (granuleMesh.current) {
      granuleMesh.current.visible = g > 0.002;
      setFrustum(granuleGeo, GLASS_FLOOR, GLASS_FLOOR + g, INNER_BOTTOM_R - 0.004, innerRadius(GLASS_FLOOR + g) - 0.004);
    }
    if (liquidMesh.current) {
      liquidMesh.current.visible = hasMilk;
      setFrustum(liquidGeo, GLASS_FLOOR + g, level, innerRadius(GLASS_FLOOR + g) - 0.004, innerRadius(level) - 0.004);
    }
    tmpColor.copy(MILK).lerp(LATTE, mix);
    liquidMat.current?.color.copy(tmpColor);
    if (foamMesh.current) {
      foamMesh.current.visible = foam > 0.004;
      setFrustum(foamGeo, level, level + foam, innerRadius(level) - 0.004, innerRadius(level + foam) - 0.004);
    }

    // Surface with a vortex while the frother spins
    const frotherInside = u3 > 0.32 && u3 < 0.88;
    m.spinSpeed = THREE.MathUtils.damp(m.spinSpeed, frotherInside ? 42 : 0, 3, dt);
    m.spin += m.spinSpeed * dt;
    m.vortex = THREE.MathUtils.damp(m.vortex, frotherInside ? 0.22 : 0, 2.5, dt);
    m.swirl += (m.spinSpeed * 0.05 + 0.05) * dt;
    const top = level + foam;
    if (surfaceMesh.current) {
      const r = innerRadius(top) - 0.004;
      surfaceMesh.current.visible = top > GLASS_FLOOR + 0.004;
      surfaceMesh.current.position.y = top;
      surfaceMesh.current.scale.set(r, 1, r);
      shapeSurface(surfaceMesh.current.geometry, surfaceBase, m.vortex, (m.spinSpeed / 42) * 0.006, foam > 0.01, now);
      const sm = surfaceMat.current;
      if (sm) {
        if (!hasMilk) sm.color.copy(GRANULE);
        else if (foam > 0.01) sm.color.copy(tmpColor).lerp(FOAM, clamp01(foam / 0.06));
        else sm.color.copy(tmpColor);
        sm.map = hasMilk ? swirlTex : granuleTex;
        if (sm.map) sm.map.rotation = hasMilk ? -m.swirl * TAU : 0;
      }
    }

    // ---- Sachet: lift, tip and pour
    const sa = smooth(0, 0.22, u1) * (1 - smooth(0.8, 1, u1));
    if (sachet.current) {
      sachet.current.position.lerpVectors(sachetIdle, SACHET_POUR, sa);
      const pouring = u1 > 0.25 && u1 < 0.75;
      sachet.current.rotation.set(0, lerp(0.45, 0, sa), lerp(0.1, 2.4, sa) + (pouring ? Math.sin(now * 22) * 0.025 : 0));
    }
    // Granules fall from the sachet's mouth into the glass
    const gi = granuleInst.current;
    if (gi && sachet.current) {
      const mouth = tmpV.copy(SACHET_MOUTH_LOCAL);
      tmpObj.position.copy(SACHET_POUR);
      tmpObj.rotation.set(0, 0, 2.4);
      tmpObj.updateMatrix();
      mouth.applyMatrix4(tmpObj.matrix);
      granules.forEach((p, i) => {
        const t = (u1 - p.start) / p.dur;
        if (t < 0 || t > 1) {
          tmpObj.scale.setScalar(0);
        } else {
          const fall = t * t;
          tmpObj.position.set(
            lerp(mouth.x + p.dx, p.ex * 0.6, fall),
            lerp(mouth.y, GLASS_FLOOR + g, fall),
            lerp(mouth.z + p.dz, p.ez * 0.6, fall)
          );
          tmpObj.scale.setScalar(p.s);
        }
        tmpObj.rotation.set(p.rot + now, p.rot, 0);
        tmpObj.updateMatrix();
        gi.setMatrixAt(i, tmpObj.matrix);
      });
      gi.instanceMatrix.needsUpdate = true;
    }

    // ---- Milk pitcher: tilt and pour a stream
    const pa = smooth(0, 0.2, u2) * (1 - smooth(0.85, 1, u2));
    if (pitcher.current) {
      pitcher.current.position.lerpVectors(pitcherIdle, PITCHER_POUR, pa);
      pitcher.current.rotation.set(0, 0, lerp(0, 1.9, pa));
      pitcher.current.updateMatrixWorld();
    }
    if (stream.current && pitcher.current) {
      const pouring = u2 > 0.2 && u2 < 0.86 && pa > 0.9;
      stream.current.visible = pouring;
      if (pouring) {
        const spout = pitcher.current.localToWorld(tmpV.copy(SPOUT_LOCAL));
        const bottomY = level;
        const len = Math.max(0.01, spout.y - bottomY);
        stream.current.position.set(spout.x, (spout.y + bottomY) / 2, spout.z);
        const w = 1 + Math.sin(now * 18) * 0.08;
        stream.current.scale.set(w, len, w);
      }
    }

    // ---- Frother: move over, dip in, spin, lift out, go home
    if (frother.current) {
      const f = frother.current.position;
      if (u3 <= 0) f.copy(frotherIdle);
      else if (u3 < 0.22) f.lerpVectors(frotherIdle, FROTHER_ABOVE, easeInOutCubic(u3 / 0.22));
      else if (u3 < 0.38) f.lerpVectors(FROTHER_ABOVE, FROTHER_IN, easeInOutCubic((u3 - 0.22) / 0.16));
      else if (u3 < 0.86) {
        f.copy(FROTHER_IN);
        f.x += Math.sin(now * 2.2) * 0.12;
        f.z += Math.cos(now * 2.2) * 0.12;
      } else f.lerpVectors(FROTHER_IN, FROTHER_ABOVE, easeInOutCubic((u3 - 0.86) / 0.14));
      if (u4 > 0) f.lerpVectors(FROTHER_ABOVE, frotherIdle, easeInOutCubic(clamp01(u4 / 0.22)));
    }
    if (whisk.current) whisk.current.rotation.y = m.spin;

    // ---- Ice drops in, then condensation beads on the glass
    ice.forEach((c, i) => {
      const obj = iceRefs.current[i];
      if (!obj) return;
      const t = clamp01((u4 - c.land) / 0.24);
      obj.visible = t > 0;
      const floatY = top - 0.05 + i * 0.03 + Math.sin(now * 1.3 + i) * 0.015;
      obj.position.set(c.x, lerp(3.8, floatY, easeOutBounce(t)), c.z);
      obj.rotation.set(c.rot[0] + t * 1.2, c.rot[1] + t * 0.8, c.rot[2]);
    });
    const di = dropletInst.current;
    if (di) {
      droplets.forEach((d, i) => {
        tmpObj.position.copy(d.p);
        tmpObj.rotation.set(0, 0, 0);
        tmpObj.scale.setScalar(d.s * smooth(0.5 + d.delay * 0.5, 1, u4));
        tmpObj.updateMatrix();
        di.setMatrixAt(i, tmpObj.matrix);
      });
      di.instanceMatrix.needsUpdate = true;
    }

    // ---- Camera
    const c = Math.min(CAMERA.length - 1, Math.max(0, k - 0.5));
    const ci = Math.min(CAMERA.length - 2, Math.floor(c));
    const ct = smooth(0.15, 0.85, c - ci);
    const a = CAMERA[ci];
    const b = CAMERA[ci + 1];
    const aspect = state.size.width / Math.max(1, state.size.height);
    tmpV.set(lerp(a.pos[0], b.pos[0], ct), lerp(a.pos[1], b.pos[1], ct), lerp(a.pos[2], b.pos[2], ct));
    tmpTarget.set(lerp(a.target[0], b.target[0], ct), lerp(a.target[1], b.target[1], ct), lerp(a.target[2], b.target[2], ct));
    // Dolly back just enough for this step's subject to fit the screen width (phones need more).
    const halfH = Math.atan(Math.tan(THREE.MathUtils.degToRad(32 / 2)) * aspect);
    const focusSteps = stacked ? FOCUS_STACKED : FOCUS_HALF_WIDTH;
    const focus = lerp(focusSteps[ci], focusSteps[ci + 1], ct);
    const dist = tmpV.distanceTo(tmpTarget);
    const pull = Math.min(MAX_PULL, Math.max(0, focus / Math.tan(halfH) - dist));
    tmpV.add(tmpV2.copy(tmpV).sub(tmpTarget).normalize().multiplyScalar(pull));
    if (stacked) tmpTarget.y -= 0.5;
    cam.current.pos.lerp(tmpV, 1 - Math.exp(-dt * 4));
    cam.current.target.lerp(tmpTarget, 1 - Math.exp(-dt * 4));
    state.camera.position.copy(cam.current.pos);
    state.camera.position.x += pointer.current.x * 0.18;
    state.camera.position.y -= pointer.current.y * 0.12;
    state.camera.lookAt(cam.current.target);
    state.camera.updateMatrixWorld();

    // ---- Floating tag follows the hero object of each step
    const tag = tagRef.current;
    if (tag) {
      const step = Math.min(STEPS - 1, Math.floor(k));
      const anchor =
        step === 1 && sachet.current
          ? tmpV.copy(sachet.current.position).add(tmpV2.set(0.55, 0.3, 0))
          : step === 2 && pitcher.current
            ? tmpV.copy(pitcher.current.position).add(tmpV2.set(0.2, 0.2, 0))
            : step === 3 && frother.current
              ? tmpV.copy(frother.current.position).add(tmpV2.set(0.25, 1.6, 0))
              : tmpV.set(0.8, top + 0.2, 0);
      anchor.project(state.camera);
      // Keep the whole label on screen: near the right edge it slides left instead of being cut off.
      const maxX = Math.max(12, state.size.width - tag.offsetWidth - 12);
      const x = Math.min(maxX, Math.max(12, (anchor.x * 0.5 + 0.5) * state.size.width));
      const y = (-anchor.y * 0.5 + 0.5) * state.size.height;
      tag.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} color="#ffe9d2" />
      <directionalLight position={[3, 6, 4]} intensity={2.2} color="#fff1e0" />
      <directionalLight position={[-4, 3, -3]} intensity={2} color="#ffc98f" />
      <pointLight position={[0, 1.2, 2.5]} intensity={3} distance={6} color="#ffd9b0" />

      <Environment resolution={lowPower ? 128 : 256} frames={1}>
        <Lightformer form="rect" intensity={2.6} color="#fff4e6" position={[0, 6, 3]} scale={[9, 3, 1]} />
        <Lightformer form="rect" intensity={5} color="#ffffff" position={[-4.5, 1.5, 2]} scale={[0.8, 7, 1]} />
        <Lightformer form="rect" intensity={2.4} color="#ffe2c2" position={[4.5, 1, 1.5]} scale={[0.5, 7, 1]} />
        <Lightformer form="ring" intensity={1.8} color="#c58a4c" position={[0, 2, -6]} scale={6} />
      </Environment>

      {/* Counter */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <planeGeometry args={[18, 18]} />
        {/* Standard (not physical) shading: this plane fills most of the screen, so a clearcoat lobe here costs the most. */}
        <meshStandardMaterial map={marbleTex} roughness={0.28} envMapIntensity={1.15} />
      </mesh>
      {/* One blur pass instead of two, at a smaller target: the shadow still follows the moving kit. */}
      <ContactShadows
        position={[0, 0.002, 0]}
        scale={9}
        blur={3}
        smooth={false}
        opacity={0.55}
        far={3.5}
        resolution={lowPower ? 128 : 192}
      />

      {/* Glass contents */}
      <mesh ref={granuleMesh} geometry={granuleGeo} renderOrder={1}>
        <meshStandardMaterial map={granuleTex} color={GRANULE} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={liquidMesh} geometry={liquidGeo} renderOrder={1}>
        <meshPhysicalMaterial ref={liquidMat} color={MILK} roughness={0.3} clearcoat={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={foamMesh} geometry={foamGeo} renderOrder={1}>
        <meshStandardMaterial color={FOAM} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={surfaceMesh} geometry={surfaceGeo} renderOrder={1}>
        <meshPhysicalMaterial ref={surfaceMat} map={swirlTex} roughness={0.35} clearcoat={0.5} side={THREE.DoubleSide} />
      </mesh>

      {ice.map((c, i) => (
        <group
          key={i}
          ref={(o) => {
            iceRefs.current[i] = o;
          }}
          visible={false}
        >
          <RoundedBox args={[0.3, 0.3, 0.3]} radius={0.06} smoothness={3} renderOrder={2}>
            <meshPhysicalMaterial
              color="#eef8ff"
              transparent
              opacity={0.55}
              roughness={0.06}
              clearcoat={1}
              envMapIntensity={2.6}
              depthWrite={false}
            />
          </RoundedBox>
        </group>
      ))}

      {/* Glass */}
      <mesh geometry={glassGeo} renderOrder={3}>
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.2}
          roughness={0.04}
          clearcoat={1}
          clearcoatRoughness={0.03}
          envMapIntensity={2.4}
          depthWrite={false}
        />
      </mesh>
      <instancedMesh ref={dropletInst} args={[undefined, undefined, droplets.length]} renderOrder={4}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.7} roughness={0.02} clearcoat={1} envMapIntensity={3} />
      </instancedMesh>

      {/* Sachet */}
      <group ref={sachet} position={SACHET_IDLE}>
        <mesh geometry={sachetGeo}>
          <meshPhysicalMaterial attach="material-0" color="#3a2315" roughness={0.4} />
          <meshPhysicalMaterial attach="material-1" color="#3a2315" roughness={0.4} />
          <meshPhysicalMaterial attach="material-2" color="#3a2315" roughness={0.4} />
          <meshPhysicalMaterial attach="material-3" color="#3a2315" roughness={0.4} />
          <meshPhysicalMaterial attach="material-4" map={sachetTex} roughness={0.35} clearcoat={0.6} />
          <meshPhysicalMaterial attach="material-5" color="#2c1a10" roughness={0.4} clearcoat={0.4} />
        </mesh>
      </group>
      <instancedMesh ref={granuleInst} args={[undefined, undefined, granules.length]}>
        <boxGeometry args={[0.024, 0.024, 0.024]} />
        <meshStandardMaterial color="#4a2a16" roughness={0.6} />
      </instancedMesh>

      {/* Milk pitcher */}
      <group ref={pitcher} position={PITCHER_IDLE}>
        <mesh geometry={pitcherGeo}>
          <meshPhysicalMaterial
            color="#e9e7e3"
            metalness={0.75}
            roughness={0.32}
            clearcoat={0.6}
            clearcoatRoughness={0.2}
            envMapIntensity={2.2}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.37, 48]} />
          <meshPhysicalMaterial color={MILK} roughness={0.3} clearcoat={0.4} />
        </mesh>
        <mesh position={[0.47, 0.48, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <torusGeometry args={[0.22, 0.03, 12, 32, Math.PI]} />
          <meshStandardMaterial color="#cfcfcf" metalness={1} roughness={0.3} />
        </mesh>
      </group>
      <mesh ref={stream} visible={false} renderOrder={1}>
        <cylinderGeometry args={[0.035, 0.05, 1, 16, 1, true]} />
        <meshPhysicalMaterial color={MILK} roughness={0.25} clearcoat={0.6} />
      </mesh>

      {/* Frother: whisk at the group origin, handle above */}
      <group ref={frother} position={FROTHER_IDLE}>
        <mesh ref={whisk} geometry={whiskGeo}>
          <meshStandardMaterial color="#e6e6e6" metalness={1} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 1.2, 12]} />
          <meshStandardMaterial color="#e6e6e6" metalness={1} roughness={0.18} />
        </mesh>
        <mesh position={[0, 1.28, 0]}>
          <cylinderGeometry args={[0.06, 0.09, 0.18, 32]} />
          <meshStandardMaterial color="#d0d0d0" metalness={1} roughness={0.22} />
        </mesh>
        <mesh position={[0, 1.78, 0]}>
          <capsuleGeometry args={[0.115, 0.75, 8, 24]} />
          <meshPhysicalMaterial color="#141414" roughness={0.55} clearcoat={0.3} />
        </mesh>
        <mesh position={[0, 1.95, 0.112]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 24]} />
          <meshStandardMaterial color="#d9a35b" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </>
  );
}
