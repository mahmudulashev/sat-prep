/**
 * URL of a question image. Images are served from Supabase Storage's CDN when
 * NEXT_PUBLIC_ASSET_BASE is set, otherwise through the app's own route.
 */
export function assetUrl(id: string) {
  const base = process.env.NEXT_PUBLIC_ASSET_BASE;
  return base ? `${base}/${id}.png` : `/api/asset/${id}`;
}
