/**
 * Control ↔ display sync over the BroadcastChannel API: same-origin, works
 * across two browser windows/tabs with no server. The control page posts,
 * the display page listens.
 */

export const SCENE_CHANNEL_NAME = "wa-sim-scenes";

export type SceneSyncMessage = {
  activeSceneIndex: number;
  action: "play" | "next" | "prev";
};

export function isSceneSyncMessage(value: unknown): value is SceneSyncMessage {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<SceneSyncMessage>;
  return (
    typeof candidate.activeSceneIndex === "number" &&
    (candidate.action === "play" ||
      candidate.action === "next" ||
      candidate.action === "prev")
  );
}
