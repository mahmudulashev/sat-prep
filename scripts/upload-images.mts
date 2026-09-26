/**
 * Copies question images to the public Supabase Storage bucket
 * "question-images" under NEXT_PUBLIC_ASSET_BASE's folder, so they are served
 * from Supabase's CDN. Images already there are skipped.
 *
 *   npm run upload:images
 *
 * Uploading needs a storage insert policy for that folder (or a secret key);
 * see README.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const base = process.env.NEXT_PUBLIC_ASSET_BASE; // .../storage/v1/object/public/question-images/<folder>
if (!url || !key || !base) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, a Supabase key or NEXT_PUBLIC_ASSET_BASE.");
  process.exit(1);
}
const folder = base.split("/object/public/")[1];

const dir = new URL("../content/official/assets/", import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith(".png"));

let done = 0;
let uploaded = 0;
let failed = 0;
async function upload(file: string) {
  const head = await fetch(`${base}/${file}`, { method: "HEAD" });
  if (head.ok) return;
  const response = await fetch(`${url}/storage/v1/object/${folder}/${file}`, {
    method: "POST",
    headers: {
      apikey: key!,
      "Content-Type": "image/png",
      "Cache-Control": "max-age=31536000",
      "x-upsert": "false",
    },
    body: readFileSync(new URL(file, dir)),
  });
  if (response.ok || response.status === 409) uploaded += 1;
  else {
    failed += 1;
    if (failed <= 3) console.error(`\n${file}: ${response.status} ${(await response.text()).slice(0, 200)}`);
  }
}

const queue = [...files];
await Promise.all(
  Array.from({ length: 12 }, async () => {
    for (let file = queue.shift(); file; file = queue.shift()) {
      await upload(file);
      done += 1;
      if (done % 50 === 0) process.stdout.write(`\r  ${done}/${files.length}`);
    }
  }),
);
console.log(`\n${files.length} images: ${uploaded} uploaded, ${files.length - uploaded - failed} already there, ${failed} failed.`);
if (failed) process.exit(1);
