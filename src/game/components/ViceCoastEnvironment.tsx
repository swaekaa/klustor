import { useMemo } from 'react';
import * as THREE from 'three';
import { getTrackData, ROAD_WIDTH } from '../data/viceCoastCircuit';

// ============================================================
// ViceCoastEnvironment v3 — FULL QUALITY PASS
//
// Environment is divided into EXPLICIT ZONES by track progress:
//
//   0.00–0.18  CITY START (Palm Avenue + city buildings)
//   0.18–0.35  TURN DISTRICT (tight city + Art Deco)
//   0.35–0.55  HARBOR (docks, water, warehouses)
//   0.55–0.72  OCEAN DRIVE (beach, palms, ocean)
//   0.72–0.88  CHICANE / CITY RETURN (urban, shop fronts)
//   0.88–1.00  FINISH STRAIGHT (city blocks, gantry)
//
// Placement rules:
//   - All objects derived from track samples
//   - No Math.random() in render path
//   - Sidewalks + buildings form coherent city blocks
//   - Ocean is one big plane with beach strip
//   - Harbor has dock surface + water
//   - Guard rails ONLY on fast outer corners
// ============================================================

// ──────────────────────────────────────────────────────────────
// Shared materials (created once)
// ──────────────────────────────────────────────────────────────

const M_PALM_TRUNK  = new THREE.MeshLambertMaterial({ color: '#7A5832' });
const M_PALM_LEAF1  = new THREE.MeshLambertMaterial({ color: '#3D7B2A' });
const M_PALM_LEAF2  = new THREE.MeshLambertMaterial({ color: '#4F9040' });
const M_PALM_LEAF3  = new THREE.MeshLambertMaterial({ color: '#5AA34A' });
const M_POLE        = new THREE.MeshLambertMaterial({ color: '#5C6B7A' });
const M_LAMP        = new THREE.MeshLambertMaterial({ color: '#FFF0AA', emissive: new THREE.Color('#FFE088'), emissiveIntensity: 0.8 });
const M_CONCRETE    = new THREE.MeshLambertMaterial({ color: '#B8BBBE' });
const M_BOLLARD     = new THREE.MeshLambertMaterial({ color: '#2A2A2A' });

// ── Performant Window Texture ──
const BUILDING_TEX = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFFFFF'; // White wall base (will be tinted by Lambert material color)
    ctx.fillRect(0, 0, 128, 128);
    // Dark windows
    ctx.fillStyle = '#1A2A3A';
    ctx.fillRect(24, 24, 32, 32);
    ctx.fillRect(72, 24, 32, 32);
    ctx.fillRect(24, 76, 32, 32);
    ctx.fillRect(72, 76, 32, 32);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter; // Crisp edges
  return tex;
})();

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────

// Palm tree — 3 variants via scale/rotation
function PalmTree({ px, pz, scale = 1.0, lean = 0 }: { px: number; pz: number; scale?: number; lean?: number }) {
  return (
    <group position={[px, 0, pz]} scale={[scale, scale, scale]} rotation={[lean * 0.08, 0, 0]}>
      {/* Trunk — curved suggestion via tapered cylinder */}
      <mesh castShadow receiveShadow position={[0, 3.8, 0]} material={M_PALM_TRUNK}>
        <cylinderGeometry args={[0.14, 0.26, 7.6, 7]} />
      </mesh>
      {/* Central crown */}
      <mesh castShadow receiveShadow position={[0, 8.0, 0]} material={M_PALM_LEAF1}>
        <sphereGeometry args={[1.5, 7, 5]} />
      </mesh>
      {/* Fronds */}
      <mesh castShadow receiveShadow position={[1.6, 7.5, 0.5]} rotation={[0.35, 0, 0.6]} material={M_PALM_LEAF2}>
        <sphereGeometry args={[0.85, 6, 4]} />
      </mesh>
      <mesh castShadow receiveShadow position={[-1.4, 7.3, 0.8]} rotation={[-0.3, 0.2, -0.55]} material={M_PALM_LEAF3}>
        <sphereGeometry args={[0.75, 6, 4]} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.5, 7.4, -1.6]} rotation={[0.2, 0, -0.3]} material={M_PALM_LEAF2}>
        <sphereGeometry args={[0.80, 6, 4]} />
      </mesh>
    </group>
  );
}

// Shrub component
function Shrub({ px, pz, scale = 1 }: { px: number; pz: number; scale?: number }) {
  return (
    <group position={[px, 0, pz]} scale={[scale, scale, scale]}>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <dodecahedronGeometry args={[0.6, 0]} />
        <meshLambertMaterial color="#4C7B53" />
      </mesh>
      <mesh castShadow receiveShadow position={[0.4, 0.2, 0.3]}>
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshLambertMaterial color="#3A6140" />
      </mesh>
    </group>
  );
}

// FlowerBush component
function FlowerBush({ px, pz, scale = 1 }: { px: number; pz: number; scale?: number }) {
  return (
    <group position={[px, 0, pz]} scale={[scale, scale, scale]}>
      <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.5, 5, 4]} />
        <meshLambertMaterial color="#558C66" />
      </mesh>
      {/* Flowers */}
      <mesh castShadow position={[0.2, 0.6, 0.2]}>
        <sphereGeometry args={[0.15, 4, 3]} />
        <meshLambertMaterial color="#E85D75" />
      </mesh>
      <mesh castShadow position={[-0.3, 0.5, 0.1]}>
        <sphereGeometry args={[0.15, 4, 3]} />
        <meshLambertMaterial color="#E85D75" />
      </mesh>
      <mesh castShadow position={[0.1, 0.4, -0.3]}>
        <sphereGeometry args={[0.15, 4, 3]} />
        <meshLambertMaterial color="#F9DC5C" />
      </mesh>
    </group>
  );
}

// Spectator component (Crowds)
const SPECTATOR_COLORS = ['#FF5E5E', '#5EA1FF', '#FFB75E', '#5EFF99', '#D95EFF', '#FFFFFF', '#333333'];

function Spectator({ px, pz, rotY, isCheering, heightScale = 1 }: { px: number; pz: number; rotY: number; isCheering: boolean; heightScale?: number }) {
  const color = useMemo(() => SPECTATOR_COLORS[Math.floor(Math.random() * SPECTATOR_COLORS.length)], []);
  const bodyH = 1.4 * heightScale;
  const headS = 0.35 * heightScale;
  return (
    <group position={[px, 0, pz]} rotation={[0, rotY, 0]}>
      {/* Body */}
      <mesh position={[0, bodyH / 2, 0]} castShadow>
        <boxGeometry args={[0.5, bodyH, 0.3]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, bodyH + headS / 2, 0]} castShadow>
        <boxGeometry args={[headS, headS, headS]} />
        <meshLambertMaterial color="#FFD1B3" />
      </mesh>
      {/* Arms */}
      {isCheering ? (
        <>
          <mesh position={[-0.35, bodyH - 0.2, 0]} rotation={[0, 0, -2.5]} castShadow>
            <boxGeometry args={[0.15, 0.7, 0.15]} />
            <meshLambertMaterial color={color} />
          </mesh>
          <mesh position={[0.35, bodyH - 0.2, 0]} rotation={[0, 0, 2.5]} castShadow>
            <boxGeometry args={[0.15, 0.7, 0.15]} />
            <meshLambertMaterial color={color} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[-0.3, bodyH / 2, 0]} castShadow>
            <boxGeometry args={[0.15, 0.7, 0.15]} />
            <meshLambertMaterial color={color} />
          </mesh>
          <mesh position={[0.3, bodyH / 2, 0]} castShadow>
            <boxGeometry args={[0.15, 0.7, 0.15]} />
            <meshLambertMaterial color={color} />
          </mesh>
        </>
      )}
    </group>
  );
}

// Street light — clean modern style
function StreetLight({ px, pz, rotY = 0 }: { px: number; pz: number; rotY?: number }) {
  return (
    <group position={[px, 0, pz]} rotation={[0, rotY, 0]}>
      {/* Pole */}
      <mesh castShadow receiveShadow position={[0, 4, 0]} material={M_POLE}>
        <cylinderGeometry args={[0.06, 0.10, 8, 6]} />
      </mesh>
      {/* Arm */}
      <mesh castShadow receiveShadow position={[0.9, 8.1, 0]} material={M_POLE}>
        <boxGeometry args={[1.8, 0.08, 0.08]} />
      </mesh>
      {/* Lamp housing */}
      <mesh castShadow receiveShadow position={[1.8, 7.95, 0]} material={M_LAMP}>
        <boxGeometry args={[0.5, 0.18, 0.24]} />
      </mesh>
    </group>
  );
}

// ── Building system ───────────────────────────────────────────

type BldgType = 'artdeco' | 'shop' | 'hotel' | 'apartment' | 'warehouse' | 'garage';

interface BuildingBlockProps {
  px: number; pz: number; rotY: number;
  w: number; h: number; d: number;
  baseColor: string; type: BldgType;
}

function BuildingBlock({ px, pz, rotY, w, h, d, baseColor, type }: BuildingBlockProps) {
  const trim = '#FFFFFF';
  const awningColors = { shop: '#FF6B6B', hotel: '#4ECDC4' };
  const winRows = Math.floor(h / 5);
  
  // Create perfectly mapped wall materials based on width and depth to prevent stretched windows
  const matWallFB = useMemo(() => {
    const t = BUILDING_TEX.clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, w / 6), Math.max(1, h / 6));
    return new THREE.MeshLambertMaterial({ color: baseColor, map: t });
  }, [w, h, baseColor]);

  const matWallLR = useMemo(() => {
    const t = BUILDING_TEX.clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, d / 6), Math.max(1, h / 6));
    return new THREE.MeshLambertMaterial({ color: baseColor, map: t });
  }, [d, h, baseColor]);

  const matRoof = useMemo(() => new THREE.MeshLambertMaterial({ color: baseColor }), [baseColor]);
  
  // [right, left, top, bottom, front, back]
  const buildingMaterials = type !== 'garage' && type !== 'warehouse' 
    ? [matWallLR, matWallLR, matRoof, matRoof, matWallFB, matWallFB] 
    : new THREE.MeshLambertMaterial({ color: baseColor });

  return (
    <group position={[px, 0, pz]} rotation={[0, rotY, 0]}>
      {/* Main body with textured windows on 4 sides */}
      <mesh castShadow receiveShadow position={[0, h / 2, 0]} material={buildingMaterials}>
        <boxGeometry args={[w, h, d]} />
      </mesh>

      {/* Roof trim (Art Deco stepped look) */}
      {type === 'artdeco' && (
        <>
          <mesh castShadow receiveShadow position={[0, h + 0.2, 0]}>
            <boxGeometry args={[w + 0.4, 0.4, d + 0.4]} />
            <meshLambertMaterial color={trim} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, h + 1.0, 0]}>
            <boxGeometry args={[w * 0.6, 0.6, d * 0.6]} />
            <meshLambertMaterial color={trim} />
          </mesh>
        </>
      )}

      {/* Awning (shop/hotel only) */}
      {(type === 'shop' || type === 'hotel') && (
        <mesh castShadow receiveShadow position={[0, 3.2, d / 2 + 0.9]} rotation={[0.38, 0, 0]}>
          <boxGeometry args={[w * 0.8, 0.12, 1.8]} />
          <meshLambertMaterial color={awningColors[type as 'shop'|'hotel']} />
        </mesh>
      )}

      {/* Ground-floor accent strip */}
      <mesh castShadow receiveShadow position={[0, 1.2, d / 2 + 0.05]}>
        <boxGeometry args={[w, 2.4, 0.1]} />
        <meshLambertMaterial color={trim} transparent opacity={0.4} />
      </mesh>

      {/* Balconies on apartments */}
      {type === 'apartment' && Array.from({ length: Math.min(winRows - 1, 3) }, (_, row) => (
        <mesh castShadow receiveShadow key={`bal-${row}`} position={[0, 5 + row * 5, d / 2 + 0.5]}>
          <boxGeometry args={[w * 0.7, 0.12, 1.0]} />
          <meshLambertMaterial color={trim} />
        </mesh>
      ))}
    </group>
  );
}



// ── Ocean / Beach ─────────────────────────────────────────────

function OceanArea() {
  const oceanTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 256, 256);
    g.addColorStop(0, '#5EC8E8');
    g.addColorStop(0.5, '#38A8CC');
    g.addColorStop(1, '#1A7090');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    // Simple wave bands
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 3;
    for (let y = 15; y < 256; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 256; x += 20) {
        ctx.lineTo(x, y + Math.sin(x / 15) * 4);
      }
      ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(12, 12);
    return t;
  }, []);

  return (
    <>
      {/* Central lake is now rendered in Track.tsx */}
    </>
  );
}

// Dock / harbor surface
function HarborSurface({ px, pz, w, d, rotY }: { px: number; pz: number; w: number; d: number; rotY: number }) {
  return (
    <group position={[px, -0.05, pz]} rotation={[0, rotY, 0]}>
      <mesh>
        <boxGeometry args={[w, 0.3, d]} />
        <meshLambertMaterial color="#7A6248" />
      </mesh>
      {/* Planks suggestion */}
      {Array.from({ length: Math.floor(w / 3) }, (_, i) => (
        <mesh castShadow receiveShadow key={i} position={[-w/2 + i*3 + 1.5, 0.16, 0]}>
          <boxGeometry args={[2.6, 0.08, d]} />
          <meshLambertMaterial color="#8B7258" />
        </mesh>
      ))}
      {/* Bollards along front */}
      {Array.from({ length: Math.floor(w / 5) }, (_, i) => (
        <mesh castShadow receiveShadow key={i} position={[-w/2 + i*5 + 2.5, 0.65, d/2]} material={M_BOLLARD}>
          <cylinderGeometry args={[0.18, 0.22, 1.0, 6]} />
        </mesh>
      ))}
    </group>
  );
}

// Boat — simple stylized
function Boat({ px, pz, rotY }: { px: number; pz: number; rotY: number }) {
  return (
    <group position={[px, -0.1, pz]} rotation={[0, rotY, 0]}>
      {/* Hull */}
      <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[5, 0.8, 2.2]} />
        <meshLambertMaterial color="#E8F0F5" />
      </mesh>
      {/* Cabin */}
      <mesh castShadow receiveShadow position={[0.5, 1.0, 0]}>
        <boxGeometry args={[2.5, 1.2, 1.8]} />
        <meshLambertMaterial color="#D8E5EB" />
      </mesh>
      {/* Stripe */}
      <mesh castShadow receiveShadow position={[0, 0.3, 1.12]}>
        <boxGeometry args={[5, 0.15, 0.05]} />
        <meshLambertMaterial color="#E8365D" />
      </mesh>
    </group>
  );
}

// Beach umbrella
function BeachUmbrella({ px, pz }: { px: number; pz: number }) {
  return (
    <group position={[px, 0, pz]}>
      {/* Pole */}
      <mesh castShadow receiveShadow position={[0, 1.2, 0]} material={M_POLE}>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 5]} />
      </mesh>
      {/* Canopy */}
      <mesh castShadow receiveShadow position={[0, 2.6, 0]}>
        <coneGeometry args={[1.4, 0.6, 8]} />
        <meshLambertMaterial color="#E8A050" />
      </mesh>
    </group>
  );
}

// Start/finish gantry — LOW PROFILE, sides only, does not block camera
function StartGantry({ px, pz, rotY }: { px: number; pz: number; rotY: number }) {
  const halfW = ROAD_WIDTH / 2 + 1.2;
  return (
    <group position={[px, 0, pz]} rotation={[0, rotY, 0]}>
      {/* Side columns — thin & outside road */}
      <mesh castShadow receiveShadow position={[-halfW, 2.5, 0]}>
        <boxGeometry args={[0.8, 5, 0.8]} />
        <meshLambertMaterial color="#1A2530" />
      </mesh>
      <mesh castShadow receiveShadow position={[halfW, 2.5, 0]}>
        <boxGeometry args={[0.8, 5, 0.8]} />
        <meshLambertMaterial color="#1A2530" />
      </mesh>
      {/* Horizontal beam at top */}
      <mesh castShadow receiveShadow position={[0, 5.2, 0]}>
        <boxGeometry args={[ROAD_WIDTH + 3.2, 0.6, 0.7]} />
        <meshLambertMaterial color="#1A2530" />
      </mesh>
      {/* VICE COAST sign panel */}
      <mesh castShadow receiveShadow position={[0, 4.5, 0]}>
        <boxGeometry args={[ROAD_WIDTH + 1, 1.2, 0.25]} />
        <meshLambertMaterial color="#8FD5D1" />
      </mesh>
      {/* Race lights bar */}
      <mesh castShadow receiveShadow position={[0, 3.7, 0]}>
        <boxGeometry args={[ROAD_WIDTH + 0.5, 0.35, 0.35]} />
        <meshLambertMaterial color="#2A3540" />
      </mesh>
      {/* Individual lights */}
      {([-5, -2.5, 0, 2.5, 5] as number[]).map((x, i) => (
        <mesh castShadow receiveShadow key={i} position={[x, 3.7, 0.2]}>
          <sphereGeometry args={[0.18, 8, 6]} />
          <meshLambertMaterial
            color={i < 2 ? '#FF3333' : i === 2 ? '#FFCC00' : '#33CC33'}
            emissive={new THREE.Color(i < 2 ? '#CC0000' : i === 2 ? '#AAAA00' : '#00AA00')}
            emissiveIntensity={1.0}
          />
        </mesh>
      ))}
    </group>
  );
}

// Road sign (turn markers)
function TurnSign({ px, pz, rotY, label }: { px: number; pz: number; rotY: number; label: string }) {
  void label; // text rendering in canvas not needed for visual impact — use color blocks
  return (
    <group position={[px, 0, pz]} rotation={[0, rotY, 0]}>
      {/* Post */}
      <mesh castShadow receiveShadow position={[0, 0.9, 0]} material={M_POLE}>
        <cylinderGeometry args={[0.055, 0.07, 1.8, 6]} />
      </mesh>
      {/* Sign board */}
      <mesh castShadow receiveShadow position={[0, 2.0, 0]}>
        <boxGeometry args={[1.3, 0.9, 0.1]} />
        <meshLambertMaterial color="#1A2530" />
      </mesh>
      {/* Color accent = indicates direction */}
      <mesh castShadow receiveShadow position={[0, 2.0, 0.06]}>
        <boxGeometry args={[0.9, 0.55, 0.05]} />
        <meshLambertMaterial color="#8FD5D1" />
      </mesh>
    </group>
  );
}

// Braking marker board
function BrakingBoard({ px, pz, rotY, color }: { px: number; pz: number; rotY: number; color: string }) {
  return (
    <group position={[px, 0, pz]} rotation={[0, rotY, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.7, 0]} material={M_POLE}>
        <cylinderGeometry args={[0.05, 0.06, 1.4, 5]} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[0.75, 1.2, 0.1]} />
        <meshLambertMaterial color={color} />
      </mesh>
    </group>
  );
}

// ── Main export ────────────────────────────────────────────────

export default function ViceCoastEnvironment() {
  const td      = useMemo(() => getTrackData(), []);
  const samples = td.samples;
  const N       = samples.length;

  // Deterministic sample lookup (no Math.random in here)
  const at = (frac: number) => samples[Math.floor(((frac % 1 + 1) % 1) * N)];

  // Offset a world position from track edge
  const edgePt = (frac: number, side: -1|1, extraDist: number): THREE.Vector3 => {
    const s    = at(frac);
    const dist = (ROAD_WIDTH / 2) + extraDist;
    return s.position.clone().addScaledVector(s.normal, side * dist);
  };

  // ── Buildings (explicit, carefully placed on OUTSIDE only) ──
  const bldgDefs: {
    frac: number; side: -1|1; clearance: number;
    w: number; h: number; d: number; color: string; type: BldgType;
  }[] = [
    // We place buildings along the entire outside of the track (-1)
    ...Array.from({ length: 45 }, (_, i) => {
      const typeList: BldgType[] = ['artdeco', 'shop', 'hotel', 'apartment', 'warehouse'];
      const colorList = ['#E8C8B4', '#B8D0E8', '#D8B8E8', '#FAD8A8', '#C8E8B8', '#E8D8C8', '#D8E0C8', '#E8C8D0', '#C8D8E0'];
      const type = typeList[i % typeList.length];
      const color = colorList[i % colorList.length];
      return {
        frac: (i * 0.022) + 0.01,
        side: -1 as -1|1,
        clearance: 20 + (i % 3) * 2,
        w: 12 + (i % 5) * 2,
        h: 15 + (i % 7) * 4,
        d: 12,
        color, type
      };
    })
  ];

  const buildings = useMemo(() => bldgDefs.map((b, i) => {
    const s  = at(b.frac);
    const pt = edgePt(b.frac, b.side, b.clearance);
    pt.y     = 0;
    // Buildings face the road (rotate tangent by 90 degrees based on side)
    const rotY = Math.atan2(s.tangent.x, s.tangent.z) + (b.side === -1 ? -Math.PI/2 : Math.PI/2);
    return { ...b, px: pt.x, pz: pt.z, rotY };
  }), [td]);

  // ── Palms ─────────────────────────────────────────────────
  const palmDefs = [
    // Dense palm avenue around the entire outside
    ...Array.from({ length: 150 }, (_, i) => ({
      frac: i * 0.0066,
      side: -1 as -1|1,
      dist: 8.5 + (i % 2),
      scaleStep: i
    })),
    // A few palms on the inside beach edge
    ...Array.from({ length: 60 }, (_, i) => ({
      frac: i * 0.016,
      side: 1 as -1|1,
      dist: 5,
      scaleStep: i
    }))
  ];

  const palms = useMemo(() => palmDefs.map((p, i) => {
    const pt = edgePt(p.frac, p.side, p.dist + (ROAD_WIDTH / 2));
    // Deterministic scale: cycle through 3 values
    const scales = [1.0, 0.88, 1.12];
    return { px: pt.x, pz: pt.z, scale: scales[(i + p.scaleStep) % 3], lean: (i % 3) - 1 };
  }), [td]);

  // ── Shrubs & Flowers ───────────────────────────────────────
  const natureDefs = [
    ...Array.from({ length: 150 }, (_, i) => ({
      frac: i * 0.0066,
      side: -1 as -1|1,
      dist: 3.5 + (i % 3) * 1.5,
      type: (i % 4 === 0) ? 'flower' : 'shrub',
      scale: 0.8 + (i % 4) * 0.1
    })),
    ...Array.from({ length: 100 }, (_, i) => ({
      frac: i * 0.01,
      side: 1 as -1|1,
      dist: 3.0 + (i % 2) * 1.5,
      type: (i % 5 === 0) ? 'flower' : 'shrub',
      scale: 0.8 + (i % 4) * 0.1
    }))
  ];

  const natureProps = useMemo(() => natureDefs.map((n) => {
    const pt = edgePt(n.frac, n.side, n.dist + (ROAD_WIDTH / 2));
    return { px: pt.x, pz: pt.z, type: n.type, scale: n.scale };
  }), [td]);

  // ── Street lights ─────────────────────────────────────────
  const lightDefs = [
    ...Array.from({ length: 80 }, (_, i) => ({
      frac: i * 0.0125,
      side: -1 as -1|1
    }))
  ];

  const lights = useMemo(() => lightDefs.map(l => {
    const s   = at(l.frac);
    const pt  = edgePt(l.frac, l.side, 5.5 + (ROAD_WIDTH / 2));
    pt.y      = 0;
    const rotY = Math.atan2(s.tangent.x, s.tangent.z) + (l.side === 1 ? -Math.PI/2 : Math.PI/2);
    return { px: pt.x, pz: pt.z, rotY };
  }), [td]);



  // ── Harbor docks ──────────────────────────────────────────
  const harborDocks = useMemo(() => [
    { frac: 0.10, dist: 8 },
    { frac: 0.15, dist: 10 },
    { frac: 0.30, dist: 12 },
    { frac: 0.45, dist: 8 },
    { frac: 0.60, dist: 10 },
    { frac: 0.75, dist: 12 },
  ].map(({ frac, dist }) => {
    const s   = at(frac);
    const pt  = edgePt(frac, 1, dist);
    pt.y      = 0;
    const rotY = Math.atan2(s.tangent.x, s.tangent.z);
    return { px: pt.x, pz: pt.z, rotY };
  }), [td]);

  // ── Boats in the lake ─────────────────────────────────────
  const boats = useMemo(() => [
    { frac: 0.12, dist: 28 },
    { frac: 0.28, dist: 34 },
    { frac: 0.48, dist: 28 },
    { frac: 0.62, dist: 40 },
    { frac: 0.82, dist: 25 },
  ].map(({ frac, dist }) => {
    const pt  = edgePt(frac, 1, dist);
    pt.y      = -0.15;
    const s   = at(frac);
    const rotY = Math.atan2(s.tangent.x, s.tangent.z) + (Math.PI / 4);
    return { px: pt.x, pz: pt.z, rotY };
  }), [td]);

  // ── Beach umbrellas ───────────────────────────────────────
  const umbrellas = useMemo(() => [
    ...Array.from({ length: 15 }, (_, i) => ({ frac: 0.20 + i * 0.01 })),
    ...Array.from({ length: 15 }, (_, i) => ({ frac: 0.65 + i * 0.01 })),
  ].map(({ frac }) => {
    const pt = edgePt(frac, 1, 6);
    return { px: pt.x, pz: pt.z };
  }), [td]);

  // ── Turn signs ────────────────────────────────────────────
  const turnSigns = useMemo(() => [
    0.10, 0.25, 0.40, 0.55, 0.70, 0.85
  ].map((frac, i) => {
    const s   = at(frac);
    const pt  = edgePt(frac, -1, 3.5);
    pt.y      = 0;
    const rotY = Math.atan2(s.tangent.x, s.tangent.z);
    return { px: pt.x, pz: pt.z, rotY, label: `T${i + 1}` };
  }), [td]);

  // ── Braking boards ──────────────────
  const brakingBoards = useMemo(() => {
    return [
      { frac: 0.22, color: '#E8365D' },
      { frac: 0.23, color: '#1A2530' },
      { frac: 0.38, color: '#E8365D' },
      { frac: 0.39, color: '#1A2530' },
    ].map(({ frac, color }) => {
      const s    = at(frac);
      const pt   = edgePt(frac, -1, 2.5);
      pt.y       = 0;
      const rotY = Math.atan2(s.tangent.x, s.tangent.z);
      return { px: pt.x, pz: pt.z, rotY, color };
    });
  }, [td]);

  // ── Start/finish gantry ───────────────────────────────────
  const gantry = useMemo(() => {
    const s = samples[0];
    // Gantry is BEHIND the start line (so player drives through at finish)
    const pt = s.position.clone().addScaledVector(s.tangent, -2);
    const rotY = Math.atan2(s.tangent.x, s.tangent.z);
    return { px: pt.x, pz: pt.z, rotY };
  }, [td]);

  // ── Background city silhouette ────────────────────────────
  // Far background buildings — very simple, just for horizon fill
  const bgBuildings: { px: number; pz: number; w: number; h: number; d: number; color: string }[] = [
    { px: -40, pz: -55, w: 20, h: 40, d: 15, color: '#C8D8E0' },
    { px: -15, pz: -58, w: 16, h: 55, d: 12, color: '#D8C8E0' },
    { px: 15,  pz: -55, w: 18, h: 48, d: 14, color: '#E0D8C8' },
    { px: 40,  pz: -52, w: 22, h: 35, d: 16, color: '#C8E0D8' },
    { px: 65,  pz: -50, w: 14, h: 62, d: 12, color: '#E8D8C0' },
    // Harbor background
    { px: 145, pz: 50,  w: 25, h: 28, d: 18, color: '#B8C8D0' },
    { px: 148, pz: 90,  w: 20, h: 20, d: 16, color: '#C0C8D5' },
  ];

  // ── Spectators (Crowds) ───────────────────────────────────
  const spectators = useMemo(() => {
    const list: { px: number; pz: number; rotY: number; isCheering: boolean; heightScale: number }[] = [];
    
    // 1. Rally Corners (Cheering)
    // Evaluate every 3rd sample to find sharp corners
    for (let i = 0; i < N; i += 3) { 
      const c = samples[i], nx = samples[(i + 1) % N];
      const dot = c.tangent.dot(nx.tangent);
      if (dot < 0.9995) { // Moderately sharp corner
        // Place a cluster of cheering spectators on the outside
        const crossY = c.tangent.x * nx.tangent.z - c.tangent.z * nx.tangent.x;
        const turnSign = crossY > 0 ? -1 : 1; 
        
        for (let k = 0; k < 3; k++) {
          // Place outside the guardrail
          const offset = turnSign * ((ROAD_WIDTH / 2) + 3.0 + (k * 0.8));
          const pos = c.position.clone().addScaledVector(c.normal, offset);
          // Add some forward/backward jitter
          pos.addScaledVector(c.tangent, ((i+k) % 5 - 2.5) * 1.5);
          
          const rotY = Math.atan2(-c.normal.x * turnSign, -c.normal.z * turnSign) + (((i+k)%3 - 1) * 0.5);
          
          list.push({
            px: pos.x, pz: pos.z, rotY,
            isCheering: true,
            heightScale: 0.9 + ((i*k) % 3) * 0.1
          });
        }
      }
    }

    // 2. Beach Chilling
    // Beach zone is approx 0.55 to 0.72
    const startI = Math.floor(N * 0.55);
    const endI = Math.floor(N * 0.72);
    for (let i = startI; i < endI; i += 6) {
      const c = samples[i];
      for (let k = 0; k < 2; k++) {
        const offset = 12 + ((i*k) % 30); // Spread across the beach
        const pos = c.position.clone().addScaledVector(c.normal, offset);
        pos.addScaledVector(c.tangent, ((i+k)%7 - 3.5) * 2);
        
        const rotY = ((i+k) % 10) * (Math.PI / 5);
        list.push({
          px: pos.x, pz: pos.z, rotY,
          isCheering: (i % 5 === 0), // Occasional cheerer
          heightScale: 0.8 + ((i+k) % 4) * 0.1
        });
      }
    }
    return list;
  }, [td, N, samples]);

  return (
    <group>
      {/* ── Ocean + Beach ── */}
      <OceanArea />

      {/* ── Harbor water (harbor district) ── */}
      <mesh castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[105, -0.3, 115]}>
        <planeGeometry args={[90, 80]} />
        <meshLambertMaterial color="#4AA8C0" />
      </mesh>

      {/* ── Harbor surface ── */}
      {harborDocks.map((d, i) => (
        <HarborSurface key={i} px={d.px} pz={d.pz} w={22} d={9} rotY={d.rotY} />
      ))}

      {/* ── Boats ── */}
      {boats.map((b, i) => (
        <Boat key={i} px={b.px} pz={b.pz} rotY={b.rotY} />
      ))}

      {/* ── Beach umbrellas ── */}
      {umbrellas.map((u, i) => (
        <BeachUmbrella key={i} px={u.px} pz={u.pz} />
      ))}

      {/* ── Palm Trees ── */}
      {palms.map((p, i) => (
        <PalmTree key={i} px={p.px} pz={p.pz} scale={p.scale} lean={p.lean} />
      ))}

      {/* ── Street Lights ── */}
      {lights.map((l, i) => (
        <StreetLight key={i} px={l.px} pz={l.pz} rotY={l.rotY} />
      ))}

      {/* ── Buildings ── */}
      {buildings.map((b, i) => (
        <BuildingBlock
          key={i} px={b.px} pz={b.pz} rotY={b.rotY}
          w={b.w} h={b.h} d={b.d}
          baseColor={b.color} type={b.type}
        />
      ))}

      {/* ── Far background buildings (horizon fill) ── */}
      {bgBuildings.map((b, i) => (
        <BuildingBlock
          key={`bg-${i}`} px={b.px} pz={b.pz} rotY={0}
          w={b.w} h={b.h} d={b.d}
          baseColor={b.color} type="apartment"
        />
      ))}

      {/* ── Shrubs & Flowers ── */}
      {natureProps.map((n, i) => 
        n.type === 'flower' ? 
          <FlowerBush key={`flower-${i}`} px={n.px} pz={n.pz} scale={n.scale} /> :
          <Shrub key={`shrub-${i}`} px={n.px} pz={n.pz} scale={n.scale} />
      )}

      {/* ── Spectator Crowds ── */}
      {spectators.map((s, i) => (
        <Spectator key={`spec-${i}`} px={s.px} pz={s.pz} rotY={s.rotY} isCheering={s.isCheering} heightScale={s.heightScale} />
      ))}



      {/* ── Turn signs ── */}
      {turnSigns.map((s, i) => (
        <TurnSign key={i} px={s.px} pz={s.pz} rotY={s.rotY} label={s.label} />
      ))}

      {/* ── Braking boards ── */}
      {brakingBoards.map((b, i) => (
        <BrakingBoard key={i} px={b.px} pz={b.pz} rotY={b.rotY} color={b.color} />
      ))}

      {/* ── Start / Finish Gantry (LOW PROFILE) ── */}
      <StartGantry px={gantry.px} pz={gantry.pz} rotY={gantry.rotY} />
    </group>
  );
}
