// VOID DECK — Every Card Rewrites the Rules.
// make.fun entry point for the "Make the best card game" bounty.
// Node 22, standard library only, no network, no build step.
// Packages the static game plus its screenshots into the output
// directory and writes dossier.json with the kit harness.

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildDossier } from "./vendor/makefun-game.ts";

const root = resolve(import.meta.dirname);
// Resolve to an absolute path so a relative MAKEFUN_OUTPUT_DIR still works.
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");

const gameSrc = join(root, "game");
const shotsSrc = join(root, "screenshots");

function fail(message: string): never {
  console.error(`VOID DECK pack error: ${message}`);
  process.exit(1);
}

if (!existsSync(join(gameSrc, "index.html"))) {
  fail(`game/index.html not found under ${gameSrc}`);
}
if (!existsSync(shotsSrc)) {
  fail(`screenshots/ not found under ${shotsSrc}`);
}

mkdirSync(outDir, { recursive: true });
cpSync(gameSrc, join(outDir, "game"), { recursive: true });
cpSync(shotsSrc, join(outDir, "screenshots"), { recursive: true });

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
};

const dossierBytes = buildDossier(outDir, caps);
writeFileSync(join(outDir, "dossier.json"), dossierBytes);
if (!existsSync(join(outDir, "game", "index.html")) || !existsSync(join(outDir, "dossier.json"))) {
  fail(`packaged output incomplete under ${outDir}`);
}

console.log(`VOID DECK packaged -> ${outDir} (dossier.json ${dossierBytes.length} bytes)`);
