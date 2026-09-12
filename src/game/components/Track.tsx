import * as THREE from 'three';
import { useMemo } from 'react';
import { getTrackData, ROAD_WIDTH } from '../data/viceCoastCircuit';

// ============================================================
// Track.tsx — Vice Coast Circuit Geometry
// Derived strictly from the authoritative track centerline
// ============================================================

const CURB_WIDTH = 1.2;
const WALL_HEIGHT = 1.5;
const WALL_THICKNESS = 0.5;

function buildRoadGeometry(samples: any[]): THREE.BufferGeometry {
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < samples.length; i++) {
    const curr = samples[i];
    const next = samples[(i + 1) % samples.length];

    const base = i * 4;

    vertices.push(curr.leftEdge.x, 0.01, curr.leftEdge.z);
    vertices.push(curr.rightEdge.x, 0.01, curr.rightEdge.z);
    vertices.push(next.leftEdge.x, 0.01, next.leftEdge.z);
    vertices.push(next.rightEdge.x, 0.01, next.rightEdge.z);

    uvs.push(0, 0, 1, 0, 0, 1, 1, 1);

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

function buildCurbGeometry(samples: any[], side: 'left' | 'right'): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < samples.length; i++) {
    const curr = samples[i];
    const next = samples[(i + 1) % samples.length];

    const cEdge = side === 'left' ? curr.leftEdge : curr.rightEdge;
    const nEdge = side === 'left' ? next.leftEdge : next.rightEdge;
    
    // Normal points RIGHT. If left, subtract from edge. If right, add to edge.
    const sign = side === 'left' ? -1 : 1;
    
    const cOuter = cEdge.clone().addScaledVector(curr.normal, sign * CURB_WIDTH);
    const nOuter = nEdge.clone().addScaledVector(next.normal, sign * CURB_WIDTH);

    const base = i * 4;
    vertices.push(
      cEdge.x, 0.01, cEdge.z,
      cOuter.x, 0.05, cOuter.z,
      nEdge.x, 0.01, nEdge.z,
      nOuter.x, 0.05, nOuter.z,
    );
    indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildWallGeometry(samples: any[], side: 'left' | 'right'): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < samples.length; i++) {
    const curr = samples[i];
    const next = samples[(i + 1) % samples.length];

    const cEdge = side === 'left' ? curr.leftEdge : curr.rightEdge;
    const nEdge = side === 'left' ? next.leftEdge : next.rightEdge;
    
    const sign = side === 'left' ? -1 : 1;
    
    const cInner = cEdge.clone().addScaledVector(curr.normal, sign * CURB_WIDTH);
    const nInner = nEdge.clone().addScaledVector(next.normal, sign * CURB_WIDTH);
    
    const cOuter = cInner.clone().addScaledVector(curr.normal, sign * WALL_THICKNESS);
    const nOuter = nInner.clone().addScaledVector(next.normal, sign * WALL_THICKNESS);

    const base = i * 8; // 8 vertices per segment to build a 3D block
    
    // Inner face
    vertices.push(
      cInner.x, 0.0, cInner.z,
      cInner.x, WALL_HEIGHT, cInner.z,
      nInner.x, 0.0, nInner.z,
      nInner.x, WALL_HEIGHT, nInner.z,
    );
    // Outer face
    vertices.push(
      cOuter.x, WALL_HEIGHT, cOuter.z,
      cOuter.x, 0.0, cOuter.z,
      nOuter.x, WALL_HEIGHT, nOuter.z,
      nOuter.x, 0.0, nOuter.z,
    );

    // Inner Triangles
    indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    // Top Triangles (connecting inner top to outer top)
    indices.push(base + 1, base + 4, base + 3, base + 4, base + 6, base + 3);
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
  tex.repeat.set(1, 200); // Higher repeat because the track is long
  return tex;
}

function buildRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = '#2A2E35';
  ctx.fillRect(0, 0, 128, 128);
  
  ctx.fillStyle = '#F2EFE4';
  ctx.fillRect(60, 0, 8, 40);
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 400); // Scale the dashed line along the entire track
  return tex;
}

function buildStartLineTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 4; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? '#fff' : '#222';
      ctx.fillRect(i * 16, j * 16, 16, 16);
    }
  }
  ctx.fillStyle = '#8FD5D1';
  ctx.font = 'bold 18px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KLUSTOR', 128, 30);
  return new THREE.CanvasTexture(canvas);
}

export default function Track() {
  const trackData = useMemo(() => getTrackData(), []);
  
  const roadGeo = useMemo(() => buildRoadGeometry(trackData.samples), [trackData]);
  const curbGeoLeft = useMemo(() => buildCurbGeometry(trackData.samples, 'left'), [trackData]);
  const curbGeoRight = useMemo(() => buildCurbGeometry(trackData.samples, 'right'), [trackData]);
  const wallGeoLeft = useMemo(() => buildWallGeometry(trackData.samples, 'left'), [trackData]);
  const wallGeoRight = useMemo(() => buildWallGeometry(trackData.samples, 'right'), [trackData]);

  const roadTex = useMemo(() => buildRoadTexture(), []);
  const curbTex = useMemo(() => buildCurbTexture('#E63946', '#FAF9F3'), []);
  const startTex = useMemo(() => buildStartLineTexture(), []);

  const startPoint = trackData.samples[0];

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 65]}>
        <planeGeometry args={[450, 320]} />
        <meshLambertMaterial color="#C8B89A" />
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

      {/* Continuous Walls */}
      <mesh geometry={wallGeoLeft}>
        <meshLambertMaterial color="#E8EAEB" />
      </mesh>
      <mesh geometry={wallGeoRight}>
        <meshLambertMaterial color="#E8EAEB" />
      </mesh>

      {/* Start/Finish Line */}
      <mesh 
        position={[startPoint.position.x, 0.02, startPoint.position.z]} 
        rotation={[-Math.PI / 2, 0, Math.atan2(-startPoint.tangent.z, startPoint.tangent.x) - Math.PI/2]}
      >
        <planeGeometry args={[ROAD_WIDTH, 4]} />
        <meshLambertMaterial map={startTex} />
      </mesh>

      {/* Checkpoint Arches */}
      {trackData.checkpoints.filter(cp => cp.index < trackData.totalCheckpoints).map((cp, i) => {
        const colors = ['#8FD5D1', '#A8C99B', '#E9B58D', '#DCA8B8'];
        const color = colors[i % colors.length];
        
        // Compute positions for left and right poles of the arch
        // cp.leftEdge and rightEdge are exact width, we push them slightly out to not block the road
        const leftPole = cp.leftEdge.clone().addScaledVector(cp.normal, -0.5);
        const rightPole = cp.rightEdge.clone().addScaledVector(cp.normal, 0.5);

        return (
          <group key={cp.id}>
            {/* Left pole */}
            <mesh position={[leftPole.x, 2, leftPole.z]}>
              <cylinderGeometry args={[0.3, 0.3, 4, 8]} />
              <meshLambertMaterial color={color} />
            </mesh>
            {/* Right pole */}
            <mesh position={[rightPole.x, 2, rightPole.z]}>
              <cylinderGeometry args={[0.3, 0.3, 4, 8]} />
              <meshLambertMaterial color={color} />
            </mesh>
            {/* Crossbar */}
            <mesh 
              position={[cp.position.x, 4.2, cp.position.z]}
              rotation={[0, Math.atan2(cp.tangent.x, cp.tangent.z) + Math.PI/2, 0]}
            >
              <boxGeometry args={[ROAD_WIDTH + 2.5, 0.4, 0.4]} />
              <meshLambertMaterial color={color} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
