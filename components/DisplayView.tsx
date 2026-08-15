"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scenesSample } from "@/lib/scenes-sample";
import type { Scene } from "@/types/scene";
import PhoneFrame, {
  CRT_CLOSE_MS,
  CRT_OPEN_MS,
} from "@/components/PhoneFrame";
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
  /** CRT power transition between scenes. */
  const [screenPhase, setScreenPhase] = useState<
    "idle" | "closing" | "opening" | "off"
  >("idle");
  const phaseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseRef = useRef(screenPhase);

  const startedRef = useRef(started);
  const indexRef = useRef(activeSceneIndex);
  /** Shut, or on its way shut — what the operator's toggle acts against. */
  const curtainClosedRef = useRef(false);
  useEffect(() => {
    startedRef.current = started;
    indexRef.current = activeSceneIndex;
    phaseRef.current = screenPhase;
    curtainClosedRef.current =
      screenPhase === "off" || screenPhase === "closing";
  }, [started, activeSceneIndex, screenPhase]);

  const sendRef = useRef<((message: SyncMessage) => void) | null>(null);

  const clearPhaseTimers = () => {
    for (const timer of phaseTimers.current) clearTimeout(timer);
    phaseTimers.current = [];
  };

  /**
   * Curtain out on the scene showing now, swap, curtain back in. The scene
   * only changes once the screen has powered down, so the audience never
   * sees a hard cut.
   */
  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(scenesSample.length, index));
    clearPhaseTimers();
    setFinished(false);

    // If the curtain is already shut (the scene played out), go straight to
    // opening on the new scene instead of closing an already-closed curtain.
    const alreadyClosed = phaseRef.current === "off";
    const closeDelay = alreadyClosed ? 0 : CRT_CLOSE_MS;
    if (!alreadyClosed) setScreenPhase("closing");

    phaseTimers.current.push(
      setTimeout(() => {
        setActiveSceneIndex(clamped);
        setPlayNonce((nonce) => nonce + 1);
        setStarted(true);
        setScreenPhase("opening");
        sendRef.current?.({
          kind: "state",
          sceneIndex: clamped,
          started: true,
          finished: false,
          curtainClosed: false,
        });
      }, closeDelay),
    );

    phaseTimers.current.push(
      setTimeout(() => setScreenPhase("idle"), closeDelay + CRT_OPEN_MS),
    );
  }, []);

  /**
   * The operator's curtain, closed or opened by hand. Nothing else touches
   * it — a scene that has played out keeps its last frame on screen.
   */
  const setCurtain = useCallback((closed: boolean) => {
    if (curtainClosedRef.current === closed) return;
    clearPhaseTimers();

    if (closed) {
      setScreenPhase("closing");
      curtainClosedRef.current = true;
      phaseTimers.current.push(
        setTimeout(() => setScreenPhase("off"), CRT_CLOSE_MS),
      );
    } else {
      setScreenPhase("opening");
      curtainClosedRef.current = false;
      phaseTimers.current.push(
        setTimeout(() => setScreenPhase("idle"), CRT_OPEN_MS),
      );
    }

    sendRef.current?.({
      kind: "state",
      sceneIndex: indexRef.current,
      started: startedRef.current,
      finished: false,
      curtainClosed: closed,
    });
  }, []);

  useEffect(() => clearPhaseTimers, []);

  const handleMessage = useCallback(
    (message: SyncMessage) => {
      if (message.kind === "cue") {
        goTo(message.sceneIndex);
        return;
      }
      if (message.kind === "curtain") {
        setCurtain(message.closed);
        return;
      }
      if (message.kind === "request") {
        sendRef.current?.({
          kind: "state",
          sceneIndex: indexRef.current,
          started: startedRef.current,
          finished: false,
          curtainClosed: curtainClosedRef.current,
        });
      }
    },
    [goTo, setCurtain],
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
      } else if (event.key.toLowerCase() === "c") {
        setCurtain(!curtainClosedRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, setCurtain]);

  const done = started && activeSceneIndex >= scenesSample.length;
  const scene = started
    ? (scenesSample[Math.min(activeSceneIndex, scenesSample.length - 1)] ??
      coverScene)
    : coverScene;

  /**
   * A scene has played its last event. The curtain stays open and the final
   * frame just sits there — closing it is the operator's call, from /control.
   */
  const handleSceneFinished = useCallback(() => {
    setFinished(true);
    sendRef.current?.({
      kind: "state",
      sceneIndex: indexRef.current,
      started: true,
      finished: true,
      curtainClosed: curtainClosedRef.current,
    });
  }, []);

  /** The one required tap: unlocks audio playback on this machine. */
  const begin = () => {
    clearPhaseTimers();
    setStarted(true);
    setActiveSceneIndex(0);
    setPlayNonce((nonce) => nonce + 1);
    setFinished(false);
    setScreenPhase("opening");
    phaseTimers.current.push(
      setTimeout(() => setScreenPhase("idle"), CRT_OPEN_MS),
    );
  };

  return (
    <div className="relative flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-black md:h-screen">
      <PhoneFrame
        key={started ? `scene-${activeSceneIndex}:${playNonce}` : "cover"}
        scene={scene}
        autoStart={started && !done}
        // A covered scene is a stopped scene: the moment the curtain starts
        // to sweep in, playback and its sound halt where they are.
        paused={screenPhase === "closing" || screenPhase === "off"}
        onSceneFinished={handleSceneFinished}
        sizeClass="h-[100dvh] w-screen md:h-[94vh] md:w-[96vw]"
        screenPhase={done ? "off" : screenPhase}
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
