"use client";

import { useEffect, useState } from "react";
import type { Scene } from "@/types/scene";
import WhatsAppScreen from "@/components/apps/WhatsAppScreen";
import TikTokScreen from "@/components/apps/TikTokScreen";
import NotesScreen from "@/components/apps/NotesScreen";
import LockscreenScreen from "@/components/apps/LockscreenScreen";
import GroupInfoScreen from "@/components/apps/GroupInfoScreen";
import ChatListScreen from "@/components/apps/ChatListScreen";

export type PhoneFrameProps = {
  scene: Scene;
  /** Start the scene's playback engine as soon as it mounts. */
  autoStart?: boolean;
  /** Called once when the scene's events have played to the end. */
  onSceneFinished?: () => void;
  /** Status bar overrides — defaults to a live clock and a full-ish battery. */
  statusTime?: string;
  batteryPercent?: number;
  signalBars?: 1 | 2 | 3 | 4;
  /**
   * Tailwind classes sizing the tablet against the viewport. Pass both a
   * height and a width (or an aspect-*) — e.g. "h-[80vh] w-[90vw]" to
   * stretch the tablet across the screen.
   */
  sizeClass?: string;
  /**
   * Curtain over the screen: two panels sweeping in from the left and right
   * ("closing"), sweeping back out ("opening"), or held shut ("off").
   */
  screenPhase?: "idle" | "closing" | "opening" | "off";
};

/** Keep in sync with the curtain keyframes in globals.css. */
export const CRT_CLOSE_MS = 1400;
export const CRT_OPEN_MS = 1600;

/**
 * Desktop/projection: iPad-style landscape tablet with bezels and a camera
 * dot. Mobile (< md): the bezel disappears and the app fills the viewport
 * edge-to-edge, the way applications look on an actual phone.
 */
export default function PhoneFrame({
  scene,
  autoStart = false,
  onSceneFinished,
  statusTime,
  batteryPercent = 82,
  signalBars = 4,
  sizeClass = "h-[100dvh] w-screen md:h-[min(94vh,1250px)] md:w-auto md:aspect-[4/3]",
  screenPhase = "idle",
}: PhoneFrameProps) {
  // Dark apps get a translucent overlay status bar with white text.
  const darkStatusBar =
    scene.appType === "tiktok" ||
    scene.appType === "lockscreen" ||
    scene.appType === "groupinfo" ||
    scene.appType === "chatlist";

  return (
    <div
      className={`relative ${sizeClass} shrink-0 rounded-none bg-black p-0 shadow-none md:rounded-[42px] md:p-[16px] md:shadow-[0_24px_60px_rgba(0,0,0,0.45)]`}
    >
      {/* Front camera, centered in the top bezel */}
      <div className="absolute left-1/2 top-[6px] z-30 hidden h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#1f2a33] ring-1 ring-[#3a4a57] md:block" />

      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-none bg-white md:rounded-[26px]">
        <Curtain phase={screenPhase} />

        <StatusBar
          dark={darkStatusBar}
          overlay={darkStatusBar}
          time={statusTime}
          batteryPercent={batteryPercent}
          signalBars={signalBars}
        />

        <div className="relative min-h-0 flex-1">
          <Screen
            scene={scene}
            autoStart={autoStart}
            onFinished={onSceneFinished}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Two black panels that sweep in from the left and right edges to meet in
 * the middle, then sweep back out. Sits above the app, below nothing.
 */
function Curtain({
  phase,
}: {
  phase: "idle" | "closing" | "opening" | "off";
}) {
  if (phase === "idle") return null;

  const held = phase === "off";
  const closing = phase === "closing";
  const duration = closing ? CRT_CLOSE_MS : CRT_OPEN_MS;
  const easing = closing
    ? "cubic-bezier(0.4, 0, 0.2, 1)"
    : "cubic-bezier(0.3, 0, 0.2, 1)";

  const panel = (side: "left" | "right") => {
    if (held) return { transform: "translateX(0)" };
    const name = closing
      ? `curtain-close-${side}`
      : `curtain-open-${side}`;
    return { animation: `${name} ${duration}ms ${easing} forwards` };
  };

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
    >
      {/* Left panel */}
      <div
        className="absolute inset-y-0 left-0 w-1/2 bg-black will-change-transform"
        style={panel("left")}
      >
        <span
          className="absolute inset-y-0 right-0 w-[3px] bg-white/80 shadow-[0_0_28px_10px_rgba(255,255,255,0.35)]"
          style={
            held
              ? { opacity: 0 }
              : { animation: `curtain-edge ${duration}ms ease-out forwards` }
          }
        />
      </div>

      {/* Right panel */}
      <div
        className="absolute inset-y-0 right-0 w-1/2 bg-black will-change-transform"
        style={panel("right")}
      >
        <span
          className="absolute inset-y-0 left-0 w-[3px] bg-white/80 shadow-[0_0_28px_10px_rgba(255,255,255,0.35)]"
          style={
            held
              ? { opacity: 0 }
              : { animation: `curtain-edge ${duration}ms ease-out forwards` }
          }
        />
      </div>
    </div>
  );
}

/** Renders the right app for the scene — events narrow with the appType. */
function Screen({
  scene,
  autoStart,
  onFinished,
}: {
  scene: Scene;
  autoStart: boolean;
  onFinished?: () => void;
}) {
  switch (scene.appType) {
    case "whatsapp":
      return (
        <WhatsAppScreen
          events={scene.events}
          chatName={scene.chatName ?? scene.label}
          selfName={scene.selfName}
          autoStart={autoStart}
          onFinished={onFinished}
        />
      );
    case "chatlist":
      return (
        <ChatListScreen
          events={scene.events}
          unreadTotal={scene.unreadTotal}
          groupTotal={scene.groupTotal}
          autoStart={autoStart}
          onFinished={onFinished}
        />
      );
    case "groupinfo":
      return (
        <GroupInfoScreen
          events={scene.events}
          groupName={scene.groupName}
          memberCount={scene.memberCount}
          autoStart={autoStart}
          onFinished={onFinished}
        />
      );
    case "tiktok":
      return (
        <TikTokScreen
          events={scene.events}
          username={scene.username}
          autoStart={autoStart}
          onFinished={onFinished}
        />
      );
    case "notes":
      return (
        <NotesScreen
          events={scene.events}
          dark={scene.dark}
          autoStart={autoStart}
          onFinished={onFinished}
        />
      );
    case "lockscreen":
      return (
        <LockscreenScreen
          events={scene.events}
          autoStart={autoStart}
          onFinished={onFinished}
        />
      );
  }
}

/* ------------------------------- status bar ------------------------------ */

function StatusBar({
  dark,
  overlay,
  time,
  batteryPercent,
  signalBars,
}: {
  dark: boolean;
  overlay: boolean;
  time?: string;
  batteryPercent: number;
  signalBars: number;
}) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(tick);
  }, []);

  const shownTime =
    time ??
    now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className={`z-20 flex h-9 shrink-0 items-center justify-between px-5 text-[13px] font-semibold md:h-11 md:px-8 md:text-[15px] ${
        dark ? "text-white" : "text-black"
      } ${overlay ? "absolute inset-x-0 top-0 bg-transparent" : "bg-[#f0f2f5]"}`}
    >
      <span suppressHydrationWarning>{shownTime}</span>
      <span className="flex items-center gap-1.5">
        <SignalIcon bars={signalBars} />
        <BatteryIcon percent={batteryPercent} />
      </span>
    </div>
  );
}

function SignalIcon({ bars }: { bars: number }) {
  return (
    <span className="flex items-end gap-[2px]" aria-label={`Signal ${bars}/4`}>
      {[4, 7, 10, 13].map((height, index) => (
        <span
          key={height}
          className="w-[3px] rounded-[1px] bg-current"
          style={{ height, opacity: index < bars ? 1 : 0.3 }}
        />
      ))}
    </span>
  );
}

function BatteryIcon({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <span className="flex items-center gap-[2px]" aria-label={`Battery ${clamped}%`}>
      <span className="flex h-[12px] w-[24px] items-center rounded-[3px] border border-current p-[1.5px]">
        <span
          className="h-full rounded-[1px] bg-current"
          style={{ width: `${clamped}%` }}
        />
      </span>
      <span className="h-[4px] w-[2px] rounded-r-[1px] bg-current" />
    </span>
  );
}
