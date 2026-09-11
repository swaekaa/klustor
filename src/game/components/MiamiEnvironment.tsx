import { useMemo } from 'react';
import * as THREE from 'three';

// ============================================================
// MiamiEnvironment — Miami-inspired stylized 3D environment
// Low-poly assets: palm trees, buildings, ocean, sky
// ============================================================

function PalmTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 6, 6]} />
        <meshLambertMaterial color="#8B6B4A" />
      </mesh>
      {/* Crown */}
      <mesh position={[0, 6.5, 0]}>
        <sphereGeometry args={[1.8, 6, 4]} />
        <meshLambertMaterial color="#4A8B3A" />
      </mesh>
      <mesh position={[1.2, 6.2, 0.4]} rotation={[0.3, 0, 0.6]}>
        <sphereGeometry args={[1.0, 5, 3]} />
        <meshLambertMaterial color="#3D7A30" />
      </mesh>
      <mesh position={[-1.0, 6.0, 0.6]} rotation={[-0.2, 0, -0.5]}>
        <sphereGeometry args={[0.9, 5, 3]} />
        <meshLambertMaterial color="#4F9040" />
      </mesh>
    </group>
  );
}

function Building({ position, width, height, depth, color }: {
  position: [number, number, number];
  width: number; height: number; depth: number; color: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Window grid */}
      <mesh position={[0, height / 2, depth / 2 + 0.05]}>
        <boxGeometry args={[width * 0.9, height * 0.85, 0.05]} />
        <meshLambertMaterial color="#A8C7D8" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function StreetLight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 6, 6]} />
        <meshLambertMaterial color="#8898A8" />
      </mesh>
      <mesh position={[0.6, 6.1, 0]}>
        <boxGeometry args={[1.2, 0.12, 0.12]} />
        <meshLambertMaterial color="#8898A8" />
      </mesh>
      <mesh position={[1.2, 6.0, 0]}>
        <sphereGeometry args={[0.25, 6, 4]} />
        <meshLambertMaterial
          color="#FFEEAA"
          emissive={new THREE.Color('#FFDD88')}
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
}

export default function MiamiEnvironment() {
  // Ocean texture
  const oceanTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, '#5EC8D8');
    grad.addColorStop(1, '#2A80A0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 20);
    return tex;
  }, []);

  const palmPositions: [number, number, number][] = [
    // Along outside of circuit
    [140, 0, 0], [140, 0, 65], [140, 0, 130],
    [-140, 0, 0], [-140, 0, 65], [-140, 0, 130],
    [60, 0, -20], [-60, 0, -20],
    [60, 0, 148], [-60, 0, 148],
    // Scattered
    [30, 0, -25], [-30, 0, -25], [0, 0, -28],
  ];

  const buildings: Array<{ position: [number, number, number]; width: number; height: number; depth: number; color: string; label: string }> = [
    { position: [155, 0, 30], width: 18, height: 28, depth: 14, color: '#E8C8B8', label: 'VICE COAST HOTEL' },
    { position: [155, 0, 90], width: 12, height: 18, depth: 12, color: '#B8D8E8', label: 'SUNSET ARCADE' },
    { position: [-155, 0, 40], width: 16, height: 22, depth: 14, color: '#D8B8E8', label: 'NIGHTSHIFT CLUB' },
    { position: [-155, 0, 95], width: 14, height: 16, depth: 12, color: '#C8E8B8', label: 'PALM PLAZA' },
    { position: [40, 0, -25], width: 20, height: 12, depth: 10, color: '#FAD8A8', label: 'KLUSTOR GARAGE' },
    { position: [-40, 0, -25], width: 16, height: 14, depth: 10, color: '#E8D8C8', label: 'VICE HARBOR' },
  ];

  const lightPositions: [number, number, number][] = [
    [8, 0, 0], [-8, 0, 0],
    [122, 0, 25], [122, 0, 105],
    [-122, 0, 25], [-122, 0, 105],
    [8, 0, 130], [-8, 0, 130],
  ];

  return (
    <group>
      {/* === OCEAN === */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[220, -0.5, 65]}>
        <planeGeometry args={[200, 250]} />
        <meshLambertMaterial map={oceanTex} />
      </mesh>

      {/* === PALM TREES === */}
      {palmPositions.map((pos, i) => (
        <PalmTree key={i} position={pos} />
      ))}

      {/* === BUILDINGS === */}
      {buildings.map((b, i) => (
        <Building
          key={i}
          position={b.position}
          width={b.width}
          height={b.height}
          depth={b.depth}
          color={b.color}
        />
      ))}

      {/* === STREET LIGHTS === */}
      {lightPositions.map((pos, i) => (
        <StreetLight key={i} position={pos} />
      ))}

      {/* === BARRIERS along track outer edge === */}
      {[...Array(8)].map((_, i) => (
        <mesh key={`barrier-r-${i}`} position={[125, 0.4, i * 18 + 5]}>
          <boxGeometry args={[0.5, 0.8, 14]} />
          <meshLambertMaterial color="#F2EFE4" />
        </mesh>
      ))}
      {[...Array(8)].map((_, i) => (
        <mesh key={`barrier-l-${i}`} position={[-125, 0.4, i * 18 + 5]}>
          <boxGeometry args={[0.5, 0.8, 14]} />
          <meshLambertMaterial color="#F2EFE4" />
        </mesh>
      ))}
    </group>
  );
}
