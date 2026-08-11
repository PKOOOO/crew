/**
 * WhatsApp-style participant name colors: pinks, oranges, teals, purples and
 * blues. Deliberately excludes WhatsApp's own greens so a sender name is never
 * confused with the outgoing-bubble color (#d9fdd3 / #00a884).
 */
export const SENDER_COLOR_PALETTE: readonly string[] = [
  "#e542a3", // pink
  "#dfa000", // amber
  "#02a698", // teal
  "#7f66ff", // purple
  "#ff8c2f", // orange
  "#0093e5", // blue
  "#c4532d", // rust
  "#9d4edd", // violet
  "#d9407a", // rose
  "#0d84c9", // deep blue
  "#b4682c", // bronze
  "#00a0b1", // cyan
];

/** Stable per-name hash so a sender keeps the same color across renders. */
function hashName(name: string): number {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/**
 * Builds a sender → color map, walking the palette in order so the senders in
 * a conversation get distinct colors, then falling back to a hash.
 */
export function buildSenderColors(
  senders: readonly string[],
): Record<string, string> {
  const colors: Record<string, string> = {};
  let next = 0;

  for (const sender of senders) {
    if (sender === "me" || colors[sender]) continue;
    colors[sender] =
      SENDER_COLOR_PALETTE[next % SENDER_COLOR_PALETTE.length] ??
      SENDER_COLOR_PALETTE[0]!;
    next += 1;
  }

  return colors;
}

/** Color for a sender: the map first, otherwise a stable hashed fallback. */
export function resolveSenderColor(
  sender: string,
  senderColors: Record<string, string>,
): string {
  return (
    senderColors[sender] ??
    SENDER_COLOR_PALETTE[hashName(sender) % SENDER_COLOR_PALETTE.length] ??
    SENDER_COLOR_PALETTE[0]!
  );
}
