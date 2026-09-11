import * as THREE from 'three';
import { useMemo } from 'react';
import { TRACK_WAYPOINTS, TRACK_WIDTH, CHECKPOINTS, REQUIRED_CHECKPOINTS } from '../data/viceCoastCircuit';

// ============================================================
// Track.tsx — Vice Coast Circuit road geometry
// Generated procedurally from track waypoints
// ============================================================

function buildRoadGeometry(): THREE.BufferGeometry {
  const points = [...TRACK_WAYPOINTS, TRACK_WAYPOINTS[0]]; // close the loop
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];

    // Direction vector
    const dx = next.x - curr.x;
    const dz = next.z - curr.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    const nx = (-dz / len) * (TRACK_WIDTH / 2);
    const nz = (dx / len) * (TRACK_WIDTH / 2);

    const base = i * 4;

    // 4 vertices per segment (quad)
    vertices.push(curr.x - nx, 0.01, curr.z - nz); // left start
    vertices.push(curr.x + nx, 0.01, curr.z + nz); // right start
    vertices.push(next.x - nx, 0.01, next.z - nz); // left end
    vertices.push(next.x + nx, 0.01, next.z + nz); // right end

    uvs.push(0, 0, 1, 0, 0, 1, 1, 1);

    // Two triangles per quad
    indices.push(base, base + 1, base + 2);
    indices.push(base + 1, base + 3, base + 2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildCurbGeometry(side: 'left' | 'right'): THREE.BufferGeometry {
  const points = [...TRACK_WAYPOINTS, TRACK_WAYPOINTS[0]];
  const vertices: number[] = [];
  const indices: number[] = [];
  const CURB_WIDTH = 1.2;

  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];

    const dx = next.x - curr.x;
    const dz = next.z - curr.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    const nx = (-dz / len);
    const nz = (dx / len);
    const half = TRACK_WIDTH / 2;
    const sign = side === 'left' ? -1 : 1;

    const base = i * 4;
    vertices.push(
      curr.x + sign * (half) * nx, 0.01, curr.z + sign * (half) * nz,
      curr.x + sign * (half + CURB_WIDTH) * nx, 0.02, curr.z + sign * (half + CURB_WIDTH) * nz,
      next.x + sign * (half) * nx, 0.01, next.z + sign * (half) * nz,
      next.x + sign * (half + CURB_WIDTH) * nx, 0.02, next.z + sign * (half + CURB_WIDTH) * nz,
    );
    indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildCurbTexture(colorA: string, colorB: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? colorA : colorB;
    ctx.fillRect(0, i * 8, 64, 8);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 20);
  return tex;
}

function buildRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  
  // Dark asphalt
  ctx.fillStyle = '#2A2E35';
  ctx.fillRect(0, 0, 128, 128);
  
  // Center dashed lane marking
  ctx.fillStyle = '#F2EFE4';
  ctx.fillRect(60, 0, 8, 40);
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 30);
  return tex;
}

function buildStartLineTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  // Checkerboard
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 4; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? '#fff' : '#222';
      ctx.fillRect(i * 16, j * 16, 16, 16);
    }
  }
  // KLUSTOR text
  ctx.fillStyle = '#8FD5D1';
  ctx.font = 'bold 18px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KLUSTOR', 128, 30);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export default function Track() {
  const roadGeo = useMemo(() => buildRoadGeometry(), []);
  const curbGeoLeft = useMemo(() => buildCurbGeometry('left'), []);
  const curbGeoRight = useMemo(() => buildCurbGeometry('right'), []);
  const roadTex = useMemo(() => buildRoadTexture(), []);
  const curbTex = useMemo(() => buildCurbTexture('#E63946', '#FAF9F3'), []);
  const startTex = useMemo(() => buildStartLineTexture(), []);

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 65]}>
        <planeGeometry args={[350, 220]} />
        <meshLambertMaterial color="#C8B89A" /> {/* sand/terrain */}
      </mesh>

      {/* Road surface */}
      <mesh geometry={roadGeo}>
        <meshLambertMaterial map={roadTex} />
      </mesh>

      {/* Curbs */}
      <mesh geometry={curbGeoLeft}>
        <meshLambertMaterial map={curbTex} />
      </mesh>
      <mesh geometry={curbGeoRight}>
        <meshLambertMaterial map={curbTex} />
      </mesh>

      {/* Start/Finish Line */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TRACK_WIDTH, 4]} />
        <meshLambertMaterial map={startTex} />
      </mesh>

      {/* Checkpoint Arches */}
      {CHECKPOINTS.filter(cp => cp.index < REQUIRED_CHECKPOINTS).map((cp, i) => {
        const colors = ['#8FD5D1', '#A8C99B', '#E9B58D', '#DCA8B8'];
        const color = colors[i % colors.length];
        return (
          <group key={cp.id} position={cp.position}>
            {/* Left pole */}
            <mesh position={[-TRACK_WIDTH / 2 - 0.5, 2, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 4, 8]} />
              <meshLambertMaterial color={color} />
            </mesh>
            {/* Right pole */}
            <mesh position={[TRACK_WIDTH / 2 + 0.5, 2, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 4, 8]} />
              <meshLambertMaterial color={color} />
            </mesh>
            {/* Crossbar */}
            <mesh position={[0, 4.2, 0]}>
              <boxGeometry args={[TRACK_WIDTH + 2.5, 0.4, 0.4]} />
              <meshLambertMaterial color={color} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
