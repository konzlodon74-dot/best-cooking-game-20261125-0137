// kitchen.js — the kitchen floor: where every station sits, what it holds,
// and how the chef bumps into counters. Pure layout + collision, no drawing.

export const WORLD = {
  width: 1280,
  height: 720,
  hudHeight: 104,
  floorTop: 104,
  chefRadius: 22,
  chefSpeed: 265,
};

// One station per counter block. `kind` decides the interaction:
//   crate   — take a raw ingredient (infinite supply)
//   board   — chop a raw vegetable into its chopped form
//   grill   — cook a raw patty (3 slots, can burn)
//   fryer   — fry a potato into fries (2 slots, never burns)
//   assembly— the plate: add carried ingredients, build the dish
//   serve   — hand the finished plate to a customer
//   trash   — throw away what you carry, or clear the plate
//   plates  — a stack of clean plates (decoration + hint)
export const STATIONS = [
  { id: 'crate-bun', kind: 'crate', item: 'bun', label: 'BUNS', x: 16, y: 120, w: 104, h: 64 },
  { id: 'crate-patty', kind: 'crate', item: 'patty', label: 'PATTIES', x: 128, y: 120, w: 104, h: 64 },
  { id: 'crate-tomato', kind: 'crate', item: 'tomato', label: 'TOMATO', x: 240, y: 120, w: 104, h: 64 },
  { id: 'crate-lettuce', kind: 'crate', item: 'lettuce', label: 'LETTUCE', x: 352, y: 120, w: 104, h: 64 },
  { id: 'crate-cheese', kind: 'crate', item: 'cheese', label: 'CHEESE', x: 464, y: 120, w: 104, h: 64 },
  { id: 'crate-onion', kind: 'crate', item: 'onion', label: 'ONION', x: 576, y: 120, w: 104, h: 64 },
  { id: 'crate-potato', kind: 'crate', item: 'potato', label: 'POTATO', x: 688, y: 120, w: 104, h: 64 },
  { id: 'plates', kind: 'plates', item: null, label: 'PLATES', x: 800, y: 120, w: 104, h: 64 },
  { id: 'serve', kind: 'serve', item: null, label: 'SERVE!', x: 912, y: 120, w: 352, h: 64 },
  { id: 'board', kind: 'board', item: null, label: 'CHOP BOARD', x: 60, y: 316, w: 200, h: 76 },
  { id: 'grill', kind: 'grill', item: null, label: 'GRILL', x: 340, y: 316, w: 280, h: 76 },
  { id: 'fryer', kind: 'fryer', item: null, label: 'FRYER', x: 700, y: 316, w: 200, h: 76 },
  { id: 'assembly', kind: 'assembly', item: null, label: 'PLATING', x: 980, y: 316, w: 260, h: 76 },
  { id: 'trash', kind: 'trash', item: null, label: 'TRASH', x: 16, y: 620, w: 84, h: 72 },
];

// The chef may walk anywhere on the floor except inside a station rect
// (shrunk a little so the chef can hug the counter edge).
export function collideChef(chef) {
  const r = WORLD.chefRadius;
  chef.x = Math.max(r, Math.min(WORLD.width - r, chef.x));
  chef.y = Math.max(WORLD.floorTop + r, Math.min(WORLD.height - r, chef.y));
  for (const s of STATIONS) {
    if (s.kind === 'trash') continue; // the bin is low; the chef can step over it
    const nx = Math.max(s.x, Math.min(chef.x, s.x + s.w));
    const ny = Math.max(s.y, Math.min(chef.y, s.y + s.h));
    const dx = chef.x - nx;
    const dy = chef.y - ny;
    const dist = Math.hypot(dx, dy);
    if (dist < r && dist > 0.001) {
      chef.x = nx + (dx / dist) * r;
      chef.y = ny + (dy / dist) * r;
    } else if (dist <= 0.001) {
      chef.y = s.y + s.h + r; // pushed out below the counter
    }
  }
}

export function stationById(id) {
  return STATIONS.find((s) => s.id === id) || null;
}

export function stationAtPoint(x, y) {
  return STATIONS.find((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) || null;
}

export function stationCenter(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}

// Nearest station whose edge is within `reach` of the chef.
export function nearestStation(chef, reach) {
  let best = null;
  let bestDist = Infinity;
  for (const s of STATIONS) {
    const cx = Math.max(s.x, Math.min(chef.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(chef.y, s.y + s.h));
    const dist = Math.hypot(chef.x - cx, chef.y - cy);
    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }
  return bestDist <= reach ? best : null;
}

// A point just outside the station's front edge, for click-to-walk.
export function approachPoint(station) {
  return {
    x: station.x + station.w / 2,
    y: station.y + station.h + WORLD.chefRadius + 6,
  };
}
