// Public Skin URLs must use one of the explicitly supported Asset roots.
// Build still receives only paths projected from approved Publication records.
const ASSET_PATH = /^assets\/(?:skins|skin-admissions\/[a-z0-9]+(?:-[a-z0-9]+)*)\/skin-[1-9][0-9]*\.webp$/;

export function isAllowedSkinAssetPath(path) {
  return typeof path === 'string' && ASSET_PATH.test(path);
}

export function skinAssetPathFromPublicUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('./')) return null;
  const path = url.slice(2);
  return isAllowedSkinAssetPath(path) ? path : null;
}
