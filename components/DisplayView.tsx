"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scenesSample } from "@/lib/scenes-sample";
import type { Scene } from "@/types/scene";
import PhoneFrame from "@/components/PhoneFrame";
import { useSceneChannel, type SyncMessage } from "@/lib/scene-sync";

/** Idle lockscreen shown before the show begins: just the clock, no events. */
const coverScene: Scene = {
  id: "cover",
  appType: "lockscreen",
  label: "Lockscreen",
  events: [],
};

/**
 * The projector screen: nothing but the tablet. Cues arrive from the phone
 * remote at /control. Keyboard shortcuts (← → R) are the backup if the
 * phone or the network dies mid-show.
 */
export default function DisplayView() {
  const [started, setStarted] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [playNonce, setPlayNonce] = useState(0);
  const [finished, setFinished] = useState(false);

  const startedRef = useRef(started);
  const indexRef = useRef(activeSceneIndex);
  useEffect(() => {
    startedRef.current = started;
    indexRef.current = activeSceneIndex;
  }, [started, activeSceneIndex]);

  const sendRef = useRef<((message: SyncMessage) => void) | null>(null);

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(scenesSample.length, index));
    setActiveSceneIndex(clamped);
    setPlayNonce((nonce) => nonce + 1);
    setFinished(false);
    setStarted(true);
    sendRef.current?.({
      kind: "state",
      sceneIndex: clamped,
      started: true,
      finished: false,
    });
  }, []);

  const handleMessage = useCallback(
    (message: SyncMessage) => {
      if (message.kind === "cue") {
        goTo(message.sceneIndex);
        return;
      }
      if (message.kind === "request") {
        sendRef.current?.({
          kind: "state",
          sceneIndex: indexRef.current,
          started: startedRef.current,
          finished: false,
        });
      }
    },
    [goTo],
  );

  const { send } = useSceneChannel(handleMessage);
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  /* Keyboard backup — works even if the phone is gone. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        goTo(indexRef.current + (startedRef.current ? 1 : 0));
      } else if (event.key === "ArrowLeft") {
        goTo(indexRef.current - 1);
      } else if (event.key.toLowerCase() === "r") {
        goTo(indexRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo]);

  const done = started && activeSceneIndex >= scenesSample.length;
  const scene = started
    ? (scenesSample[Math.min(activeSceneIndex, scenesSample.length - 1)] ??
      coverScene)
    : coverScene;

  const handleSceneFinished = useCallback(() => {
    setFinished(true);
    sendRef.current?.({
      kind: "state",
      sceneIndex: indexRef.current,
      started: true,
      finished: true,
    });
  }, []);

  /** The one required tap: unlocks audio playback on this machine. */
  const begin = () => {
    setStarted(true);
    setActiveSceneIndex(0);
    setPlayNonce((nonce) => nonce + 1);
    setFinished(false);
  };

  return (
    <div className="relative flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-black md:h-screen">
      <PhoneFrame
        key={started ? `scene-${activeSceneIndex}:${playNonce}` : "cover"}
        scene={scene}
        autoStart={started && !done}
        onSceneFinished={handleSceneFinished}
        sizeClass="h-[100dvh] w-screen md:h-[94vh] md:w-[96vw]"
      />

      {/* Pre-show cover. Tapping it also unlocks audio for the whole show. */}
      {!started ? (
        <button
          type="button"
          onClick={begin}
          className="absolute inset-0 z-40 flex cursor-pointer items-end justify-center bg-transparent pb-20"
        >
          <span className="animate-pulse rounded-full bg-white/10 px-6 py-2.5 text-[15px] font-medium text-white backdrop-blur-md">
            Tap once to enable sound, then control from your phone
          </span>
        </button>
      ) : null}

      {/* End of show: fade to black, no loop */}
      <div
        className={`pointer-events-none absolute inset-0 z-50 bg-black transition-opacity duration-[2000ms] ${
          done ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Marks that a scene has played out — invisible to the audience */}
      <span className="sr-only">{finished ? "scene finished" : ""}</span>
    </div>
  );
}
