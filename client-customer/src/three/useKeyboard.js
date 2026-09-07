import { useEffect, useRef } from 'react';

// Tracks WASD / arrow key state in a ref (no re-render per keypress).
const MAP = {
  KeyW: 'forward', ArrowUp: 'forward',
  KeyS: 'back', ArrowDown: 'back',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

export function useKeyboard() {
  const keys = useRef({ forward: false, back: false, left: false, right: false });
  useEffect(() => {
    const set = (value) => (event) => {
      const dir = MAP[event.code];
      if (dir) keys.current[dir] = value;
    };
    const down = set(true);
    const up = set(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);
  return keys;
}
