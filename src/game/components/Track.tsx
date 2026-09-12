import * as THREE from 'three';
import { useMemo } from 'react';
import { getTrackData, ROAD_WIDTH } from '../data/viceCoastCircuit';

// ============================================================
// Track.tsx — Vice Coast Circuit Road Geometry v3
//
// Sources of geometry (ALL from centerline):
//   1. Road surface mesh
//   2. Red/white curbs (both sides)
//   3. Sidewalk strips (both sides, outside curbs)
//   4. Continuous low boundary walls
//   5. Start/finish line
//   6. Checkpoint arches (low-profile, never blocking camera)
// ============================================================

const CURB_W        = 1.2;
const CURB_H        = 0.08;
const SIDEWALK_W    = 3.5;
const SIDEWALK_H    = 0.07;
const WALL_H        = 0.65;   // low kerb wall — not a giant barrier
const WALL_THICK    = 0.28;
const WALL_OFFSET   = CURB_W + 0.05; // how far outside curb the wall sits

type Samples = ReturnType<typeof getTrackData>['samples'];

// ── Helper ────────────────────────────────────────────────────
function pushQuad(idx: number[], b0: number, b1: number, b2: number, b3: number, reverse: boolean) {
  if (reverse) {
    idx.push(b0, b2, b1, b1, b2, b3);
  } else {
    idx.push(b0, b1, b2, b1, b3, b2);
  }
}

// ── Geometry builders ─────────────────────────────────────────

function roadGeo(samples: Samples): THREE.BufferGeometry {
  const v: number[] = [], uv: number[] = [], idx: number[] = [];
  const n = samples.length;
  for (let i = 0; i < n; i++) {
    const c = samples[i], nx = samples[(i + 1) % n];
    const b = i * 4;
    v.push(
      c.leftEdge.x,  0.01, c.leftEdge.z,
      c.rightEdge.x, 0.01, c.rightEdge.z,
      nx.leftEdge.x, 0.01, nx.leftEdge.z,
      nx.rightEdge.x,0.01, nx.rightEdge.z,
    );
    uv.push(0, 0, 1, 0, 0, 1, 1, 1);
    idx.push(b, b+1, b+2, b+1, b+3, b+2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function curbGeo(samples: Samples, side: 'left'|'right'): THREE.BufferGeometry {
  const sign = side === 'right' ? 1 : -1;
  const v: number[] = [], idx: number[] = [];
  const n = samples.length;
  for (let i = 0; i < n; i++) {
    const c = samples[i], nx = samples[(i + 1) % n];
    const ce = side === 'right' ? c.rightEdge  : c.leftEdge;
    const ne = side === 'right' ? nx.rightEdge : nx.leftEdge;
    const co = ce.clone().addScaledVector(c.normal,  sign * CURB_W);
    const no = ne.clone().addScaledVector(nx.normal, sign * CURB_W);
    const b  = i * 4;
    v.push(ce.x, CURB_H, ce.z, co.x, CURB_H, co.z, ne.x, CURB_H, ne.z, no.x, CURB_H, no.z);
    pushQuad(idx, b, b+1, b+2, b+3, side === 'left');
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function sidewalkGeo(samples: Samples, side: 'left'|'right'): THREE.BufferGeometry {
  const sign = side === 'right' ? 1 : -1;
  const v: number[] = [], idx: number[] = [];
  const n = samples.length;
  for (let i = 0; i < n; i++) {
    const c = samples[i], nx = samples[(i + 1) % n];
    const ce = side === 'right' ? c.rightEdge  : c.leftEdge;
    const ne = side === 'right' ? nx.rightEdge : nx.leftEdge;
    // inner = outside curb edge, outer = sidewalk far edge
    const ci = ce.clone().addScaledVector(c.normal,  sign * CURB_W);
    const ni = ne.clone().addScaledVector(nx.normal, sign * CURB_W);
    const co = ci.clone().addScaledVector(c.normal,  sign * SIDEWALK_W);
    const no = ni.clone().addScaledVector(nx.normal, sign * SIDEWALK_W);
    const b  = i * 4;
    v.push(ci.x, SIDEWALK_H, ci.z, co.x, SIDEWALK_H, co.z, ni.x, SIDEWALK_H, ni.z, no.x, SIDEWALK_H, no.z);
    pushQuad(idx, b, b+1, b+2, b+3, side === 'left');
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function guardrailBaseGeo(samples: Samples, side: 'left'|'right'): THREE.BufferGeometry {
  const sign = side === 'right' ? 1 : -1;
  const v: number[] = [], idx: number[] = [];
  const n = samples.length;
  for (let i = 0; i < n; i++) {
    const c = samples[i], nx = samples[(i + 1) % n];
    const ce = side === 'right' ? c.rightEdge  : c.leftEdge;
    const ne = side === 'right' ? nx.rightEdge : nx.leftEdge;
    const ci = ce.clone().addScaledVector(c.normal,  sign * WALL_OFFSET);
    const ni = ne.clone().addScaledVector(nx.normal, sign * WALL_OFFSET);
    const co = ci.clone().addScaledVector(c.normal,  sign * WALL_THICK);
    const no = ni.clone().addScaledVector(nx.normal, sign * WALL_THICK);
    const b = i * 8;
    const BASE_H = 0.25;
    v.push(ci.x, 0, ci.z, ci.x, BASE_H, ci.z, ni.x, 0, ni.z, ni.x, BASE_H, ni.z); // b..b+3 (Inner)
    v.push(co.x, BASE_H, co.z, co.x, 0, co.z, no.x, BASE_H, no.z, no.x, 0, no.z); // b+4..b+7 (Outer)
    
    const rev = side === 'left';
    pushQuad(idx, b, b+1, b+2, b+3, rev); // Inner
    pushQuad(idx, b+4, b+5, b+6, b+7, rev); // Outer
    pushQuad(idx, b+1, b+4, b+3, b+6, rev); // Top
    pushQuad(idx, b, b+5, b+2, b+7, rev); // Bottom
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function guardrailBeamGeo(samples: Samples, side: 'left'|'right'): THREE.BufferGeometry {
  const sign = side === 'right' ? 1 : -1;
  const v: number[] = [], idx: number[] = [];
  const n = samples.length;
  const BEAM_H = 0.65;
  const BEAM_W = 0.08;
  const BEAM_T = 0.15; // vertical thickness

  for (let i = 0; i < n; i++) {
    const c = samples[i], nx = samples[(i + 1) % n];
    const ce = side === 'right' ? c.rightEdge  : c.leftEdge;
    const ne = side === 'right' ? nx.rightEdge : nx.leftEdge;
    
    // Position beam slightly inside the concrete base
    const beamDist = WALL_OFFSET + 0.15;
    const ci = ce.clone().addScaledVector(c.normal,  sign * beamDist);
    const ni = ne.clone().addScaledVector(nx.normal, sign * beamDist);
    const co = ci.clone().addScaledVector(c.normal,  sign * (beamDist + BEAM_W));
    const no = ni.clone().addScaledVector(nx.normal, sign * (beamDist + BEAM_W));
    
    const b  = i * 16;
    // Inner face
    v.push(ci.x, BEAM_H - BEAM_T, ci.z, ci.x, BEAM_H, ci.z, ni.x, BEAM_H - BEAM_T, ni.z, ni.x, BEAM_H, ni.z);
    // Outer face
    v.push(co.x, BEAM_H, co.z, co.x, BEAM_H - BEAM_T, co.z, no.x, BEAM_H, no.z, no.x, BEAM_H - BEAM_T, no.z);
    // Top face
    v.push(ci.x, BEAM_H, ci.z, co.x, BEAM_H, co.z, ni.x, BEAM_H, ni.z, no.x, BEAM_H, no.z);
    // Bottom face
    v.push(ci.x, BEAM_H - BEAM_T, ci.z, co.x, BEAM_H - BEAM_T, co.z, ni.x, BEAM_H - BEAM_T, ni.z, no.x, BEAM_H - BEAM_T, no.z);
    
    const rev = side === 'left';
    pushQuad(idx, b, b+1, b+2, b+3, rev); // Inner
    pushQuad(idx, b+4, b+5, b+6, b+7, rev); // Outer
    pushQuad(idx, b+8, b+9, b+10, b+11, rev); // Top
    pushQuad(idx, b+12, b+13, b+14, b+15, rev); // Bottom
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function guardrailPostsGeo(samples: Samples, side: 'left'|'right'): THREE.BufferGeometry {
  const sign = side === 'right' ? 1 : -1;
  const postGeometries: THREE.BufferGeometry[] = [];
  
  // Create one post every ~3 samples to keep it continuous but performant
  for (let i = 0; i < samples.length; i += 3) {
    const c = samples[i];
    const ce = side === 'right' ? c.rightEdge : c.leftEdge;
    const beamDist = WALL_OFFSET + 0.15 + 0.04; // Center of beam
    const pos = ce.clone().addScaledVector(c.normal, sign * beamDist);
    
    // Post box
    const g = new THREE.BoxGeometry(0.12, 0.6, 0.12);
    // Align rotation to track normal
    const angle = Math.atan2(c.normal.x, c.normal.z);
    g.rotateY(angle);
    g.translate(pos.x, 0.3, pos.z);
    postGeometries.push(g);
  }
  
  if (postGeometries.length === 0) return new THREE.BufferGeometry();
  
  // Merge all posts into one geometry using BoxGeometry buffer manipulation
  // (We use a simplified merging by constructing the buffer arrays directly)
  const v: number[] = [], idx: number[] = [];
  let offset = 0;
  
  for (const g of postGeometries) {
    const pos = g.attributes.position.array;
    const ind = g.index!.array;
    for (let j = 0; j < pos.length; j++) v.push(pos[j]);
    for (let j = 0; j < ind.length; j++) idx.push(ind[j] + offset);
    offset += pos.length / 3;
  }
  
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  merged.setIndex(idx);
  merged.computeVertexNormals();
  return merged;
}

// ── Textures ──────────────────────────────────────────────────

function makeRoadTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const ctx = c.getContext('2d')!;

  // Base asphalt — subtle variation
  ctx.fillStyle = '#252930';
  ctx.fillRect(0, 0, 256, 512);

  // Grain/texture
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let i = 0; i < 200; i++) {
    ctx.fillRect(Math.random()*256, Math.random()*512, 2, 2);
  }

  // White edge lines — crisp
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(0, 0, 8, 512);
  ctx.fillRect(248, 0, 8, 512);

  // Centre dashes — yellow
  ctx.fillStyle = 'rgba(255,220,80,0.65)';
  for (let y = 0; y < 512; y += 60) {
    ctx.fillRect(122, y, 12, 34);
  }

  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 120);
  return t;
}

function makeCurbTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 128;
  const ctx = c.getContext('2d')!;
  const SEG = 16;
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#E8365D' : '#F5F0E8';
    ctx.fillRect(0, i * SEG, 32, SEG);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 60);
  return t;
}

function makeSidewalkTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#CFC9BC';
  ctx.fillRect(0, 0, 128, 128);
  // Subtle pavement grid
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 128; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 128); ctx.stroke();
  }
  for (let y = 0; y < 128; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(128, y); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 80);
  return t;
}

function makeStartTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const ctx = c.getContext('2d')!;
  const cols = 16, rows = 4;
  const cw = c.width / cols, rh = c.height / rows;
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      ctx.fillStyle = (col + row) % 2 === 0 ? '#FFFFFF' : '#111111';
      ctx.fillRect(col * cw, row * rh, cw, rh);
    }
  }
  ctx.fillStyle = '#8FD5D1';
  ctx.font = 'bold 13px Trebuchet MS,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VICE COAST', c.width / 2, c.height / 2 + 4);
  return new THREE.CanvasTexture(c);
}

// ── Main Component ────────────────────────────────────────────

export default function Track() {
  const td = useMemo(() => getTrackData(), []);

  const gRoad      = useMemo(() => roadGeo(td.samples),              [td]);
  const gCurbL     = useMemo(() => curbGeo(td.samples, 'left'),      [td]);
  const gCurbR     = useMemo(() => curbGeo(td.samples, 'right'),     [td]);
  const gSidewalkL = useMemo(() => sidewalkGeo(td.samples, 'left'),  [td]);
  const gSidewalkR = useMemo(() => sidewalkGeo(td.samples, 'right'), [td]);
  const gBaseL = useMemo(() => guardrailBaseGeo(td.samples, 'left'),  [td]);
  const gBaseR = useMemo(() => guardrailBaseGeo(td.samples, 'right'), [td]);
  
  const gBeamL = useMemo(() => guardrailBeamGeo(td.samples, 'left'),  [td]);
  const gBeamR = useMemo(() => guardrailBeamGeo(td.samples, 'right'), [td]);

  const gPostsL = useMemo(() => guardrailPostsGeo(td.samples, 'left'),  [td]);
  const gPostsR = useMemo(() => guardrailPostsGeo(td.samples, 'right'), [td]);

  const tRoad     = useMemo(() => makeRoadTex(),     []);
  const tCurb     = useMemo(() => makeCurbTex(),     []);
  const tSidewalk = useMemo(() => makeSidewalkTex(), []);
  const tStart    = useMemo(() => makeStartTex(),    []);

  const sp = td.samples[0];
  const startYaw = Math.atan2(sp.tangent.x, sp.tangent.z);

  return (
    <group>
      {/* ── Ground base (large world plane) ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15, -0.04, 55]}>
        <planeGeometry args={[500, 420]} />
        <meshLambertMaterial color="#A8B882" />
      </mesh>

      {/* ── Road ── */}
      <mesh geometry={gRoad}>
        <meshLambertMaterial map={tRoad} />
      </mesh>

      {/* ── Curbs ── */}
      <mesh geometry={gCurbL}><meshLambertMaterial map={tCurb} /></mesh>
      <mesh geometry={gCurbR}><meshLambertMaterial map={tCurb} /></mesh>

      {/* ── Sidewalks ── */}
      <mesh geometry={gSidewalkL}><meshLambertMaterial map={tSidewalk} /></mesh>
      <mesh geometry={gSidewalkR}><meshLambertMaterial map={tSidewalk} /></mesh>

      {/* ── Continuous Guardrails ── */}
      {/* Bases */}
      <mesh geometry={gBaseL}><meshLambertMaterial color="#E2DDD6" /></mesh>
      <mesh geometry={gBaseR}><meshLambertMaterial color="#E2DDD6" /></mesh>
      {/* Beams */}
      <mesh geometry={gBeamL}><meshLambertMaterial color="#8FA0B0" /></mesh>
      <mesh geometry={gBeamR}><meshLambertMaterial color="#8FA0B0" /></mesh>
      {/* Posts */}
      <mesh geometry={gPostsL}><meshLambertMaterial color="#5C6B7A" /></mesh>
      <mesh geometry={gPostsR}><meshLambertMaterial color="#5C6B7A" /></mesh>

      {/* ── Start / Finish line ── */}
      <mesh
        position={[sp.position.x, 0.03, sp.position.z]}
        rotation={[-Math.PI / 2, 0, startYaw]}
      >
        <planeGeometry args={[ROAD_WIDTH, 5]} />
        <meshLambertMaterial map={tStart} />
      </mesh>

      {/* ── Checkpoint gates — LOW PROFILE so they don't block camera ── */}
      {td.checkpoints.map((cp, i) => {
        const palette = ['#8FD5D1','#A8C99B','#E9B58D','#DCA8B8','#B8A8DC'];
        const col = palette[i % palette.length];
        const yaw = Math.atan2(cp.tangent.x, cp.tangent.z);

        // Gate poles sit just outside road edge (NOT outside the wall)
        const lPole = cp.leftEdge.clone().addScaledVector(cp.normal, -0.4);
        const rPole = cp.rightEdge.clone().addScaledVector(cp.normal, 0.4);

        const GATE_H = 3.5; // low enough not to fill camera
        return (
          <group key={cp.id}>
            {/* Left pole */}
            <mesh position={[lPole.x, GATE_H / 2, lPole.z]}>
              <cylinderGeometry args={[0.2, 0.2, GATE_H, 8]} />
              <meshLambertMaterial color={col} />
            </mesh>
            {/* Right pole */}
            <mesh position={[rPole.x, GATE_H / 2, rPole.z]}>
              <cylinderGeometry args={[0.2, 0.2, GATE_H, 8]} />
              <meshLambertMaterial color={col} />
            </mesh>
            {/* Crossbar */}
            <mesh position={[cp.position.x, GATE_H + 0.15, cp.position.z]} rotation={[0, yaw, 0]}>
              <boxGeometry args={[ROAD_WIDTH + 1.2, 0.3, 0.3]} />
              <meshLambertMaterial color={col} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
