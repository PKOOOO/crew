"use client";

import { useEffect, useState } from "react";
import { scenesSample } from "@/lib/scenes-sample";
import { SCENE_CHANNEL_NAME, isSceneSyncMessage } from "@/lib/scene-sync";
import PhoneFrame from "@/components/PhoneFrame";

export default function DisplayPage() {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [playNonce, setPlayNonce] = useState(0);
  // Scenes stay idle until the operator sends the first action.
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel(SCENE_CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (!isSceneSyncMessage(event.data)) return;
      setActiveSceneIndex(
        Math.max(0, Math.min(scenesSample.length - 1, event.data.activeSceneIndex)),
      );
      setPlayNonce((nonce) => nonce + 1);
      setStarted(true);
    };
    return () => channel.close();
  }, []);

  const scene = scenesSample[activeSceneIndex] ?? scenesSample[0];
  if (!scene) return null;

  return (
    <main className="flex h-screen w-screen items-center justify-center overflow-hidden bg-black">
      <PhoneFrame
        key={`${activeSceneIndex}:${playNonce}`}
        scene={scene}
        autoStart={started}
        sizeClass="h-[100dvh] w-screen md:h-[94vh] md:w-[96vw]"
      />
    </main>
  );
}
