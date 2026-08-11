"use client";

import { useEffect, useState } from "react";
import { scenesSample } from "@/lib/scenes-sample";
import type { Scene } from "@/types/scene";
import PhoneFrame from "@/components/PhoneFrame";

/** Idle lockscreen shown before the run begins: just the clock, no events. */
const coverScene: Scene = {
  id: "cover",
  appType: "lockscreen",
  label: "Lockscreen",
  events: [],
};

export default function Home() {
  const [started, setStarted] = useState(false);
  // Runs past the last index — that's the "finished, fade to black" state.
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  // Remounts the frame so "Replay" restarts the current scene.
  const [playNonce, setPlayNonce] = useState(0);
  const [sceneFinished, setSceneFinished] = useState(false);

  const done = started && activeSceneIndex >= scenesSample.length;
  const scene = started
    ? (scenesSample[Math.min(activeSceneIndex, scenesSample.length - 1)] ??
      coverScene)
    : coverScene;

  // Debug trace: confirm scenes actually switch app types as they advance.
  useEffect(() => {
    console.log("[scene]", {
      activeSceneIndex,
      appType: scene.appType,
      id: scene.id,
      started,
      done,
    });
  }, [activeSceneIndex, scene.appType, scene.id, started, done]);

  const begin = () => {
    setActiveSceneIndex(0);
    setPlayNonce((nonce) => nonce + 1);
    setSceneFinished(false);
    setStarted(true);
  };

  const goTo = (index: number) => {
    setActiveSceneIndex(Math.max(0, index));
    setPlayNonce((nonce) => nonce + 1);
    setSceneFinished(false);
  };

  return (
    <div className="relative flex h-[100dvh] w-screen flex-col items-center justify-start overflow-hidden bg-black md:h-screen md:justify-center md:gap-4">
      <PhoneFrame
        key={started ? `scene-${activeSceneIndex}:${playNonce}` : "cover"}
        scene={scene}
        autoStart={started && !done}
        onSceneFinished={() => setSceneFinished(true)}
        sizeClass="h-[100dvh] w-screen md:h-[min(80vh,1000px)] md:w-[92vw] md:max-w-[1700px]"
      />

      {/* Manual scene transport — floating pill on mobile, below the tablet on desktop */}
      {started && !done ? (
        <div className="absolute bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 z-40 flex w-auto max-w-[96vw] -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-black/75 px-2 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.5)] backdrop-blur-md md:static md:left-auto md:max-w-none md:translate-x-0 md:gap-3 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
          <button
            type="button"
            onClick={() => goTo(activeSceneIndex - 1)}
            disabled={activeSceneIndex === 0}
            className="flex h-9 items-center rounded-full border border-white/25 px-3 text-[13px] font-medium text-white hover:bg-white/10 disabled:opacity-30 md:h-auto md:px-4 md:py-1.5 md:text-[14px]"
          >
            <span className="md:hidden">‹</span>
            <span className="hidden md:inline">← Prev</span>
          </button>
          <button
            type="button"
            onClick={() => goTo(activeSceneIndex)}
            className="flex h-9 items-center rounded-full border border-white/25 px-3 text-[13px] font-medium text-white hover:bg-white/10 md:h-auto md:px-4 md:py-1.5 md:text-[14px]"
          >
            <span className="md:hidden">↻</span>
            <span className="hidden md:inline">Replay</span>
          </button>
          <button
            type="button"
            onClick={() => goTo(activeSceneIndex + 1)}
            className={`flex h-9 items-center rounded-full bg-[#00a884] px-4 text-[13px] font-semibold text-white hover:bg-[#029176] md:h-auto md:px-5 md:py-1.5 md:text-[14px] ${
              sceneFinished ? "animate-pulse" : ""
            }`}
          >
            <span className="md:hidden">
              {activeSceneIndex === scenesSample.length - 1 ? "Finish" : "Next ›"}
            </span>
            <span className="hidden md:inline">
              {activeSceneIndex === scenesSample.length - 1
                ? "Finish"
                : "Next scene →"}
            </span>
          </button>
          <span className="px-1 text-[12px] tabular-nums text-white/50 md:ml-1 md:text-[13px]">
            {activeSceneIndex + 1}/{scenesSample.length}
          </span>
        </div>
      ) : null}

      {/* "Tap to begin" cover — the click also unlocks audio for the sounds */}
      {!started ? (
        <button
          type="button"
          onClick={begin}
          className="absolute inset-0 z-40 flex cursor-pointer items-end justify-center bg-transparent pb-20"
        >
          <span className="animate-pulse rounded-full bg-white/10 px-6 py-2.5 text-[15px] font-medium text-white backdrop-blur-md">
            Tap to begin
          </span>
        </button>
      ) : null}

      {/* End of show: fade to black, no loop */}
      <div
        className={`pointer-events-none absolute inset-0 z-50 bg-black transition-opacity duration-[2000ms] ${
          done ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
