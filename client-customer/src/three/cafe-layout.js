// Shared cafe geometry constants — used by both the render (Room) and the
// player interaction logic so positions never drift apart.

export const ROOM = { width: 20, depth: 20, height: 4, wall: 0.4 };

// Half-extent the player is clamped inside (walls sit at ±10).
export const BOUND = ROOM.width / 2 - 1;

export const EYE = 1.6;          // camera eye height
export const INTERACT_RADIUS = 2.6; // how close you must stand to a table

// Six tables in a 2 x 3 grid. `number` is the human-facing table label.
export const TABLES = [
  { number: '1', position: [-5, 0, -4] },
  { number: '2', position: [0, 0, -4] },
  { number: '3', position: [5, 0, -4] },
  { number: '4', position: [-5, 0, 3] },
  { number: '5', position: [0, 0, 3] },
  { number: '6', position: [5, 0, 3] },
];

// Pick which table belongs to this session (fallback to the first one).
export function myTable(tableNumber) {
  return TABLES.find((t) => t.number === String(tableNumber)) ?? TABLES[0];
}
