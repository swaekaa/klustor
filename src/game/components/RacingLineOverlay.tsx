import * as THREE from 'three';
import { useMemo } from 'react';
import { getKRPORacingLine, type RacingLineProfileData } from '../data/krpoRacingLine';

// ============================================================
// RacingLineOverlay.tsx — KRPO Racing Line 3D Visualizer
//
// Renders inside <Canvas>.
// Features:
//   1. Dynamic Speed-Colored Ribbon (Red = Brake, Yellow = Coast, Cyan = Fast)
//   2. Apex Markers (Glowing Cyan Diamonds at corner clipping points)
//   3. Braking Point Indicators (Red deceleration markers)
//   4. Pure Three.js BufferGeometry with zero physics interference
// ============================================================

interface RacingLineOverlayProps {
  visible?: boolean;
  showApexes?: boolean;
  showBrakingZones?: boolean;
}

const RIBBON_WIDTH = 0.55; // meters wide

function buildRacingLineGeometry(profile: RacingLineProfileData): THREE.BufferGeometry {
  const waypoints = profile.waypoints;
  const n = waypoints.length;

  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  // Color palette (RGB normalized)
  const cFast = new THREE.Color('#00F0FF');   // Neon Cyan
  const cMid  = new THREE.Color('#FFD242');   // Yellow / Amber
  const cSlow = new THREE.Color('#FF2A6D');   // Neon Red / Coral

  for (let i = 0; i < n; i++) {
    const wp = waypoints[i];
    const p = wp.position;
    const norm = wp.normal;

    // Lateral offset for ribbon width
    const leftX  = p.x - norm.x * (RIBBON_WIDTH / 2);
    const leftZ  = p.z - norm.z * (RIBBON_WIDTH / 2);
    const rightX = p.x + norm.x * (RIBBON_WIDTH / 2);
    const rightZ = p.z + norm.z * (RIBBON_WIDTH / 2);

    // Height offset slightly above road (0.025m) to avoid Z-fighting
    const y = 0.025;

    positions.push(leftX, y, leftZ);
    positions.push(rightX, y, rightZ);

    // Speed-based color interpolation
    // Target speed is between ~6 m/s (slowest hairpin) and 22 m/s (top speed)
    const t = Math.max(0, Math.min(1, (wp.targetSpeed - 7.0) / 13.0));
    const vertexColor = new THREE.Color();

    if (t > 0.5) {
      vertexColor.lerpColors(cMid, cFast, (t - 0.5) * 2);
    } else {
      vertexColor.lerpColors(cSlow, cMid, t * 2);
    }

    colors.push(vertexColor.r, vertexColor.g, vertexColor.b);
    colors.push(vertexColor.r, vertexColor.g, vertexColor.b);

    // Two triangles per segment
    const nextIdx = (i + 1) % n;
    const b0 = i * 2;
    const b1 = i * 2 + 1;
    const b2 = nextIdx * 2;
    const b3 = nextIdx * 2 + 1;

    indices.push(b0, b2, b1);
    indices.push(b1, b2, b3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export default function RacingLineOverlay({
  visible = true,
  showApexes = true,
  showBrakingZones = true,
}: RacingLineOverlayProps) {
  const profile = useMemo(() => getKRPORacingLine(), []);
  const lineGeometry = useMemo(() => buildRacingLineGeometry(profile), [profile]);

  // Apex waypoints
  const apexWaypoints = useMemo(() => {
    return profile.waypoints.filter(wp => wp.isApex);
  }, [profile]);

  // Braking waypoints (clustered every ~4 waypoints to avoid clutter)
  const brakingWaypoints = useMemo(() => {
    return profile.waypoints.filter((wp, i) => wp.isBrakingPoint && i % 3 === 0);
  }, [profile]);

  if (!visible) return null;

  return (
    <group name="krpo-racing-line-overlay">
      {/* ── Continuous Speed-Colored Racing Line Ribbon ── */}
      <mesh geometry={lineGeometry}>
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.78}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── Apex Markers (Glowing Cyan Diamonds) ── */}
      {showApexes && apexWaypoints.map((wp) => {
        const yaw = Math.atan2(wp.tangent.x, wp.tangent.z);
        return (
          <group
            key={`apex-${wp.index}`}
            position={[wp.position.x, 0.04, wp.position.z]}
            rotation={[0, yaw, 0]}
          >
            {/* Diamond shape */}
            <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
              <planeGeometry args={[0.9, 0.9]} />
              <meshBasicMaterial
                color="#00FFFF"
                transparent
                opacity={0.85}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Inner center core */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.25, 12]} />
              <meshBasicMaterial
                color="#FFFFFF"
                transparent
                opacity={0.95}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}

      {/* ── Braking Point Indicators (Neon Red Chevron Bars) ── */}
      {showBrakingZones && brakingWaypoints.map((wp) => {
        const yaw = Math.atan2(wp.tangent.x, wp.tangent.z);
        return (
          <group
            key={`brake-${wp.index}`}
            position={[wp.position.x, 0.035, wp.position.z]}
            rotation={[0, yaw, 0]}
          >
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.4, 0.3]} />
              <meshBasicMaterial
                color="#FF2A6D"
                transparent
                opacity={0.8}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
