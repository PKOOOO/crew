"use client";

import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import type { NotesEvent } from "@/types/scene";

export type NotesScreenProps = {
  events: NotesEvent[];
  /** Initial background; a toggle in the corner flips it live. */
  dark?: boolean;
  autoStart?: boolean;
  /** Called once when all events have played. */
  onFinished?: () => void;
};

/**
 * Short synthesized keyboard click (Web Audio) — a filtered noise burst, so
 * rapid per-character clicks can overlap without an audio file or element pool.
 */
function makeClicker() {
  let context: AudioContext | null = null;
  let noiseBuffer: AudioBuffer | null = null;

  return (soft = false) => {
    try {
      context ??= new AudioContext();
      if (context.state === "suspended") void context.resume();

      if (!noiseBuffer) {
        const length = Math.floor(context.sampleRate * 0.03);
        noiseBuffer = context.createBuffer(1, length, context.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < length; i += 1) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / length);
        }
      }

      const source = context.createBufferSource();
      source.buffer = noiseBuffer;
      // Small random detune so a run of clicks doesn't sound machine-perfect.
      source.playbackRate.value = 0.85 + Math.random() * 0.4;

      const filter = context.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = soft ? 1800 : 2600;
      filter.Q.value = 1.2;

      const gain = context.createGain();
      gain.gain.value = soft ? 0.12 : 0.22;

      source.connect(filter).connect(gain).connect(context.destination);
      source.start();
    } catch {
      // No audio available — typing continues silently.
    }
  };
}

export default function NotesScreen({
  events,
  dark: darkInitial = false,
  autoStart = false,
  onFinished,
}: NotesScreenProps) {
  const [text, setText] = useState("");
  const [dark, setDark] = useState(darkInitial);
  const onFinishedRef = useRef(onFinished);
  const clickRef = useRef<ReturnType<typeof makeClicker> | null>(null);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  /* --------------------------- playback engine --------------------------- */
  // Same sequential-await pattern as the WhatsApp engine: one effect, a
  // cancelled flag, awaited setTimeout waits, cleanup clears the timer.
  useEffect(() => {
    if (!autoStart) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    const play = async () => {
      let current = "";
      setText(current);

      for (const event of events) {
        if (cancelled) return;

        if (event.type === "type") {
          for (const character of event.text) {
            await wait(event.charDelayMs);
            if (cancelled) return;
            current += character;
            setText(current);
            if (character !== " ") (clickRef.current ??= makeClicker())();
          }
          continue;
        }

        if (event.type === "pause") {
          await wait(event.duration);
          continue;
        }

        // delete: erase character-by-character over the given duration.
        const startLength = current.length;
        if (!startLength) {
          await wait(event.duration);
          continue;
        }
        const perCharacter = Math.max(16, event.duration / startLength);
        while (current.length) {
          await wait(perCharacter);
          if (cancelled) return;
          current = current.slice(0, -1);
          setText(current);
          (clickRef.current ??= makeClicker())(true);
        }
      }

      if (!cancelled) onFinishedRef.current?.();
    };

    void play();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [events, autoStart]);

  return (
    <div
      className={`relative flex h-full w-full flex-col px-6 pb-8 pt-4 transition-colors ${
        dark ? "bg-[#1c1c1e] text-[#e5e5ea]" : "bg-white text-[#1c1c1e]"
      }`}
    >
      {/* Minimal header: app name + background toggle */}
      <div className="mb-6 flex shrink-0 items-center justify-between">
        <span
          className={`text-[13px] ${dark ? "text-[#8e8e93]" : "text-[#8e8e93]"}`}
        >
          Notes
        </span>
        <button
          type="button"
          aria-label="Toggle background"
          onClick={() => setDark((value) => !value)}
          className={`rounded-full p-1.5 ${
            dark
              ? "text-[#8e8e93] hover:bg-white/10"
              : "text-[#8e8e93] hover:bg-black/5"
          }`}
        >
          {dark ? (
            <Sun className="h-4 w-4" strokeWidth={1.8} />
          ) : (
            <Moon className="h-4 w-4" strokeWidth={1.8} />
          )}
        </button>
      </div>

      {/* The note itself: plain text, blinking caret at the end */}
      <div className="mx-auto min-h-0 w-full max-w-[760px] flex-1 overflow-y-auto">
        <p className="whitespace-pre-wrap break-words text-[24px] font-medium leading-10">
          {text}
          <span
            aria-hidden
            className="ml-0.5 inline-block h-[1.15em] w-[2px] translate-y-[0.2em] bg-current"
            style={{ animation: "wa-caret-blink 1.1s step-end infinite" }}
          />
        </p>
      </div>
    </div>
  );
}
