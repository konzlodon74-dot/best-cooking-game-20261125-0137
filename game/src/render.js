// render.js — every pixel of Sizzle & Serve, drawn with plain canvas 2D.
// All food, the chef and the kitchen are original vector art: no images.

import { INGREDIENTS } from './orders.js';
import { STATIONS, WORLD } from './kitchen.js';

// ---------- tiny drawing helpers ----------

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.font = `${weight || 'bold'} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---------- food icons (drawn, never images) ----------

export function drawIngredient(ctx, id, x, y, s) {
  const u = s / 32; // unit scale: icons are drawn in a 32-unit box
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 1.6 * u;
  ctx.strokeStyle = 'rgba(60,30,10,0.35)';
  switch (id) {
    case 'bun':
      ctx.fillStyle = '#e8b06a';
      ctx.beginPath();
      ctx.arc(0, 2 * u, 13 * u, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff3d6';
      ctx.fillRect(-13 * u, 2 * u, 26 * u, 3 * u);
      ctx.fillStyle = '#c98f4e';
      ctx.beginPath(); ctx.arc(-6 * u, -6 * u, 1.4 * u, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(2 * u, -9 * u, 1.4 * u, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(7 * u, -5 * u, 1.4 * u, 0, Math.PI * 2); ctx.fill();
      break;
    case 'patty':
      ctx.fillStyle = '#8a5a3b';
      roundRect(ctx, -13 * u, -5 * u, 26 * u, 11 * u, 5 * u);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a9744f';
      ctx.beginPath(); ctx.arc(-6 * u, -1 * u, 2 * u, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(5 * u, 1 * u, 2 * u, 0, Math.PI * 2); ctx.fill();
      break;
    case 'patty-cooked':
      ctx.fillStyle = '#6e4527';
      roundRect(ctx, -13 * u, -5 * u, 26 * u, 11 * u, 5 * u);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#3d2412';
      ctx.beginPath(); ctx.moveTo(-8 * u, -4 * u); ctx.lineTo(-8 * u, 4 * u); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -4 * u); ctx.lineTo(0, 4 * u); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8 * u, -4 * u); ctx.lineTo(8 * u, 4 * u); ctx.stroke();
      break;
    case 'patty-burnt':
      ctx.fillStyle = '#241a12';
      roundRect(ctx, -13 * u, -5 * u, 26 * u, 11 * u, 5 * u);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#555';
      ctx.beginPath(); ctx.moveTo(-9 * u, -2 * u); ctx.lineTo(9 * u, 2 * u); ctx.stroke();
      break;
    case 'tomato':
      ctx.fillStyle = '#e5484d';
      ctx.beginPath(); ctx.arc(0, 1 * u, 12 * u, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4d9b47';
      ctx.beginPath(); ctx.moveTo(0, -10 * u); ctx.lineTo(-5 * u, -14 * u); ctx.lineTo(0, -8 * u); ctx.lineTo(5 * u, -14 * u); ctx.lineTo(0, -10 * u); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(-4 * u, -4 * u, 3 * u, 0, Math.PI * 2); ctx.fill();
      break;
    case 'tomato-chopped':
      ctx.fillStyle = '#f26d6d';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.arc(i * 8 * u, 0, 6.5 * u, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffd9d9';
        ctx.beginPath(); ctx.arc(i * 8 * u, 0, 3 * u, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f26d6d';
      }
      break;
    case 'lettuce':
      ctx.fillStyle = '#5da24a';
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        ctx.lineTo(Math.cos(a) * 12 * u, Math.sin(a) * 10 * u + (i % 2 ? 2 * u : -1 * u));
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#3e7a33';
      ctx.beginPath(); ctx.moveTo(0, -8 * u); ctx.lineTo(0, 8 * u); ctx.stroke();
      break;
    case 'lettuce-chopped':
      ctx.strokeStyle = '#3e7a33';
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i % 2 ? '#7cc46a' : '#5da24a';
        ctx.beginPath();
        ctx.ellipse((i - 1) * 8 * u, (i % 2 ? 3 : -3) * u, 7 * u, 4.5 * u, (i - 1) * 0.5, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      }
      break;
    case 'cheese':
      ctx.fillStyle = '#ffc93c';
      ctx.beginPath();
      ctx.moveTo(-12 * u, 8 * u); ctx.lineTo(12 * u, 8 * u); ctx.lineTo(12 * u, -6 * u); ctx.lineTo(-12 * u, -6 * u);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8a91c';
      ctx.beginPath(); ctx.arc(-5 * u, 1 * u, 2 * u, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(4 * u, 1 * u, 2 * u, 0, Math.PI * 2); ctx.fill();
      break;
    case 'onion':
      ctx.fillStyle = '#b678d8';
      ctx.beginPath(); ctx.arc(0, 1 * u, 11 * u, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#e8d5f5';
      ctx.beginPath(); ctx.arc(0, 1 * u, 7 * u, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 1 * u, 3.5 * u, 0, Math.PI * 2); ctx.stroke();
      break;
    case 'onion-chopped':
      ctx.strokeStyle = '#9a5cc0';
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? '#e8d5f5' : '#cfa8ec';
        ctx.beginPath(); ctx.arc((i - 1.5) * 6.5 * u, (i % 2 ? 4 : -4) * u, 4.5 * u, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      }
      break;
    case 'potato':
      ctx.fillStyle = '#d9a05b';
      ellipse(ctx, 0, 1 * u, 12 * u, 9 * u);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#b98343';
      ctx.beginPath(); ctx.arc(-4 * u, -2 * u, 1.6 * u, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(4 * u, 3 * u, 1.6 * u, 0, Math.PI * 2); ctx.fill();
      break;
    case 'fries': {
      ctx.fillStyle = '#d9382b';
      roundRect(ctx, -11 * u, -2 * u, 22 * u, 14 * u, 2 * u);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f2c14e';
      for (let i = -2; i <= 2; i++) {
        ctx.fillRect((i * 4.4 - 1.5) * u, (-14 + (i % 2) * 2) * u, 3 * u, 14 * u);
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 5 * u, 2.4 * u, 0, Math.PI * 2); ctx.fill();
      break;
    }
    default:
      ctx.fillStyle = '#999';
      ctx.beginPath(); ctx.arc(0, 0, 10 * u, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ---------- the kitchen ----------

function drawFloor(ctx, t) {
  // Warm tiled floor with a soft checker and a rug in the middle.
  ctx.fillStyle = '#e9cfa3';
  ctx.fillRect(0, WORLD.floorTop, WORLD.width, WORLD.height - WORLD.floorTop);
  ctx.fillStyle = '#e2c491';
  const tile = 64;
  for (let y = WORLD.floorTop; y < WORLD.height; y += tile) {
    for (let x = ((y / tile) % 2) * tile / 2; x < WORLD.width; x += tile) {
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = 'rgba(120,80,40,0.12)';
  ctx.lineWidth = 1;
  for (let y = WORLD.floorTop; y < WORLD.height; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.width, y); ctx.stroke();
  }
  for (let x = 0; x < WORLD.width; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, WORLD.floorTop); ctx.lineTo(x, WORLD.height); ctx.stroke();
  }
  // Rug under the work area.
  ctx.fillStyle = '#c65b4e';
  roundRect(ctx, 380, 460, 520, 190, 16);
  ctx.fill();
  ctx.strokeStyle = '#f2d8a0';
  ctx.lineWidth = 4;
  roundRect(ctx, 396, 476, 488, 158, 10);
  ctx.stroke();
}

function drawStationBase(ctx, s, active) {
  ctx.fillStyle = active ? '#8a5a33' : '#7a4e2c';
  roundRect(ctx, s.x, s.y, s.w, s.h, 8);
  ctx.fill();
  ctx.fillStyle = active ? '#a9744f' : '#96683f';
  roundRect(ctx, s.x + 4, s.y + 4, s.w - 8, s.h - 14, 6);
  ctx.fill();
  // The chopping board and the plating counter print their own status along
  // the bottom edge instead of a fixed label.
  if (s.kind === 'board' || s.kind === 'assembly') return;
  ctx.fillStyle = '#fff8ea';
  text(ctx, s.label, s.x + s.w / 2, s.y + s.h - 8, 12, '#fff8ea', 'bold');
}

function drawProgressBar(ctx, x, y, w, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, x, y, w, 9, 4);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x + 1, y + 1, Math.max(2, (w - 2) * Math.min(1, frac)), 7, 3);
  ctx.fill();
}

function drawPlate(ctx, x, y, items, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#e8e8e8';
  ellipse(ctx, 0, 0, 34, 12);
  ctx.fill();
  ctx.strokeStyle = '#b8b8b8';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, 0, -1, 27, 9);
  ctx.fill();
  // Stack the dish's ingredients on the plate, bottom to top.
  items.forEach((item, i) => {
    drawIngredient(ctx, item, 0, -6 - i * 7, 26);
  });
  ctx.restore();
}

function drawStations(ctx, game, t) {
  for (const s of STATIONS) {
    const active = game.nearestStation && game.nearestStation.id === s.id;
    if (s.kind === 'serve') {
      // The pass: a wide red counter with a service bell and a hatch.
      ctx.fillStyle = active ? '#a03d2e' : '#8c3428';
      roundRect(ctx, s.x, s.y, s.w, s.h, 8);
      ctx.fill();
      ctx.fillStyle = '#c65b4e';
      roundRect(ctx, s.x + 4, s.y + 4, s.w - 8, s.h - 16, 6);
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(s.x + 40, s.y + 26, 13, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillRect(s.x + 27, s.y + 26, 26, 4);
      text(ctx, 'SERVE!', s.x + s.w / 2 + 24, s.y + 28, 22, '#fff8ea');
      text(ctx, 'hand the plate to a happy customer', s.x + s.w / 2 + 24, s.y + 52, 11, '#ffe1d6');
      continue;
    }
    if (s.kind === 'trash') {
      ctx.fillStyle = '#5b6470';
      roundRect(ctx, s.x, s.y, s.w, s.h, 8);
      ctx.fill();
      ctx.fillStyle = '#7d8794';
      roundRect(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 22, 5);
      ctx.fill();
      text(ctx, 'TRASH', s.x + s.w / 2, s.y + s.h - 8, 11, '#fff8ea');
      continue;
    }
    drawStationBase(ctx, s, active);

    if (s.kind === 'crate') {
      drawIngredient(ctx, s.item, s.x + s.w / 2, s.y + 26, 44);
      if (active) {
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3;
        roundRect(ctx, s.x - 3, s.y - 3, s.w + 6, s.h + 6, 10);
        ctx.stroke();
      }
    }
    if (s.kind === 'plates') {
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i === 2 ? '#ffffff' : '#e0e0e0';
        ellipse(ctx, s.x + s.w / 2, s.y + 22 - i * 5, 26, 8);
        ctx.fill();
        ctx.strokeStyle = '#b8b8b8';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // Chopping board contents.
  const board = STATIONS.find((s) => s.id === 'board');
  if (game.board) {
    drawIngredient(ctx, game.board.item, board.x + board.w / 2, board.y + 28, 46);
    drawProgressBar(ctx, board.x + 30, board.y + 56, board.w - 60, game.board.progress, '#ffd166');
    if (game.board.progress < 1) {
      text(ctx, 'HOLD E TO CHOP', board.x + board.w / 2, board.y + 70, 10, '#fff8ea');
    }
  } else {
    text(ctx, 'drop a veggie, hold E', board.x + board.w / 2, board.y + 30, 11, '#ffe9c9');
  }

  // Grill slots: raw patty browns, then burns if forgotten.
  const grill = STATIONS.find((s) => s.id === 'grill');
  game.grill.forEach((slot, i) => {
    const cx = grill.x + 48 + i * 92;
    const cy = grill.y + 30;
    ctx.fillStyle = '#3a3a3a';
    ellipse(ctx, cx, cy + 4, 34, 12);
    ctx.fill();
    if (slot) {
      const show = slot.t >= 2 ? 'patty-burnt' : slot.t >= 1 ? 'patty-cooked' : 'patty';
      drawIngredient(ctx, show, cx, cy - 4, 44);
      const frac = Math.min(1, slot.t);
      drawProgressBar(ctx, cx - 26, cy + 18, 52, frac, slot.t >= 2 ? '#e5484d' : '#ffb703');
      if (slot.t >= 1 && slot.t < 2) text(ctx, 'READY', cx, grill.y - 10, 12, '#ffe066');
      if (slot.t >= 2) text(ctx, 'BURNT!', cx, grill.y - 10, 12, '#ff6b6b');
      // Sizzle steam.
      if (slot.t < 2) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        const wob = Math.sin(t * 3 + i * 2) * 3;
        ctx.beginPath(); ctx.arc(cx + wob, cy - 22 - ((t * 14 + i * 9) % 12), 3, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      text(ctx, 'grill a patty', cx, cy, 10, '#d8b48f');
    }
  });

  // Fryer slots.
  const fryer = STATIONS.find((s) => s.id === 'fryer');
  game.fryer.forEach((slot, i) => {
    const cx = fryer.x + 52 + i * 96;
    const cy = fryer.y + 30;
    ctx.fillStyle = '#2f6fb2';
    roundRect(ctx, cx - 36, cy - 10, 72, 26, 6);
    ctx.fill();
    ctx.fillStyle = '#7fb3e8';
    roundRect(ctx, cx - 30, cy - 6, 60, 10, 4);
    ctx.fill();
    if (slot) {
      drawIngredient(ctx, slot.t >= 1 ? 'fries' : 'potato', cx, cy - 12, 40);
      drawProgressBar(ctx, cx - 26, cy + 20, 52, Math.min(1, slot.t), '#ffd166');
      if (slot.t >= 1) text(ctx, 'READY', cx, fryer.y - 10, 12, '#ffe066');
    } else {
      text(ctx, 'fry a potato', cx, cy + 2, 10, '#ffe9c9');
    }
  });

  // Assembly counter: the plate being built, mid-assembly.
  const asm = STATIONS.find((s) => s.id === 'assembly');
  if (game.plate.length > 0) {
    drawPlate(ctx, asm.x + asm.w / 2, asm.y + 34, game.plate, 1.5);
    const match = game.matchingOrder;
    if (match) {
      const pulse = 0.6 + 0.4 * Math.sin(t * 6);
      ctx.fillStyle = `rgba(80,200,90,${pulse})`;
      roundRect(ctx, asm.x + 8, asm.y + 52, asm.w - 16, 20, 8);
      ctx.fill();
      text(ctx, `READY — ${match.recipe.name.toUpperCase()}!`, asm.x + asm.w / 2, asm.y + 62, 12, '#ffffff');
    } else {
      text(ctx, `${game.plate.length} item${game.plate.length > 1 ? 's' : ''} on the plate`, asm.x + asm.w / 2, asm.y + 64, 11, '#fff8ea');
    }
  } else {
    ctx.fillStyle = '#e8e8e8';
    ellipse(ctx, asm.x + asm.w / 2, asm.y + 30, 40, 13);
    ctx.fill();
    ctx.strokeStyle = '#b8b8b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, 'add ingredients here', asm.x + asm.w / 2, asm.y + 58, 11, '#ffe9c9');
  }

  // Active-station hint ring.
  if (game.nearestStation) {
    const s = game.nearestStation;
    if (s.kind !== 'crate' && s.kind !== 'serve') {
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 3;
      roundRect(ctx, s.x - 3, s.y - 3, s.w + 6, s.h + 6, 10);
      ctx.stroke();
    }
  }
}

// ---------- the chef ----------

function drawChef(ctx, chef, t) {
  const bob = chef.walking ? Math.sin(t * 14) * 2 : Math.sin(t * 2) * 1;
  const x = chef.x;
  const y = chef.y + bob * 0.4;

  // Shadow.
  ctx.fillStyle = 'rgba(60,30,10,0.25)';
  ellipse(ctx, x, chef.y + 20, 22, 7);
  ctx.fill();

  // Body (white coat) and apron.
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x - 16, y - 6, 32, 30, 10);
  ctx.fill();
  ctx.fillStyle = '#3f7fb5';
  roundRect(ctx, x - 12, y + 2, 24, 18, 6);
  ctx.fill();

  // Arms.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath(); ctx.arc(x - 18, y + 8, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 18, y + 8, 6, 0, Math.PI * 2); ctx.fill();

  // Head.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath(); ctx.arc(x, y - 16, 14, 0, Math.PI * 2); ctx.fill();
  // Eyes look where the chef walks.
  ctx.fillStyle = '#241a12';
  const look = chef.dir.x * 3;
  ctx.beginPath(); ctx.arc(x - 5 + look, y - 17, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 5 + look, y - 17, 2, 0, Math.PI * 2); ctx.fill();
  // Smile.
  ctx.strokeStyle = '#7a4e2c';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(x, y - 12, 5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();

  // Tall chef hat.
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x - 13, y - 40, 26, 14, 6);
  ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - 40, 13, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#d8d8d8';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y - 40, 13, Math.PI, 0); ctx.stroke();

  // Carried ingredient, held high.
  if (chef.carrying) {
    drawIngredient(ctx, chef.carrying, x, y - 52 - Math.sin(t * 3) * 2, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ellipse(ctx, x, y - 52, 18, 6);
    ctx.fill();
    drawIngredient(ctx, chef.carrying, x, y - 56, 40);
    const name = INGREDIENTS[chef.carrying].name;
    text(ctx, name, x, y - 74, 11, '#5b3a1e');
  }
}

// ---------- HUD: order board, timer, score ----------

function drawHud(ctx, game, t) {
  // Top bar.
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(0, 0, WORLD.width, WORLD.hudHeight);
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(0, WORLD.hudHeight - 4, WORLD.width, 4);

  // Order tickets.
  text(ctx, 'ORDER BOARD', 16, 14, 12, '#ffd166', 'bold', 'left');
  game.orders.forEach((order, i) => {
    const x = 16 + i * 208;
    const y = 22;
    const w = 200;
    const h = 72;
    const urgent = order.patience < 0.3;
    ctx.fillStyle = urgent && Math.sin(t * 8) > 0 ? '#8c3428' : '#fff8ea';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#e5484d' : '#d9b380';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, `${order.customer} — ${order.recipe.name}`, x + 10, y + 13, 12, '#5b3a1e', 'bold', 'left');
    // Recipe icons in a row.
    order.recipe.items.forEach((item, j) => {
      drawIngredient(ctx, item, x + 24 + j * 34, y + 38, 28);
    });
    // Patience bar.
    const barColor = order.patience > 0.5 ? '#5da24a' : order.patience > 0.25 ? '#ffb703' : '#e5484d';
    drawProgressBar(ctx, x + 10, y + h - 14, w - 20, order.patience, barColor);
  });
  if (game.orders.length === 0) {
    text(ctx, 'No orders — take a breath!', 220, 58, 13, '#ffe9c9', 'bold', 'left');
  }

  // Shift timer (centre-right).
  const tx = 862;
  const ty = 12;
  const lowTime = game.timeLeft <= 30;
  ctx.fillStyle = lowTime && Math.sin(t * 6) > 0 ? '#8c3428' : '#241a12';
  roundRect(ctx, tx, ty, 150, 80, 10);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, game.rush ? 'RUSH HOUR!' : 'SHIFT TIMER', tx + 75, ty + 16, 12, '#ffd166');
  const mins = Math.floor(Math.max(0, game.timeLeft) / 60);
  const secs = Math.floor(Math.max(0, game.timeLeft) % 60);
  text(ctx, `${mins}:${secs.toString().padStart(2, '0')}`, tx + 75, ty + 50, 34, lowTime ? '#ff8a80' : '#ffffff');
  // Level pips.
  text(ctx, `LEVEL ${game.level}`, tx + 75, ty + 72, 10, '#ffe9c9');

  // Score + combo.
  const sx = 1024;
  ctx.fillStyle = '#241a12';
  roundRect(ctx, sx, ty, 240, 80, 10);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'SCORE', sx + 16, ty + 16, 12, '#ffd166', 'bold', 'left');
  text(ctx, String(game.score), sx + 16, ty + 44, 30, '#ffffff', 'bold', 'left');
  text(ctx, `served ${game.served}`, sx + 150, ty + 22, 12, '#ffe9c9', 'bold', 'left');
  if (game.combo >= 2) {
    const pulse = 0.7 + 0.3 * Math.sin(t * 5);
    ctx.fillStyle = `rgba(255,183,3,${pulse})`;
    roundRect(ctx, sx + 138, ty + 38, 92, 30, 8);
    ctx.fill();
    text(ctx, `COMBO x${game.combo}`, sx + 184, ty + 53, 14, '#3a2a1a');
  } else {
    text(ctx, 'serve fast!', sx + 150, ty + 52, 11, '#ffe9c9', 'bold', 'left');
  }

  // Toast message under the HUD.
  if (game.toast && game.toastTime > 0) {
    ctx.fillStyle = 'rgba(36,26,18,0.85)';
    const tw = ctx.measureText(game.toast).width + 36;
    roundRect(ctx, WORLD.width / 2 - tw / 2, WORLD.hudHeight + 8, tw, 30, 15);
    ctx.fill();
    text(ctx, game.toast, WORLD.width / 2, WORLD.hudHeight + 24, 14, '#ffd166');
  }
}

// ---------- particles & popups ----------

function drawParticles(ctx, game) {
  for (const p of game.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const pop of game.popups) {
    ctx.globalAlpha = Math.max(0, pop.life / pop.maxLife);
    text(ctx, pop.text, pop.x, pop.y, pop.size || 22, pop.color || '#ffd166');
  }
  ctx.globalAlpha = 1;
}

// ---------- overlays ----------

function drawTitle(ctx, game, t) {
  ctx.fillStyle = 'rgba(36,26,18,0.72)';
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  const cx = WORLD.width / 2;
  const bob = Math.sin(t * 2) * 4;
  text(ctx, 'SIZZLE & SERVE', cx, 190 + bob, 64, '#ffd166');
  text(ctx, 'a fast little kitchen game', cx, 240 + bob, 22, '#fff8ea');
  // A sample plate, drawn big.
  drawPlate(ctx, cx, 330, ['bun', 'patty-cooked', 'lettuce-chopped'], 2.6);
  text(ctx, 'Take orders from the board. Chop, grill and fry.', cx, 430, 18, '#fff8ea');
  text(ctx, 'Build each dish on the plating counter, then serve it at the pass', cx, 458, 18, '#fff8ea');
  text(ctx, 'before the customer loses patience. Rush hour gets busy!', cx, 486, 18, '#fff8ea');
  const pulse = 0.75 + 0.25 * Math.sin(t * 4);
  ctx.fillStyle = `rgba(255,209,102,${pulse})`;
  roundRect(ctx, cx - 190, 540, 380, 56, 12);
  ctx.fill();
  text(ctx, 'PRESS ENTER OR CLICK TO START', cx, 569, 20, '#3a2a1a');
  text(ctx, 'WASD / arrows or click to move  ·  E / Space to interact (hold to chop)', cx, 630, 14, '#e8d9b8');
}

function drawGameOver(ctx, game) {
  ctx.fillStyle = 'rgba(36,26,18,0.78)';
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  const cx = WORLD.width / 2;
  text(ctx, "SHIFT OVER!", cx, 200, 56, '#ffd166');
  text(ctx, `Final score: ${game.score}`, cx, 280, 30, '#ffffff');
  text(ctx, `Dishes served: ${game.served}    Best combo: x${game.bestCombo}    Walk-outs: ${game.failed}`, cx, 330, 18, '#fff8ea');
  const verdict =
    game.score >= 1200 ? 'Head-chef material! The kitchen is yours.' :
    game.score >= 700 ? 'Solid service! The regulars will be back.' :
    game.score >= 300 ? 'A decent shift — the rush got the better of you.' :
    'A tough shift. The grill forgives, the customers do not.';
  text(ctx, verdict, cx, 380, 18, '#ffe9c9');
  text(ctx, 'PRESS R TO COOK AGAIN', cx, 470, 22, '#ffd166');
}

// ---------- master draw ----------

export function drawGame(ctx, game, t) {
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);
  drawFloor(ctx, t);
  drawStations(ctx, game, t);
  drawChef(ctx, game.chef, t);
  drawParticles(ctx, game);
  drawHud(ctx, game, t);
  if (game.phase === 'title') drawTitle(ctx, game, t);
  if (game.phase === 'over') drawGameOver(ctx, game);
  if (game.rush && game.phase === 'playing' && game.rushFlash > 0) {
    ctx.fillStyle = `rgba(230,72,77,${0.25 * game.rushFlash})`;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    text(ctx, 'RUSH HOUR!', WORLD.width / 2, 150, 44, '#e5484d');
  }
}
