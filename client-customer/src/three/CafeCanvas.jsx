import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import Room from './Room.jsx';
import Player from './Player.jsx';

// The WebGL cafe. Owns only the 3D scene; UI/overlay lives above it in Cafe.
export default function CafeCanvas({ myNumber, focusedNumber, active, onFocusChange, onLockChange }) {
  return (
    <Canvas shadows camera={{ fov: 70, near: 0.1, far: 100 }} dpr={[1, 2]}>
      <Sky sunPosition={[5, 10, 2]} turbidity={6} />
      <fog attach="fog" args={['#efe6d6', 18, 34]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 12, 4]} intensity={1.1} castShadow />
      <Room myNumber={myNumber} focusedNumber={focusedNumber} />
      <Player myNumber={myNumber} active={active} onFocusChange={onFocusChange} onLockChange={onLockChange} />
    </Canvas>
  );
}
