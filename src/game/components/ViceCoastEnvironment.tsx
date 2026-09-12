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

// Shared geometry instances - referenced below to avoid recreation

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────

// Palm tree — 3 variants via scale/rotation
function PalmTree({ px, pz, scale = 1.0, lean = 0 }: { px: number; pz: number; scale?: number; lean?: number }) {
  return (
    <group position={[px, 0, pz]} scale={[scale, scale, scale]} rotation={[lean * 0.08, 0, 0]}>
      {/* Trunk — curved suggestion via tapered cylinder */}
      <mesh position={[0, 3.8, 0]} material={M_PALM_TRUNK}>
        <cylinderGeometry args={[0.14, 0.26, 7.6, 7]} />
      </mesh>
      {/* Central crown */}
      <mesh position={[0, 8.0, 0]} material={M_PALM_LEAF1}>
        <sphereGeometry args={[1.5, 7, 5]} />
      </mesh>
      {/* Fronds */}
      <mesh position={[1.6, 7.5, 0.5]} rotation={[0.35, 0, 0.6]} material={M_PALM_LEAF2}>
        <sphereGeometry args={[0.85, 6, 4]} />
      </mesh>
      <mesh position={[-1.4, 7.3, 0.8]} rotation={[-0.3, 0.2, -0.55]} material={M_PALM_LEAF3}>
        <sphereGeometry args={[0.75, 6, 4]} />
      </mesh>
      <mesh position={[0.5, 7.4, -1.6]} rotation={[0.2, 0, -0.3]} material={M_PALM_LEAF2}>
        <sphereGeometry args={[0.80, 6, 4]} />
      </mesh>
    </group>
  );
}

// Street light — clean modern style
function StreetLight({ px, pz, rotY = 0 }: { px: number; pz: number; rotY?: number }) {
  return (
    <group position={[px, 0, pz]} rotation={[0, rotY, 0]}>
      {/* Pole */}
      <mesh position={[0, 4, 0]} material={M_POLE}>
        <cylinderGeometry args={[0.06, 0.10, 8, 6]} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.9, 8.1, 0]} material={M_POLE}>
        <boxGeometry args={[1.8, 0.08, 0.08]} />
      </mesh>
      {/* Lamp housing */}
      <mesh position={[1.8, 7.95, 0]} material={M_LAMP}>
        <boxGeometry args={[0.5, 0.18, 0.24]} />
      </mesh>
    </group>
  );
}

// ── Building system ───────────────────────────────────────────

type BldgType = 'artdeco' | 'shop' | 'hotel' | 'apartment' | 'warehouse';

function BuildingBlock({
  px, pz, rotY, w, h, d, baseColor, type = 'artdeco',
}: {
  px: number; pz: number; rotY: number;
  w: number; h: number; d: number;
  baseColor: string; type?: BldgType;
}) {
  // Derived colors
  const trim  = type === 'artdeco'   ? '#FFFFFF'
              : type === 'hotel'     ? '#FAF0E0'
              : type === 'shop'      ? '#FFFFFF'
              : type === 'warehouse' ? '#8B9BA8'
              :                        '#E0DDD8';

  const windowColor = '#7AB8CC';
  const awningColors: Record<BldgType, string> = {
    artdeco: '#8FD5D1', shop: '#E8365D', hotel: '#FAD080',
    apartment: '#A8C99B', warehouse: '#9BA8B8',
  };

  const floors  = Math.floor(h / 5);
  const winRows = Math.max(1, floors);
  const winCols = Math.max(1, Math.floor(w / 4));

  return (
    <group position={[px, 0, pz]} rotation={[0, rotY, 0]}>
      {/* Main body */}
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshLambertMaterial color={baseColor} />
      </mesh>

      {/* Roof trim (Art Deco stepped look) */}
      <mesh position={[0, h + 0.2, 0]}>
        <boxGeometry args={[w + 0.4, 0.4, d + 0.4]} />
        <meshLambertMaterial color={trim} />
      </mesh>
      {type === 'artdeco' && h > 15 && (
        <mesh position={[0, h + 1.0, 0]}>
          <boxGeometry args={[w * 0.6, 0.6, d * 0.6]} />
          <meshLambertMaterial color={trim} />
        </mesh>
      )}

      {/* Windows — simple planes on front face */}
      {Array.from({ length: winRows }, (_, row) =>
        Array.from({ length: winCols }, (_, col) => {
          const wx = -w / 2 + (col + 0.5) * (w / winCols);
          const wy = 3 + row * 5;
          if (wy > h - 2) return null;
          return (
            <mesh key={`w-${row}-${col}`} position={[wx, wy, d / 2 + 0.05]}>
              <boxGeometry args={[w / winCols * 0.55, 2.2, 0.08]} />
              <meshLambertMaterial color={windowColor} transparent opacity={0.6} />
            </mesh>
          );
        })
      )}

      {/* Awning (shop/hotel only) */}
      {(type === 'shop' || type === 'hotel') && (
        <mesh position={[0, 3.2, d / 2 + 0.9]} rotation={[0.38, 0, 0]}>
          <boxGeometry args={[w * 0.8, 0.12, 1.8]} />
          <meshLambertMaterial color={awningColors[type]} />
        </mesh>
      )}

      {/* Ground-floor accent strip */}
      <mesh position={[0, 1.2, d / 2 + 0.05]}>
        <boxGeometry args={[w, 2.4, 0.1]} />
        <meshLambertMaterial color={trim} transparent opacity={0.4} />
      </mesh>

      {/* Balconies on apartments */}
      {type === 'apartment' && Array.from({ length: Math.min(winRows - 1, 3) }, (_, row) => (
        <mesh key={`bal-${row}`} position={[0, 5 + row * 5, d / 2 + 0.5]}>
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
      {/* Main ocean plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[170, -0.2, 80]}>
        <planeGeometry args={[280, 320]} />
        <meshLambertMaterial map={oceanTex} />
      </mesh>
      {/* Beach strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[100, -0.05, 80]}>
        <planeGeometry args={[70, 320]} />
        <meshLambertMaterial color="#D4C89A" />
      </mesh>
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
        <mesh key={i} position={[-w/2 + i*3 + 1.5, 0.16, 0]}>
          <boxGeometry args={[2.6, 0.08, d]} />
          <meshLambertMaterial color="#8B7258" />
        </mesh>
      ))}
      {/* Bollards along front */}
      {Array.from({ length: Math.floor(w / 5) }, (_, i) => (
        <mesh key={i} position={[-w/2 + i*5 + 2.5, 0.65, d/2]} material={M_BOLLARD}>
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
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[5, 0.8, 2.2]} />
        <meshLambertMaterial color="#E8F0F5" />
      </mesh>
      {/* Cabin */}
      <mesh position={[0.5, 1.0, 0]}>
        <boxGeometry args={[2.5, 1.2, 1.8]} />
        <meshLambertMaterial color="#D8E5EB" />
      </mesh>
      {/* Stripe */}
      <mesh position={[0, 0.3, 1.12]}>
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
      <mesh position={[0, 1.2, 0]} material={M_POLE}>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 5]} />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, 2.6, 0]}>
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
      <mesh position={[-halfW, 2.5, 0]}>
        <boxGeometry args={[0.8, 5, 0.8]} />
        <meshLambertMaterial color="#1A2530" />
      </mesh>
      <mesh position={[halfW, 2.5, 0]}>
        <boxGeometry args={[0.8, 5, 0.8]} />
        <meshLambertMaterial color="#1A2530" />
      </mesh>
      {/* Horizontal beam at top */}
      <mesh position={[0, 5.2, 0]}>
        <boxGeometry args={[ROAD_WIDTH + 3.2, 0.6, 0.7]} />
        <meshLambertMaterial color="#1A2530" />
      </mesh>
      {/* VICE COAST sign panel */}
      <mesh position={[0, 4.5, 0]}>
        <boxGeometry args={[ROAD_WIDTH + 1, 1.2, 0.25]} />
        <meshLambertMaterial color="#8FD5D1" />
      </mesh>
      {/* Race lights bar */}
      <mesh position={[0, 3.7, 0]}>
        <boxGeometry args={[ROAD_WIDTH + 0.5, 0.35, 0.35]} />
        <meshLambertMaterial color="#2A3540" />
      </mesh>
      {/* Individual lights */}
      {([-5, -2.5, 0, 2.5, 5] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 3.7, 0.2]}>
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
      <mesh position={[0, 0.9, 0]} material={M_POLE}>
        <cylinderGeometry args={[0.055, 0.07, 1.8, 6]} />
      </mesh>
      {/* Sign board */}
      <mesh position={[0, 2.0, 0]}>
        <boxGeometry args={[1.3, 0.9, 0.1]} />
        <meshLambertMaterial color="#1A2530" />
      </mesh>
      {/* Color accent = indicates direction */}
      <mesh position={[0, 2.0, 0.06]}>
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
      <mesh position={[0, 0.7, 0]} material={M_POLE}>
        <cylinderGeometry args={[0.05, 0.06, 1.4, 5]} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
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

  // ── Buildings (explicit, carefully placed) ────────────────
  const bldgDefs: {
    frac: number; side: -1|1; clearance: number;
    w: number; h: number; d: number; color: string; type: BldgType;
  }[] = [
    // ── CITY START (Palm Avenue) ──
    { frac: 0.03, side: -1, clearance: 20, w: 15, h: 22, d: 12, color: '#E8C8B4', type: 'artdeco'   },
    { frac: 0.07, side: -1, clearance: 20, w: 13, h: 30, d: 12, color: '#B8D0E8', type: 'artdeco'   },
    { frac: 0.11, side: -1, clearance: 20, w: 16, h: 18, d: 12, color: '#D8B8E8', type: 'apartment' },
    { frac: 0.04, side:  1, clearance: 20, w: 14, h: 26, d: 12, color: '#FAD8A8', type: 'hotel'     },
    { frac: 0.08, side:  1, clearance: 20, w: 11, h: 16, d: 12, color: '#C8E8B8', type: 'shop'      },
    { frac: 0.13, side:  1, clearance: 20, w: 18, h: 22, d: 12, color: '#E8D8C8', type: 'artdeco'   },
    // ── TURN DISTRICT ──
    { frac: 0.18, side:  1, clearance: 18, w: 14, h: 20, d: 10, color: '#D8E0C8', type: 'artdeco'   },
    { frac: 0.23, side:  1, clearance: 18, w: 10, h: 14, d: 10, color: '#E8C8D0', type: 'shop'      },
    { frac: 0.26, side: -1, clearance: 18, w: 12, h: 16, d: 10, color: '#C8D8E0', type: 'apartment' },
    // ── HARBOR ──
    { frac: 0.38, side:  1, clearance: 22, w: 22, h: 12, d: 16, color: '#B8C8D0', type: 'warehouse' },
    { frac: 0.43, side:  1, clearance: 22, w: 16, h: 10, d: 14, color: '#98A8B0', type: 'warehouse' },
    // ── CHICANE / CITY RETURN ──
    { frac: 0.74, side: -1, clearance: 20, w: 14, h: 18, d: 12, color: '#E8C8D8', type: 'shop'      },
    { frac: 0.80, side: -1, clearance: 20, w: 16, h: 24, d: 12, color: '#C8D8E8', type: 'artdeco'   },
    { frac: 0.76, side:  1, clearance: 20, w: 13, h: 20, d: 12, color: '#D8E8C8', type: 'hotel'     },
    // ── FINISH STRAIGHT ──
    { frac: 0.88, side: -1, clearance: 20, w: 16, h: 22, d: 12, color: '#E8D8B8', type: 'artdeco'   },
    { frac: 0.93, side: -1, clearance: 20, w: 14, h: 28, d: 12, color: '#B8D0E8', type: 'artdeco'   },
    { frac: 0.90, side:  1, clearance: 20, w: 18, h: 20, d: 12, color: '#D8C8E8', type: 'apartment' },
    { frac: 0.96, side:  1, clearance: 20, w: 13, h: 16, d: 12, color: '#C8E8D8', type: 'shop'      },
  ];

  const buildings = useMemo(() => bldgDefs.map(b => {
    const s  = at(b.frac);
    const pt = edgePt(b.frac, b.side, b.clearance);
    pt.y     = 0;
    // Buildings face the road (angle derived from track tangent)
    const rotY = Math.atan2(s.tangent.x, s.tangent.z) + (b.side === -1 ? 0 : Math.PI);
    return { ...b, px: pt.x, pz: pt.z, rotY };
  }), [td]);

  // ── Palms ─────────────────────────────────────────────────
  // Explicit positions with slight scale variation (deterministic via index)
  const palmDefs: { frac: number; side: -1|1; dist: number; scaleStep: number }[] = [
    // Palm Avenue — left side
    ...Array.from({ length: 7 }, (_, i) => ({ frac: 0.02 + i*0.023, side: -1 as -1|1, dist: 8.5, scaleStep: i })),
    // Palm Avenue — right side
    ...Array.from({ length: 5 }, (_, i) => ({ frac: 0.03 + i*0.028, side:  1 as -1|1, dist: 8.5, scaleStep: i })),
    // Harbor palms
    ...Array.from({ length: 4 }, (_, i) => ({ frac: 0.35 + i*0.03,  side: -1 as -1|1, dist: 9,   scaleStep: i })),
    // Ocean drive palms — scattered
    ...Array.from({ length: 6 }, (_, i) => ({ frac: 0.58 + i*0.028, side:  1 as -1|1, dist: 11,  scaleStep: i })),
    ...Array.from({ length: 4 }, (_, i) => ({ frac: 0.60 + i*0.028, side: -1 as -1|1, dist: 8,   scaleStep: i })),
    // Finish area
    ...Array.from({ length: 3 }, (_, i) => ({ frac: 0.87 + i*0.025, side: -1 as -1|1, dist: 8.5, scaleStep: i })),
    ...Array.from({ length: 3 }, (_, i) => ({ frac: 0.89 + i*0.025, side:  1 as -1|1, dist: 8.5, scaleStep: i })),
  ];

  const palms = useMemo(() => palmDefs.map((p, i) => {
    const pt = edgePt(p.frac, p.side, p.dist + (ROAD_WIDTH / 2));
    // Deterministic scale: cycle through 3 values
    const scales = [1.0, 0.88, 1.12];
    return { px: pt.x, pz: pt.z, scale: scales[(i + p.scaleStep) % 3], lean: (i % 3) - 1 };
  }), [td]);

  // ── Street lights ─────────────────────────────────────────
  // Urban sections: start+finish district, turn district
  const lightDefs: { frac: number; side: -1|1 }[] = [
    // Start straight: every 5% on both sides
    ...Array.from({ length: 4 }, (_, i) => ({ frac: 0.02 + i*0.04, side: -1 as -1|1 })),
    ...Array.from({ length: 4 }, (_, i) => ({ frac: 0.04 + i*0.04, side:  1 as -1|1 })),
    // Turn district
    ...Array.from({ length: 3 }, (_, i) => ({ frac: 0.18 + i*0.04, side:  1 as -1|1 })),
    // Harbor
    ...Array.from({ length: 3 }, (_, i) => ({ frac: 0.36 + i*0.04, side:  1 as -1|1 })),
    // City return
    ...Array.from({ length: 3 }, (_, i) => ({ frac: 0.74 + i*0.04, side: -1 as -1|1 })),
    ...Array.from({ length: 3 }, (_, i) => ({ frac: 0.76 + i*0.04, side:  1 as -1|1 })),
    // Finish
    ...Array.from({ length: 3 }, (_, i) => ({ frac: 0.88 + i*0.04, side: -1 as -1|1 })),
    ...Array.from({ length: 3 }, (_, i) => ({ frac: 0.90 + i*0.04, side:  1 as -1|1 })),
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
    { frac: 0.36, dist: 18 },
    { frac: 0.42, dist: 20 },
    { frac: 0.48, dist: 22 },
  ].map(({ frac, dist }) => {
    const s   = at(frac);
    const pt  = s.position.clone().addScaledVector(s.normal, (ROAD_WIDTH / 2) + dist);
    pt.y      = 0;
    const rotY = Math.atan2(s.tangent.x, s.tangent.z);
    return { px: pt.x, pz: pt.z, rotY };
  }), [td]);

  // ── Boats ─────────────────────────────────────────────────
  const boats = useMemo(() => [
    { frac: 0.38, side: 1 as 1, dist: 28 },
    { frac: 0.44, side: 1 as 1, dist: 34 },
    { frac: 0.50, side: 1 as 1, dist: 28 },
  ].map(({ frac, side, dist }) => {
    const pt  = edgePt(frac, side, dist + (ROAD_WIDTH / 2));
    pt.y      = -0.15;
    const s   = at(frac);
    const rotY = Math.atan2(s.tangent.x, s.tangent.z) + (Math.PI / 4);
    return { px: pt.x, pz: pt.z, rotY };
  }), [td]);

  // ── Beach umbrellas ───────────────────────────────────────
  const umbrellas = useMemo(() => [
    { frac: 0.60 }, { frac: 0.63 }, { frac: 0.66 }, { frac: 0.69 },
  ].map(({ frac }, i) => {
    const side: 1 = 1;
    const pt = edgePt(frac, side, 18 + (ROAD_WIDTH / 2) + i * 3);
    return { px: pt.x, pz: pt.z };
  }), [td]);

  // ── Turn signs ────────────────────────────────────────────
  const turnSigns = useMemo(() => [
    0.14, 0.24, 0.44, 0.58, 0.72, 0.86,
  ].map((frac, i) => {
    const s   = at(frac);
    const pt  = s.position.clone().addScaledVector(s.normal, -(ROAD_WIDTH / 2) - 3.5);
    pt.y      = 0;
    const rotY = Math.atan2(s.tangent.x, s.tangent.z);
    return { px: pt.x, pz: pt.z, rotY, label: `T${i + 1}` };
  }), [td]);

  // ── Braking boards (before hairpin ~45%) ──────────────────
  const brakingBoards = useMemo(() => {
    const hairpinFrac = 0.44;
    return [
      { offset: 0.030, color: '#E8365D' }, // 100m board
      { offset: 0.022, color: '#1A2530' }, // 75m
      { offset: 0.015, color: '#1A2530' }, // 50m
    ].map(({ offset, color }) => {
      const frac = hairpinFrac - offset;
      const s    = at(frac);
      const pt   = s.position.clone().addScaledVector(s.normal, -(ROAD_WIDTH / 2) - 2.5);
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

  return (
    <group>
      {/* ── Ocean + Beach ── */}
      <OceanArea />

      {/* ── Harbor water (harbor district) ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[105, -0.3, 115]}>
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
        <group key={i} position={[b.px, 0, b.pz]}>
          <mesh position={[0, b.h / 2, 0]}>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshLambertMaterial color={b.color} />
          </mesh>
          <mesh position={[0, b.h + 0.2, 0]}>
            <boxGeometry args={[b.w + 0.3, 0.4, b.d + 0.3]} />
            <meshLambertMaterial color="#FFFFFF" />
          </mesh>
        </group>
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
