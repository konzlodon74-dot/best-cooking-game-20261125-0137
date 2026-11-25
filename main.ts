// main.ts — hands in "Sizzle & Serve" for best-cooking-game-20261125-0137.
// Node 22, standard library only. It copies game/ and screenshots/ from
// this repository into the output directory and writes dossier.json there
// with the vendored make.fun library, so the sealed scorer can re-derive
// the same dossier byte for byte.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });

const gameDir = join(repoRoot, 'game');
cpSync(gameDir, join(outputDir, 'game'), { recursive: true });

const shotsDir = join(repoRoot, 'screenshots');
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The caps mirror the sealed scorer's limits, so a local run refuses an
// entry the scorer would refuse: at most 4 screenshots, each at most
// 256 KiB; game/ at most 993 files and 48 MiB, paths at most 1000 bytes;
// the dossier text at most 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(outputDir, 'dossier.json'), dossier);
