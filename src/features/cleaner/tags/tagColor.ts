// Map a tag character (0-9, a-z) to a stable HSL hue.
// 36 possible characters spread around the wheel using the golden ratio for
// maximum perceptual separation between adjacent characters.
const GOLDEN = 0.61803398875;

function charIdx(c: string): number {
  const code = c.charCodeAt(0);
  if (code >= 48 && code <= 57) return code - 48; // 0-9
  if (code >= 97 && code <= 122) return 10 + (code - 97); // a-z
  return 0;
}

export function tagHue(tag: string): number {
  const idx = charIdx(tag.toLowerCase()[0] ?? "0");
  return Math.round((idx * 360 * GOLDEN) % 360);
}

export type TagColors = {
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  activeBg: string;
  activeBorder: string;
};

export function tagColors(tag: string): TagColors {
  const h = tagHue(tag);
  return {
    bg: `hsl(${h} 85% 92%)`,
    text: `hsl(${h} 60% 25%)`,
    border: `hsl(${h} 55% 70%)`,
    badgeBg: `hsl(${h} 65% 45%)`,
    badgeText: "white",
    activeBg: `hsl(${h} 90% 96%)`,
    activeBorder: `hsl(${h} 55% 55%)`,
  };
}
