export const UNCATEGORIZED = "";

export function imageCategory(path: string): string {
  const i = path.indexOf("/");
  return i < 0 ? UNCATEGORIZED : path.slice(0, i);
}

export function collectCategories(images: string[]): string[] {
  let hasUncategorized = false;
  const named = new Set<string>();
  for (const p of images) {
    const c = imageCategory(p);
    if (c === UNCATEGORIZED) hasUncategorized = true;
    else named.add(c);
  }
  const sorted = Array.from(named).sort((a, b) => a.localeCompare(b));
  return hasUncategorized ? [UNCATEGORIZED, ...sorted] : sorted;
}
