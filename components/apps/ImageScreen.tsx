"use client";

import { useEffect, useRef, useState } from "react";

export type ImageScreenProps = {
  /** The picture, path under /public. */
  src: string;
  /** Beat of black before it appears, ms. */
  delay?: number;
  /** How long it is held before the scene reports itself done, ms. */
  hold?: number;
  /** Optional line under the picture. */
  caption?: string;
  /**
   * Fill the frame edge to edge rather than sitting inside it. The picture
   * is cropped to the frame's shape instead of being letterboxed — for a
   * drawing that should own the whole screen.
   */
  fill?: boolean;
  autoStart?: boolean;
  onFinished?: () => void;
};

/** Fade up and push in. */
const REVEAL_MS = 3000;
/** The slow drift afterwards, so the frame never quite settles. */
const DRIFT_MS = 16000;
/** Default hold before the scene calls itself done. */
const HOLD_MS = 6000;

/**
 * One picture on black — a drawing held up to the room. No app, no chrome.
 * It fades up out of nothing and keeps creeping in the whole time it is on
 * screen, the same treatment the flashed lines get, so a scene of nothing
 * but an image still breathes.
 */
export default function ImageScreen({
  src,
  delay = 1200,
  hold = HOLD_MS,
  caption,
  fill = false,
  autoStart = false,
  onFinished,
}: ImageScreenProps) {
  const [shown, setShown] = useState(false);
  const [drifting, setDrifting] = useState(false);
  const onFinishedRef = useRef(onFinished);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    if (!autoStart) return;

    const timers = [
      setTimeout(() => setShown(true), delay),
      setTimeout(() => setDrifting(true), delay + REVEAL_MS),
      setTimeout(() => onFinishedRef.current?.(), delay + REVEAL_MS + hold),
    ];

    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  }, [autoStart, delay, hold]);

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center overflow-hidden bg-black ${
        fill ? "" : "gap-8 px-10 py-10"
      }`}
    >
      {/* Plain img, not next/image: the file's own proportions decide the
          shape. Contained, a landscape drawing stays whole in a landscape
          frame with nothing cropped; filled, it takes the screen and the
          frame decides what is left out. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={
          fill
            ? "h-full w-full object-cover"
            : "min-h-0 flex-1 object-contain"
        }
        style={{
          opacity: shown ? 1 : 0,
          transform: `scale(${drifting ? 1.06 : shown ? 1 : 0.88})`,
          transitionProperty: "opacity, transform",
          transitionTimingFunction: drifting
            ? "linear"
            : "cubic-bezier(0.2, 0, 0.1, 1)",
          transitionDuration: drifting ? `${DRIFT_MS}ms` : `${REVEAL_MS}ms`,
        }}
      />

      {caption ? (
        <p
          className="shrink-0 text-center text-[56px] font-semibold leading-[1.3] text-white/90 transition-opacity duration-[2000ms] ease-out"
          style={{ opacity: shown ? 1 : 0 }}
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}
