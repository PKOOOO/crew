"use client";

import { useEffect, useRef, useState } from "react";

export type FlashScreenProps = {
  /** The single line held on the black screen. */
  text: string;
  /** Beat of black before it appears, ms. */
  delay?: number;
  /** Type size in px. */
  size?: number;
  /** How long it is held before the scene reports itself done, ms. */
  hold?: number;
  autoStart?: boolean;
  /** Called once the line has arrived and been held. */
  onFinished?: () => void;
};

/** Fade up and push in. */
const REVEAL_MS = 3000;
/** The slow drift afterwards, so the frame never quite settles. */
const DRIFT_MS = 12000;
/** Default hold before the scene calls itself done. */
const HOLD_MS = 4000;

/**
 * One line on black. No app, no chrome — a page pulled out of a bin and
 * unfolded. It fades up out of nothing and keeps closing in the whole time
 * it is on screen.
 */
export default function FlashScreen({
  text,
  delay = 900,
  size = 96,
  hold = HOLD_MS,
  autoStart = false,
  onFinished,
}: FlashScreenProps) {
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
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-black px-24">
      <p
        className="max-w-[1500px] text-center font-semibold leading-[1.3] text-white"
        style={{
          fontSize: size,
          opacity: shown ? 1 : 0,
          transform: `scale(${drifting ? 1.07 : shown ? 1 : 0.84})`,
          transitionProperty: "opacity, transform",
          transitionTimingFunction: drifting
            ? "linear"
            : "cubic-bezier(0.2, 0, 0.1, 1)",
          transitionDuration: drifting ? `${DRIFT_MS}ms` : `${REVEAL_MS}ms`,
        }}
      >
        {text}
      </p>
    </div>
  );
}
