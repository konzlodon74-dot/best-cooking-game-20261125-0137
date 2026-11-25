// orders.js — ingredients, recipes, the order board and scoring.
// Nothing here touches the canvas; it only knows what a dish is.

// Ingredient catalogue. `chopped` is the item id a raw vegetable becomes
// on the chopping board; `cooked` is what a raw patty becomes on the grill.
export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8b06a', raw: true },
  patty: { name: 'Patty', color: '#8a5a3b', raw: true, cooked: 'patty-cooked' },
  'patty-cooked': { name: 'Grilled Patty', color: '#6e4527', cooked: true },
  'patty-burnt': { name: 'Burnt Patty', color: '#241a12', burnt: true },
  tomato: { name: 'Tomato', color: '#e5484d', raw: true, chopped: 'tomato-chopped' },
  'tomato-chopped': { name: 'Tomato Slices', color: '#f26d6d', chopped: true },
  lettuce: { name: 'Lettuce', color: '#5da24a', raw: true, chopped: 'lettuce-chopped' },
  'lettuce-chopped': { name: 'Shredded Lettuce', color: '#7cc46a', chopped: true },
  cheese: { name: 'Cheese', color: '#ffc93c', raw: true },
  onion: { name: 'Onion', color: '#b678d8', raw: true, chopped: 'onion-chopped' },
  'onion-chopped': { name: 'Diced Onion', color: '#cfa8ec', chopped: true },
  potato: { name: 'Potato', color: '#d9a05b', raw: true, cooked: 'fries' },
  fries: { name: 'Fries', color: '#f2c14e', cooked: true },
};

export const CHOPPABLE = ['tomato', 'lettuce', 'onion'];

// A recipe is the exact multiset of items a plate must hold.
export const RECIPES = [
  {
    id: 'burger',
    name: 'Classic Burger',
    items: ['bun', 'patty-cooked', 'lettuce-chopped'],
    price: 100,
    minLevel: 1,
  },
  {
    id: 'fries',
    name: 'Crispy Fries',
    items: ['fries'],
    price: 60,
    minLevel: 1,
  },
  {
    id: 'salad',
    name: 'Garden Salad',
    items: ['lettuce-chopped', 'tomato-chopped', 'onion-chopped'],
    price: 120,
    minLevel: 1,
  },
  {
    id: 'cheeseburger',
    name: 'Cheese Melt',
    items: ['bun', 'patty-cooked', 'cheese', 'tomato-chopped'],
    price: 150,
    minLevel: 2,
  },
  {
    id: 'deluxe',
    name: 'Deluxe Stack',
    items: ['bun', 'patty-cooked', 'cheese', 'lettuce-chopped', 'tomato-chopped'],
    price: 200,
    minLevel: 3,
  },
];

const CUSTOMERS = [
  'Mia', 'Leo', 'Zoe', 'Max', 'Ruby', 'Finn', 'Ivy', 'Sam',
  'Luna', 'Omar', 'Nina', 'Theo', 'Ada', 'Kai', 'June', 'Rex',
];

let orderCounter = 0;

export function randomRecipe(level) {
  const pool = RECIPES.filter((r) => r.minLevel <= level);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function makeOrder(level, rush) {
  const recipe = randomRecipe(level);
  const patienceMax = rush ? 30 : 45;
  return {
    id: ++orderCounter,
    recipe,
    customer: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
    patience: 1, // 1 = full, 0 = walked out
    patienceMax,
    age: 0,
  };
}

// Drain patience; returns true when the customer stormed out.
export function tickOrder(order, dt, rush) {
  order.age += dt;
  const drain = (rush ? 1.6 : 1) / order.patienceMax;
  order.patience = Math.max(0, order.patience - drain * dt);
  return order.patience <= 0;
}

// Does the plate's item list match the recipe exactly (order-free)?
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.items.length) return false;
  const have = [...plateItems].sort();
  const want = [...recipe.items].sort();
  return have.every((item, i) => item === want[i]);
}

export function findMatchingOrder(plateItems, orders) {
  return orders.find((order) => plateMatchesRecipe(plateItems, order.recipe)) || null;
}

// Score for a served dish: base price + a patience tip, times the combo.
export function scoreForServe(order, combo) {
  const tip = Math.round(50 * order.patience);
  const multiplier = Math.min(2, 1 + 0.1 * combo);
  return Math.round((order.recipe.price + tip) * multiplier);
}

export function levelForTime(elapsed, shiftLength) {
  const progress = elapsed / shiftLength;
  if (progress > 0.66) return 3;
  if (progress > 0.33) return 2;
  return 1;
}

export function isRush(elapsed, shiftLength) {
  return elapsed > shiftLength * 0.6;
}
