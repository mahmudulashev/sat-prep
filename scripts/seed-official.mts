/**
 * Uploads the private official question set built by
 * scripts/official/extract.py (content/official/, git-ignored) to Supabase.
 *
 *   npm run seed:official
 *
 * Images are uploaded once (skipped if already stored); questions and test
 * forms are upserted.
 */
import { existsSync, readFileSync } from "node:fs";

const DIR = new URL("../content/official/", import.meta.url);
const BATCH_BYTES = 3_000_000;

if (!existsSync(new URL("official.json", DIR))) {
  console.error("content/official/official.json not found. Run: python3 scripts/official/extract.py");
  process.exit(1);
}
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.EXAM_SERVER_SECRET;
if (!url || !key || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or EXAM_SERVER_SECRET.");
  process.exit(1);
}

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: key!, "Content-Type": "application/json" },
    body: JSON.stringify({ p_secret: secret, ...body }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${name} failed (${response.status}): ${text.slice(0, 500)}`);
  return JSON.parse(text) as T;
}

type Question = { id: string; prompt: string; choices: string[] | null; stimulus: { type: string; asset?: string; width?: number; height?: number }[]; explanation: string };
const { questions, forms } = JSON.parse(readFileSync(new URL("official.json", DIR), "utf8")) as {
  questions: Question[];
  forms: { id: string; modules: { question_ids: string[]; adaptive?: { lower: string[]; upper: string[] } }[] }[];
};

// Every image referenced by the content, with its display size.
const sizes = new Map<string, { width: number; height: number }>();
const TOKEN = /\{\{img:([0-9a-f]+):(\d+):(\d+)\}\}/g;
for (const q of questions) {
  for (const text of [q.prompt, q.explanation, ...(q.choices ?? []), ...q.stimulus.map((b) => ("text" in b ? String(b.text) : ""))]) {
    for (const m of text.matchAll(TOKEN)) sizes.set(m[1], { width: Number(m[2]), height: Number(m[3]) });
  }
  for (const b of q.stimulus) if (b.type === "image" && b.asset) sizes.set(b.asset, { width: b.width!, height: b.height! });
}

// Validate forms reference known questions.
const ids = new Set(questions.map((q) => q.id));
for (const f of forms) {
  for (const m of f.modules) {
    for (const id of [...m.question_ids, ...(m.adaptive?.lower ?? []), ...(m.adaptive?.upper ?? [])]) {
      if (!ids.has(id)) throw new Error(`${f.id}: unknown question ${id}`);
    }
  }
}

const existing = new Set(await rpc<string[]>("asset_ids", {}));
const missing = [...sizes.keys()].filter((id) => !existing.has(id));
console.log(`${sizes.size} images referenced, ${missing.length} to upload.`);

let batch: Record<string, unknown>[] = [];
let bytes = 0;
let uploaded = 0;
const flush = async () => {
  if (!batch.length) return;
  uploaded += await rpc<number>("seed_assets", { p_assets: batch });
  process.stdout.write(`\r  uploaded ${uploaded}/${missing.length}`);
  batch = [];
  bytes = 0;
};
for (const id of missing) {
  const data = readFileSync(new URL(`assets/${id}.png`, DIR)).toString("base64");
  batch.push({ id, mime: "image/png", ...sizes.get(id), data });
  bytes += data.length;
  if (bytes > BATCH_BYTES) await flush();
}
await flush();
if (missing.length) process.stdout.write("\n");

const result = await rpc<unknown>("seed_content", { p_questions: questions, p_forms: forms });
console.log("Questions and tests:", result);
