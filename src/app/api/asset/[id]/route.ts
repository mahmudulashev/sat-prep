import { publicEnv, serverEnv } from "@/lib/env";

// Images never change for a given id (the id is a hash of the file), so they
// are cached in memory here and for a year in the browser.
const cache = new Map<string, { mime: string; body: Uint8Array<ArrayBuffer> }>();
const MAX_CACHED = 800;

export async function GET(_request: Request, ctx: RouteContext<"/api/asset/[id]">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f]{16,64}$/.test(id)) return new Response("Not found", { status: 404 });

  let asset = cache.get(id);
  if (!asset) {
    const response = await fetch(`${publicEnv.supabaseUrl}/rest/v1/rpc/get_asset`, {
      method: "POST",
      headers: { apikey: publicEnv.supabaseKey, "Content-Type": "application/json" },
      body: JSON.stringify({ p_secret: serverEnv().examSecret, p_id: id }),
      cache: "no-store",
    });
    const data = response.ok ? ((await response.json()) as { mime: string; data: string } | null) : null;
    if (!data) return new Response("Not found", { status: 404 });
    asset = { mime: data.mime, body: new Uint8Array(Buffer.from(data.data, "base64")) };
    if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value!);
    cache.set(id, asset);
  }

  return new Response(asset.body, {
    headers: {
      "Content-Type": asset.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
