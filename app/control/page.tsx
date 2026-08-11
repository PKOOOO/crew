"use client";

import { useEffect, useRef, useState } from "react";
import { scenesSample } from "@/lib/scenes-sample";
import {
  SCENE_CHANNEL_NAME,
  type SceneSyncMessage,
} from "@/lib/scene-sync";
import PhoneFrame from "@/components/PhoneFrame";

const APP_BADGE: Record<string, string> = {
  whatsapp: "bg-[#d9fdd3] text-[#0b5f4a]",
  tiktok: "bg-[#fde3ea] text-[#a51236]",
  notes: "bg-[#fdf3d9] text-[#8a6a10]",
  lockscreen: "bg-[#e3e9fd] text-[#2b3f8a]",
};

export default function ControlPage() {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  // Bumped on every action so the preview remounts and replays.
  const [playNonce, setPlayNonce] = useState(0);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel(SCENE_CHANNEL_NAME);
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      channel.close();
    };
  }, []);

  const go = (index: number, action: SceneSyncMessage["action"]) => {
    const clamped = Math.max(0, Math.min(scenesSample.length - 1, index));
    setActiveSceneIndex(clamped);
    setPlayNonce((nonce) => nonce + 1);
    const message: SceneSyncMessage = { activeSceneIndex: clamped, action };
    channelRef.current?.postMessage(message);
  };

  const scene = scenesSample[activeSceneIndex] ?? scenesSample[0];
  if (!scene) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#111b21] text-white">
      {/* Scene list */}
      <aside className="flex h-full w-[340px] shrink-0 flex-col border-r border-white/10">
        <div className="shrink-0 border-b border-white/10 px-4 py-3">
          <h1 className="text-[15px] font-semibold">Operator — scene control</h1>
          <p className="mt-0.5 text-[12px] text-white/50">
            Open <span className="font-mono">/display</span> on the projector.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          {scenesSample.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(index, "play")}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-left ${
                index === activeSceneIndex
                  ? "bg-[#00a884]/20"
                  : "hover:bg-white/5"
              }`}
            >
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                  APP_BADGE[item.appType] ?? ""
                }`}
              >
                {item.appType}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px]">
                {item.label}
              </span>
              <span className="shrink-0 text-[11px] text-white/40">
                {item.events.length} ev
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Transport + live preview */}
      <main className="flex min-w-0 flex-1 flex-col items-center overflow-hidden">
        <div className="flex w-full shrink-0 items-center justify-center gap-3 border-b border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={() => go(activeSceneIndex - 1, "prev")}
            disabled={activeSceneIndex === 0}
            className="rounded border border-white/20 px-4 py-1.5 text-[13px] hover:bg-white/10 disabled:opacity-30"
          >
            ← Previous Scene
          </button>
          <button
            type="button"
            onClick={() => go(activeSceneIndex, "play")}
            className="rounded bg-[#00a884] px-5 py-1.5 text-[13px] font-medium hover:bg-[#029176]"
          >
            Replay Scene
          </button>
          <button
            type="button"
            onClick={() => go(activeSceneIndex + 1, "next")}
            disabled={activeSceneIndex === scenesSample.length - 1}
            className="rounded border border-white/20 px-4 py-1.5 text-[13px] hover:bg-white/10 disabled:opacity-30"
          >
            Next Scene →
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-start justify-center overflow-hidden pt-4">
          <div className="origin-top scale-[0.6]">
            <PhoneFrame
              key={`${activeSceneIndex}:${playNonce}`}
              scene={scene}
              autoStart
            />
          </div>
        </div>
      </main>
    </div>
  );
}
