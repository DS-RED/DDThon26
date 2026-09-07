import { Html } from '@react-three/drei';
import { ROOM, TABLES } from './cafe-layout.js';

// A single blocky cafe table + 4 stools. Highlighted gold when it's "mine".
function CafeTable({ position, number, mine, focused }) {
  const top = mine ? (focused ? '#ffcf5c' : '#e9b949') : '#b98a5e';
  return (
    <group position={position}>
      {/* table top */}
      <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.16, 1.6]} />
        <meshStandardMaterial color={top} />
      </mesh>
      {/* pedestal */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color="#6b4f3a" />
      </mesh>
      {/* stools */}
      {[[-1, 0, 0], [1, 0, 0], [0, 0, -1], [0, 0, 1]].map(([x, , z], i) => (
        <mesh key={i} position={[x, 0.5, z]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#7d5a3c" />
        </mesh>
      ))}
      {/* floating table number */}
      <Html position={[0, 1.9, 0]} center distanceFactor={10} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`world-tag${mine ? ' mine' : ''}`}>TABLE {number}{mine ? ' · 내 자리' : ''}</div>
      </Html>
    </group>
  );
}

// Static blocky cafe: floor, four walls, and a service counter.
export default function Room({ myNumber, focusedNumber }) {
  const { width, depth, height, wall } = ROOM;
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#d9c7a8" />
      </mesh>
      {/* walls */}
      {[
        { p: [0, height / 2, -depth / 2], s: [width, height, wall] },
        { p: [0, height / 2, depth / 2], s: [width, height, wall] },
        { p: [-width / 2, height / 2, 0], s: [wall, height, depth] },
        { p: [width / 2, height / 2, 0], s: [wall, height, depth] },
      ].map((w, i) => (
        <mesh key={i} position={w.p}>
          <boxGeometry args={w.s} />
          <meshStandardMaterial color="#efe6d6" />
        </mesh>
      ))}
      {/* service counter along the back */}
      <mesh position={[0, 0.6, -8.5]} castShadow>
        <boxGeometry args={[8, 1.2, 1.2]} />
        <meshStandardMaterial color="#5a3d28" />
      </mesh>
      <Html position={[0, 2.4, -8.5]} center distanceFactor={12} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div className="world-sign">☕ CAFE COUNTER</div>
      </Html>
      {/* tables */}
      {TABLES.map((t) => (
        <CafeTable
          key={t.number}
          position={t.position}
          number={t.number}
          mine={t.number === myNumber}
          focused={t.number === focusedNumber}
        />
      ))}
    </group>
  );
}
