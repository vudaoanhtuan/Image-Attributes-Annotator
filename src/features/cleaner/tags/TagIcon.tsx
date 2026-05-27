import { tagColors } from "./tagColor";

type Props = {
  tag: string;
  className?: string;
};

export default function TagIcon({
  tag,
  className = "w-5 h-5 rounded flex items-center justify-center text-xs font-semibold uppercase",
}: Props) {
  const c = tagColors(tag);
  return (
    <span
      aria-label={`tag ${tag.toUpperCase()}`}
      className={className}
      style={{ backgroundColor: c.badgeBg, color: c.badgeText }}
    >
      {tag}
    </span>
  );
}
