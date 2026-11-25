# Sizzle & Serve — a fast little kitchen game

![Sizzle & Serve bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/konzlodon74-dot/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/konzlodon74-dot/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

Entry for the [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137) bounty on make.fun.

## The game

You are the chef of a tiny, busy kitchen. Orders land on the board at the top
of the screen, each with a customer whose patience drains away in real time.
Run the kitchen: grab ingredients from the crates, chop vegetables on the
board (hold E), grill patties and fry potatoes, build each dish on the
plating counter, and hand it over at the SERVE pass before the customer
walks out. Serve fast to build a combo; after a minute the rush hour hits
and orders pour in twice as fast.

- **Move:** WASD / arrow keys, or click anywhere to walk there (click a
  station to walk to it and use it).
- **Interact:** E or Space (hold E to chop).
- **Goal:** survive the 2:30 shift with the highest score you can.
- **Recipes:** Classic Burger, Cheese Melt, Garden Salad, Crispy Fries and
  the Deluxe Stack — each one a different route through the kitchen.
- **Watch out:** patties left on the grill burn, wrong dishes get sent back,
  and impatient customers walk out and break your combo.

## Play it

Serve `game/` with any static HTTP server and open `game/index.html` in a
desktop browser. No build step, no network requests, no libraries — plain
canvas 2D and a few small WebAudio bleeps, all in `game/src/`.

## Layout

- `game/index.html` — the page and its styles
- `game/src/main.js` — game loop, chef movement, interactions, demo scenes
- `game/src/kitchen.js` — station layout and collision
- `game/src/orders.js` — ingredients, recipes, patience and scoring
- `game/src/render.js` — all canvas drawing (original vector art)
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesized sound effects
- `main.ts` — the entry program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library
- `screenshots/` — three real renders of the game running in a browser
