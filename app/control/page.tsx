"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scenesSample } from "@/lib/scenes-sample";
import {
  hasRealtime,
  useSceneChannel,
  type SyncMessage,
} from "@/lib/scene-sync";

const APP_BADGE: Record<string, string> = {
  whatsapp: "bg-[#0b5f4a] text-[#d9fdd3]",
  chatlist: "bg-[#0b5f4a] text-[#d9fdd3]",
  groupinfo: "bg-[#0b5f4a] text-[#d9fdd3]",
  tiktok: "bg-[#7a0f28] text-[#ffd7e0]",
  notes: "bg-[#6a5210] text-[#fdf3d9]",
  lockscreen: "bg-[#22306b] text-[#dbe3ff]",
  flash: "bg-[#2a2a2a] text-[#e8e8e8]",
};

/** Phone remote. Big touch targets, no video preview. */
export default function ControlPage() {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [nonce, setNonce] = useState(0);
  /** What the projector last reported. */
  const [displaySceneIndex, setDisplaySceneIndex] = useState<number | null>(
    null,
  );
  const [sceneFinished, setSceneFinished] = useState(false);
  /** The projector's curtain — closed only when the operator says so. */
  const [curtainClosed, setCurtainClosed] = useState(false);

  const handleMessage = useCallback((message: SyncMessage) => {
    if (message.kind !== "state") return;
    setDisplaySceneIndex(message.sceneIndex);
    setSceneFinished(message.finished);
    if (message.curtainClosed !== undefined) {
      setCurtainClosed(message.curtainClosed);
    }
  }, []);

  const { send, status } = useSceneChannel(handleMessage);
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  /* Ask the projector what it is showing, once we are connected. */
  useEffect(() => {
    if (status !== "online" && status !== "local-only") return;
    const timer = setTimeout(() => sendRef.current({ kind: "request" }), 400);
    return () => clearTimeout(timer);
  }, [status]);

  const buzz = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(12);
    }
  };

  const cue = (index: number, action: "play" | "next" | "prev" | "replay") => {
    const clamped = Math.max(0, Math.min(scenesSample.length - 1, index));
    setActiveSceneIndex(clamped);
    setSceneFinished(false);
    // Cueing a scene always leaves the curtain open on the new one.
    setCurtainClosed(false);
    const next = nonce + 1;
    setNonce(next);
    send({ kind: "cue", sceneIndex: clamped, nonce: next, action });
    buzz();
  };

  const toggleCurtain = () => {
    const closed = !curtainClosed;
    setCurtainClosed(closed);
    send({ kind: "curtain", closed });
    buzz();
  };

  const scene = scenesSample[activeSceneIndex];
  const onDisplay =
    displaySceneIndex !== null ? scenesSample[displaySceneIndex] : undefined;

  const statusLabel =
    status === "online"
      ? "Connected"
      : status === "connecting"
        ? "Connecting…"
        : status === "local-only"
          ? hasRealtime
            ? "Local only"
            : "Same device only"
          : "Connection error";

  const statusColor =
    status === "online"
      ? "bg-[#25d366]"
      : status === "error"
        ? "bg-[#f15c6d]"
        : "bg-[#f5a623]";

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#0b0f13] text-white">
      {/* Header: connection + what the projector is showing */}
      <header className="shrink-0 border-b border-white/10 px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[17px] font-semibold">Scene remote</h1>
          <span className="flex items-center gap-2 text-[13px] text-white/60">
            <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
            {statusLabel}
          </span>
        </div>
        <p className="mt-1 truncate text-[13px] text-white/50">
          {onDisplay
            ? `On screen: ${onDisplay.label}`
            : "On screen: waiting for the projector…"}
        </p>
      </header>

      {/* Scene list */}
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {scenesSample.map((item, index) => {
          const isSelected = index === activeSceneIndex;
          const isLive = index === displaySceneIndex;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => cue(index, "play")}
              className={`flex w-full items-center gap-3 border-b border-white/5 px-4 py-3.5 text-left ${
                isLive ? "bg-[#00a884]/20" : isSelected ? "bg-white/5" : ""
              }`}
            >
              <span className="w-6 shrink-0 text-[13px] tabular-nums text-white/40">
                {index + 1}
              </span>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                  APP_BADGE[item.appType] ?? "bg-white/10"
                }`}
              >
                {item.appType}
              </span>
              <span className="min-w-0 flex-1 truncate text-[14px]">
                {item.label}
              </span>
              {isLive ? (
                <span className="shrink-0 text-[11px] font-bold text-[#25d366]">
                  LIVE
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Transport — thumb-sized, pinned to the bottom */}
      <div className="shrink-0 border-t border-white/10 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
        <p className="mb-2 truncate text-center text-[13px] text-white/50">
          {scene ? `${activeSceneIndex + 1}. ${scene.label}` : ""}
        </p>

        {/* The curtain is manual: a scene that has played out stays on screen
            until this closes it. Pulses once the scene has run out of events. */}
        <button
          type="button"
          onClick={toggleCurtain}
          className={`mb-2.5 h-14 w-full rounded-2xl border text-[16px] font-semibold active:bg-white/10 ${
            curtainClosed
              ? "border-[#f5a623]/60 bg-[#f5a623]/15 text-[#f5a623]"
              : `border-white/20 text-white ${
                  sceneFinished ? "animate-pulse" : ""
                }`
          }`}
        >
          {curtainClosed ? "▶ Open curtain" : "■ Close curtain"}
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => cue(activeSceneIndex - 1, "prev")}
            disabled={activeSceneIndex === 0}
            className="h-16 flex-1 rounded-2xl border border-white/20 text-[17px] font-semibold active:bg-white/10 disabled:opacity-25"
          >
            ‹ Prev
          </button>
          <button
            type="button"
            onClick={() => cue(activeSceneIndex, "replay")}
            className="h-16 flex-1 rounded-2xl border border-white/20 text-[17px] font-semibold active:bg-white/10"
          >
            ↻ Replay
          </button>
          <button
            type="button"
            onClick={() => cue(activeSceneIndex + 1, "next")}
            disabled={activeSceneIndex === scenesSample.length - 1}
            className={`h-16 flex-[1.4] rounded-2xl bg-[#00a884] text-[19px] font-bold active:bg-[#029176] disabled:opacity-40 ${
              sceneFinished ? "animate-pulse" : ""
            }`}
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}
