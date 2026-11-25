// input.js — keyboard and mouse state for Sizzle & Serve.
// The game reads this each frame; it owns no game logic of its own.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set(); // keys pressed since last frame was consumed
  let moveTarget = null; // {x, y} in canvas pixels, or null
  let clickStation = null; // station id the player clicked (walk-to + interact)
  let interactHeld = false;
  let interactPressed = false;
  let anyClick = false;

  function canvasPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(event.key.toLowerCase());
    keys.add(event.key.toLowerCase());
    if (event.key === 'e' || event.key === 'E' || event.key === ' ') {
      interactHeld = true;
      interactPressed = true;
    }
  });

  window.addEventListener('keyup', (event) => {
    keys.delete(event.key.toLowerCase());
    if (event.key === 'e' || event.key === 'E' || event.key === ' ') interactHeld = false;
  });

  window.addEventListener('blur', () => {
    keys.clear();
    interactHeld = false;
  });

  canvas.addEventListener('mousedown', (event) => {
    const point = canvasPoint(event.clientX, event.clientY);
    moveTarget = point;
    clickStation = null;
    anyClick = true;
  });

  return {
    // Held movement keys as a unit vector {x, y} (0 when none held).
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x !== 0 && y !== 0) {
        const len = Math.hypot(x, y);
        x /= len;
        y /= len;
      }
      return { x, y };
    },
    hasKeyboardMove() {
      return (
        keys.has('a') || keys.has('d') || keys.has('w') || keys.has('s') ||
        keys.has('arrowleft') || keys.has('arrowright') || keys.has('arrowup') || keys.has('arrowdown')
      );
    },
    wasPressed(key) {
      return pressed.has(key.toLowerCase());
    },
    consumePressed() {
      pressed.clear();
    },
    interactHeld() {
      return interactHeld;
    },
    consumeInteractPress() {
      const was = interactPressed;
      interactPressed = false;
      return was;
    },
    moveTarget() {
      return moveTarget;
    },
    setMoveTarget(point) {
      moveTarget = point;
    },
    clearMoveTarget() {
      moveTarget = null;
    },
    clickStation() {
      return clickStation;
    },
    setClickStation(id) {
      clickStation = id;
    },
    clearClickStation() {
      clickStation = null;
    },
    consumeClick() {
      const was = anyClick;
      anyClick = false;
      return was;
    },
  };
}
