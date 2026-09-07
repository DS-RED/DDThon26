import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useKeyboard } from './useKeyboard.js';
import { BOUND, EYE, INTERACT_RADIUS, myTable } from './cafe-layout.js';

const SPEED = 4.2;

// First-person controller: mouse-look (pointer lock) + WASD movement.
// Reports whether the player is standing at their own table via onFocusChange.
export default function Player({ myNumber, active, onFocusChange, onLockChange }) {
  const controls = useRef(null);
  const keys = useKeyboard();
  const { camera } = useThree();
  const focused = useRef(false);
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const mine = myTable(myNumber);

  useEffect(() => {
    camera.position.set(0, EYE, 7.5); // spawn near the entrance, facing the counter
  }, [camera]);

  // Dev/e2e-only affordance: jump to your own table without walking. Stripped
  // from production builds, so it can't affect the shipped experience.
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    window.__cafe = {
      walkToMyTable() {
        const [x, , z] = mine.position;
        camera.position.set(x, EYE, z + 1.5); // stand just in front of the table
      },
    };
    return () => { delete window.__cafe; };
  }, [camera, mine]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const k = keys.current;

    camera.getWorldDirection(forward.current);
    forward.current.y = 0;
    forward.current.normalize();
    right.current.crossVectors(forward.current, camera.up).normalize();

    const move = new THREE.Vector3();
    if (k.forward) move.add(forward.current);
    if (k.back) move.sub(forward.current);
    if (k.right) move.add(right.current);
    if (k.left) move.sub(right.current);
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(SPEED * delta);
      camera.position.add(move);
    }

    // keep inside the room and at eye height
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -BOUND, BOUND);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -BOUND, BOUND);
    camera.position.y = EYE;

    // interaction: are we close to our own table?
    const dx = camera.position.x - mine.position[0];
    const dz = camera.position.z - mine.position[2];
    const near = Math.hypot(dx, dz) < INTERACT_RADIUS;
    if (near !== focused.current) {
      focused.current = near;
      onFocusChange(near ? mine.number : null);
    }
  });

  // Only mount the controls in the world view. drei's PointerLockControls
  // registers a document-level click→lock handler; leaving it mounted while the
  // ordering overlay is open would re-lock the pointer on the next overlay click
  // (any click, anywhere), hijacking all mouse input from the overlay.
  if (!active) return null;
  return (
    <PointerLockControls
      ref={controls}
      onLock={() => onLockChange(true)}
      onUnlock={() => onLockChange(false)}
    />
  );
}
