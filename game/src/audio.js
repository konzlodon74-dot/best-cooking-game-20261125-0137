// audio.js — tiny WebAudio bleeps for Sizzle & Serve. No audio files,
// no network: every sound is synthesized on the spot. Silent until the
// player first interacts (browsers require a gesture to start audio).

let context = null;
let muted = false;

function ensureContext() {
  if (!context) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  }
  if (context.state === 'suspended') context.resume();
  return context;
}

function tone(freq, duration, type, volume, slideTo) {
  if (muted) return;
  const ctx = ensureContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  gain.gain.setValueAtTime(volume || 0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function noiseBurst(duration, volume, lowFreq) {
  if (muted) return;
  const ctx = ensureContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowFreq || 1200;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume || 0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
}

export const sfx = {
  unlock() {
    ensureContext();
  },
  toggleMute() {
    muted = !muted;
    return muted;
  },
  isMuted() {
    return muted;
  },
  pickup() {
    tone(660, 0.09, 'triangle', 0.12, 880);
  },
  place() {
    tone(440, 0.08, 'triangle', 0.1, 330);
  },
  chop() {
    noiseBurst(0.07, 0.2, 900);
    tone(180, 0.06, 'square', 0.06);
  },
  sizzle() {
    noiseBurst(0.35, 0.1, 2400);
  },
  ding() {
    tone(880, 0.18, 'sine', 0.14);
    setTimeout(() => tone(1318, 0.28, 'sine', 0.12), 90);
  },
  coin() {
    tone(988, 0.1, 'triangle', 0.12);
    setTimeout(() => tone(1319, 0.22, 'triangle', 0.12), 80);
  },
  buzz() {
    tone(160, 0.3, 'sawtooth', 0.12, 110);
  },
  rush() {
    tone(523, 0.12, 'square', 0.08);
    setTimeout(() => tone(659, 0.12, 'square', 0.08), 120);
    setTimeout(() => tone(784, 0.2, 'square', 0.09), 240);
  },
  pop() {
    tone(520, 0.07, 'sine', 0.1, 760);
  },
};
