export const UNCATEGORIZED = "";

export function imageCategory(path: string): string {
  const i = path.indexOf("/");
  return i < 0 ? UNCATEGORIZED : path.slice(0, i);
}
