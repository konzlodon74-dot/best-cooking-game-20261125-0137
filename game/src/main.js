// main.js — Sizzle & Serve: the game loop, the chef's hands, and the rules
// that turn raw ingredients into served dishes before patience runs out.

import { createInput } from './input.js';
import { sfx } from './audio.js';
import {
  STATIONS, WORLD, collideChef, nearestStation, stationAtPoint,
  approachPoint, stationById,
} from './kitchen.js';
import {
  CHOPPABLE, INGREDIENTS, findMatchingOrder, isRush, levelForTime,
  makeOrder, scoreForServe, tickOrder,
} from './orders.js';
import { drawGame } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);

const SHIFT_LENGTH = 150; // seconds per shift
const REACH = 78; // how close the chef must stand to use a station
const MAX_ORDERS = 4;

const game = {
  phase: 'title', // title | playing | over
  elapsed: 0,
  timeLeft: SHIFT_LENGTH,
  score: 0,
  combo: 0,
  bestCombo: 0,
  served: 0,
  failed: 0,
  orders: [],
  chef: { x: 640, y: 520, dir: { x: 0, y: 1 }, walking: false, carrying: null },
  board: null, // { item, progress } on the chopping board
  grill: [null, null, null], // { item: 'patty', t } — t: 0..1 cooks, 2+ burns
  fryer: [null, null], // { item: 'potato', t } — t: 0..1 fries
  plate: [], // items on the plating counter, bottom to top
  particles: [],
  popups: [],
  toast: '',
  toastTime: 0,
  rush: false,
  rushFlash: 0,
  level: 1,
  spawnTimer: 8,
  nearestStation: null,
  matchingOrder: null,
  demo: false, // frozen showcase state, for screenshots
};

window.__game = game; // handy for play-testing from the console

// ---------- small helpers ----------

function say(message, seconds) {
  game.toast = message;
  game.toastTime = seconds || 2.2;
}

function burst(x, y, color, count) {
  for (let i = 0; i < (count || 14); i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 120;
    game.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      life: 0.7, maxLife: 0.7,
      size: 2 + Math.random() * 3,
      color,
    });
  }
}

function popup(x, y, text, color) {
  game.popups.push({ x, y, text, color: color || '#ffd166', life: 1.4, maxLife: 1.4, size: 24 });
}

function resetShift() {
  game.phase = 'playing';
  game.elapsed = 0;
  game.timeLeft = SHIFT_LENGTH;
  game.score = 0;
  game.combo = 0;
  game.bestCombo = 0;
  game.served = 0;
  game.failed = 0;
  game.orders = [];
  game.chef = { x: 640, y: 520, dir: { x: 0, y: 1 }, walking: false, carrying: null };
  game.board = null;
  game.grill = [null, null, null];
  game.fryer = [null, null];
  game.plate = [];
  game.particles = [];
  game.popups = [];
  game.toast = '';
  game.toastTime = 0;
  game.rush = false;
  game.rushFlash = 0;
  game.level = 1;
  game.spawnTimer = 6;
  spawnOrder();
  spawnOrder();
  say('Shift started! First orders are in.', 3);
}

function spawnOrder() {
  if (game.orders.length >= MAX_ORDERS) return;
  game.orders.push(makeOrder(game.level, game.rush));
  sfx.pop();
}

// ---------- interactions ----------

function doInteract(station) {
  const chef = game.chef;
  switch (station.kind) {
    case 'crate': {
      if (chef.carrying) {
        say('Hands full — serve or trash something first!');
        return;
      }
      chef.carrying = station.item;
      sfx.pickup();
      break;
    }
    case 'board': {
      if (!game.board && chef.carrying && CHOPPABLE.includes(chef.carrying)) {
        game.board = { item: chef.carrying, progress: 0 };
        chef.carrying = null;
        sfx.place();
      } else if (game.board && game.board.progress >= 1 && !chef.carrying) {
        chef.carrying = game.board.item;
        game.board = null;
        sfx.pickup();
      } else if (game.board && game.board.progress < 1) {
        say('Hold E to chop it!');
      } else if (!game.board) {
        say('Bring a tomato, lettuce or onion to chop.');
      } else {
        say('Hands full!');
      }
      break;
    }
    case 'grill': {
      if (chef.carrying === 'patty') {
        const slot = game.grill.findIndex((s) => s === null);
        if (slot >= 0) {
          game.grill[slot] = { item: 'patty', t: 0 };
          chef.carrying = null;
          sfx.sizzle();
        } else {
          say('The grill is full!');
        }
      } else if (!chef.carrying) {
        const slot = game.grill.findIndex((s) => s && s.t >= 1);
        if (slot >= 0) {
          chef.carrying = game.grill[slot].t >= 2 ? 'patty-burnt' : 'patty-cooked';
          game.grill[slot] = null;
          sfx.pickup();
        } else {
          say('Nothing cooked yet — grill a patty first.');
        }
      } else {
        say('The grill only takes raw patties.');
      }
      break;
    }
    case 'fryer': {
      if (chef.carrying === 'potato') {
        const slot = game.fryer.findIndex((s) => s === null);
        if (slot >= 0) {
          game.fryer[slot] = { item: 'potato', t: 0 };
          chef.carrying = null;
          sfx.sizzle();
        } else {
          say('The fryer is full!');
        }
      } else if (!chef.carrying) {
        const slot = game.fryer.findIndex((s) => s && s.t >= 1);
        if (slot >= 0) {
          chef.carrying = 'fries';
          game.fryer[slot] = null;
          sfx.pickup();
        } else {
          say('Nothing fried yet — drop a potato in.');
        }
      } else {
        say('The fryer only takes potatoes.');
      }
      break;
    }
    case 'assembly': {
      if (chef.carrying) {
        if (game.plate.length >= 5) {
          say('The plate is full!');
          return;
        }
        game.plate.push(chef.carrying);
        chef.carrying = null;
        sfx.place();
        const match = findMatchingOrder(game.plate, game.orders);
        if (match) {
          say(`${match.recipe.name} is ready — serve it!`);
          sfx.ding();
        }
      } else if (game.plate.length > 0) {
        say('Take it to the SERVE pass when it matches an order.');
      } else {
        say('Add ingredients to build a dish here.');
      }
      break;
    }
    case 'serve': {
      if (game.plate.length === 0) {
        say('Nothing on the plate yet!');
        return;
      }
      const match = findMatchingOrder(game.plate, game.orders);
      if (!match) {
        game.plate = [];
        game.combo = 0;
        game.failed += 1;
        say('Wrong dish! The customer sent it back.');
        sfx.buzz();
        return;
      }
      const points = scoreForServe(match, game.combo);
      game.score += points;
      game.combo += 1;
      game.bestCombo = Math.max(game.bestCombo, game.combo);
      game.served += 1;
      game.orders = game.orders.filter((o) => o !== match);
      game.plate = [];
      const serveStation = stationById('serve');
      popup(serveStation.x + serveStation.w / 2, serveStation.y + 90, `+${points}`, '#ffd166');
      burst(serveStation.x + serveStation.w / 2, serveStation.y + 80, '#ffd166', 18);
      sfx.coin();
      say(`${match.customer} loved the ${match.recipe.name}! +${points}`);
      break;
    }
    case 'trash': {
      if (chef.carrying) {
        chef.carrying = null;
        sfx.place();
        say('Tossed it.');
      } else if (game.plate.length > 0) {
        game.plate = [];
        sfx.place();
        say('Plate cleared.');
      } else {
        say('Nothing to throw away.');
      }
      break;
    }
    case 'plates': {
      say('Plates wait on the plating counter — just add food!');
      break;
    }
    default:
      break;
  }
}

// ---------- per-frame update ----------

function updatePlaying(dt) {
  // Clock, rush hour and difficulty.
  if (!game.demo) {
    game.elapsed += dt;
    game.timeLeft = Math.max(0, SHIFT_LENGTH - game.elapsed);
    const wasRush = game.rush;
    game.rush = isRush(game.elapsed, SHIFT_LENGTH);
    if (game.rush && !wasRush) {
      game.rushFlash = 1;
      say('RUSH HOUR! Orders are pouring in!');
      sfx.rush();
    }
    game.level = levelForTime(game.elapsed, SHIFT_LENGTH);
    if (game.timeLeft <= 0) {
      game.phase = 'over';
      sfx.ding();
      return;
    }
  }
  if (game.rushFlash > 0) game.rushFlash = Math.max(0, game.rushFlash - dt * 0.4);

  // New orders arrive on a timer (faster in the rush).
  if (!game.demo) {
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      spawnOrder();
      game.spawnTimer = (game.rush ? 7 : 13) + Math.random() * 3;
    }
  }

  // Patience drains; a customer with none left walks out.
  if (!game.demo) {
    for (let i = game.orders.length - 1; i >= 0; i--) {
      if (tickOrder(game.orders[i], dt, game.rush)) {
        const lost = game.orders[i];
        game.orders.splice(i, 1);
        game.failed += 1;
        game.combo = 0;
        say(`${lost.customer} walked out! The ${lost.recipe.name} was too slow.`);
        sfx.buzz();
      }
    }
  }

  // Cooking progresses.
  if (!game.demo) {
    for (const slot of game.grill) if (slot) slot.t += dt / 4;
    for (const slot of game.fryer) if (slot) slot.t += dt / 3;
  }

  // Hold E at the chopping board to chop.
  const board = stationById('board');
  if (
    game.board && game.board.progress < 1 && input.interactHeld() &&
    game.nearestStation && game.nearestStation.id === 'board'
  ) {
    game.board.progress = Math.min(1, game.board.progress + dt / 1.2);
    if (Math.random() < dt * 8) sfx.chop();
    if (game.board.progress >= 1) {
      game.board.item = INGREDIENTS[game.board.item].chopped;
      say(`${INGREDIENTS[game.board.item].name} ready!`);
      sfx.ding();
    }
  }

  // Movement: keys win over a click target.
  const chef = game.chef;
  const keys = input.moveVector();
  chef.walking = false;
  if (input.hasKeyboardMove()) {
    input.clearMoveTarget();
    input.clearClickStation();
    chef.x += keys.x * WORLD.chefSpeed * dt;
    chef.y += keys.y * WORLD.chefSpeed * dt;
    if (keys.x !== 0 || keys.y !== 0) {
      chef.dir = { x: keys.x, y: keys.y };
      chef.walking = true;
    }
  } else {
    const target = input.moveTarget();
    if (target) {
      const dx = target.x - chef.x;
      const dy = target.y - chef.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 10) {
        chef.x += (dx / dist) * WORLD.chefSpeed * dt;
        chef.y += (dy / dist) * WORLD.chefSpeed * dt;
        chef.dir = { x: dx / dist, y: dy / dist };
        chef.walking = true;
      } else {
        input.clearMoveTarget();
        const pending = input.clickStation();
        if (pending) {
          input.clearClickStation();
          const station = stationById(pending);
          if (station) doInteract(station);
        }
      }
    }
  }
  collideChef(chef);

  // Nearest station + plate match, for the renderer and hints.
  game.nearestStation = nearestStation(chef, REACH);
  game.matchingOrder = findMatchingOrder(game.plate, game.orders);

  // A fresh E/Space press interacts with the nearest station.
  if (input.consumeInteractPress() && game.nearestStation) {
    doInteract(game.nearestStation);
  }

  // A click on a station walks there, then interacts on arrival.
  const target = input.moveTarget();
  if (target && !input.clickStation()) {
    const hit = stationAtPoint(target.x, target.y);
    if (hit) {
      input.setClickStation(hit.id);
      input.setMoveTarget(approachPoint(hit));
    }
  }

  // Particles, popups, toast.
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 160 * dt;
    if (p.life <= 0) game.particles.splice(i, 1);
  }
  for (let i = game.popups.length - 1; i >= 0; i--) {
    const pop = game.popups[i];
    pop.life -= dt;
    pop.y -= 34 * dt;
    if (pop.life <= 0) game.popups.splice(i, 1);
  }
  if (game.toastTime > 0) game.toastTime -= dt;
}

// ---------- demo scenes (frozen mid-game states for screenshots) ----------

function seedDemo(scene) {
  game.demo = true;
  game.phase = 'playing';
  game.toast = '';
  game.toastTime = 0;
  if (scene === 'cover') {
    game.elapsed = 54;
    game.timeLeft = 96;
    game.score = 340;
    game.combo = 3;
    game.bestCombo = 3;
    game.served = 4;
    game.level = 2;
    game.orders = [
      { id: 1, recipe: { id: 'burger', name: 'Classic Burger', items: ['bun', 'patty-cooked', 'lettuce-chopped'], price: 100 }, customer: 'Mia', patience: 0.8, patienceMax: 45, age: 9 },
      { id: 2, recipe: { id: 'salad', name: 'Garden Salad', items: ['lettuce-chopped', 'tomato-chopped', 'onion-chopped'], price: 120 }, customer: 'Leo', patience: 0.55, patienceMax: 45, age: 20 },
      { id: 3, recipe: { id: 'fries', name: 'Crispy Fries', items: ['fries'], price: 60 }, customer: 'Zoe', patience: 0.9, patienceMax: 45, age: 4 },
    ];
    game.plate = ['bun', 'patty-cooked']; // mid-assembly: one item short of a burger
    game.chef = { x: 1060, y: 470, dir: { x: 0, y: -1 }, walking: false, carrying: 'lettuce-chopped' };
    game.board = { item: 'tomato', progress: 0.55 };
    game.grill = [{ item: 'patty', t: 0.7 }, null, { item: 'patty', t: 1.25 }];
    game.fryer = [{ item: 'potato', t: 0.85 }, null];
  } else if (scene === 'rush') {
    game.elapsed = 108;
    game.timeLeft = 42;
    game.score = 860;
    game.combo = 5;
    game.bestCombo = 5;
    game.served = 11;
    game.level = 3;
    game.rush = true;
    game.rushFlash = 0.4;
    game.orders = [
      { id: 1, recipe: { id: 'deluxe', name: 'Deluxe Stack', items: ['bun', 'patty-cooked', 'cheese', 'lettuce-chopped', 'tomato-chopped'], price: 200 }, customer: 'Ruby', patience: 0.22, patienceMax: 30, age: 23 },
      { id: 2, recipe: { id: 'cheeseburger', name: 'Cheese Melt', items: ['bun', 'patty-cooked', 'cheese', 'tomato-chopped'], price: 150 }, customer: 'Finn', patience: 0.45, patienceMax: 30, age: 16 },
      { id: 3, recipe: { id: 'burger', name: 'Classic Burger', items: ['bun', 'patty-cooked', 'lettuce-chopped'], price: 100 }, customer: 'Ivy', patience: 0.6, patienceMax: 30, age: 12 },
      { id: 4, recipe: { id: 'salad', name: 'Garden Salad', items: ['lettuce-chopped', 'tomato-chopped', 'onion-chopped'], price: 120 }, customer: 'Sam', patience: 0.35, patienceMax: 30, age: 19 },
    ];
    game.plate = ['bun', 'patty-cooked', 'cheese', 'tomato-chopped']; // complete Cheese Melt, ready to serve
    game.chef = { x: 1090, y: 250, dir: { x: 0, y: -1 }, walking: false, carrying: null };
    game.board = { item: 'onion', progress: 0.8 };
    game.grill = [{ item: 'patty', t: 0.9 }, { item: 'patty', t: 0.3 }, { item: 'patty', t: 1.6 }];
    game.fryer = [{ item: 'potato', t: 0.6 }, { item: 'potato', t: 0.95 }];
  } else {
    // 'play': an ordinary mid-shift moment.
    game.elapsed = 32;
    game.timeLeft = 118;
    game.score = 120;
    game.combo = 1;
    game.bestCombo = 2;
    game.served = 2;
    game.level = 1;
    game.orders = [
      { id: 1, recipe: { id: 'burger', name: 'Classic Burger', items: ['bun', 'patty-cooked', 'lettuce-chopped'], price: 100 }, customer: 'Luna', patience: 0.85, patienceMax: 45, age: 7 },
      { id: 2, recipe: { id: 'fries', name: 'Crispy Fries', items: ['fries'], price: 60 }, customer: 'Omar', patience: 0.7, patienceMax: 45, age: 13 },
    ];
    game.plate = ['bun'];
    game.chef = { x: 560, y: 450, dir: { x: 0, y: -1 }, walking: false, carrying: 'patty-cooked' };
    game.board = null;
    game.grill = [{ item: 'patty', t: 0.4 }, null, null];
    game.fryer = [{ item: 'potato', t: 0.25 }, null];
  }
  game.matchingOrder = findMatchingOrder(game.plate, game.orders);
}

// ---------- the loop ----------

let lastTime = performance.now();
let animTime = 0;

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  animTime += dt;

  if (input.wasPressed('m')) {
    const muted = sfx.toggleMute();
    say(muted ? 'Sound off' : 'Sound on');
  }

  if (game.phase === 'title') {
    if (input.wasPressed('enter') || input.consumeClick()) {
      sfx.unlock();
      resetShift();
    }
  } else if (game.phase === 'playing') {
    updatePlaying(dt);
  } else if (game.phase === 'over') {
    if (input.wasPressed('r') || input.consumeClick()) {
      sfx.unlock();
      resetShift();
    }
  }

  drawGame(ctx, game, animTime);
  input.consumePressed();
  requestAnimationFrame(frame);
}

// A ?demo=cover|play|rush URL opens a frozen mid-game scene (used for
// screenshots); without it the game opens on its title screen.
const demoScene = new URLSearchParams(window.location.search).get('demo');
if (demoScene) {
  seedDemo(demoScene);
} else {
  game.orders = [];
}
requestAnimationFrame(frame);
