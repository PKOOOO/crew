"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, User } from "lucide-react";
import type { MessageStatus } from "@/components/MessageBubble";

export type VoiceNoteProps = {
  /** Audio file under /public. */
  src: string;
  timestamp: string;
  outgoing: boolean;
  status: MessageStatus;
  /** Start playing the moment it lands — the scene plays itself. */
  autoPlay?: boolean;
  /** The curtain is shut: stop the audio wherever it is. */
  paused?: boolean;
  /** Tints the avatar, so several people's notes stay tellable apart. */
  senderColor?: string;
};

/** Dots making up the seek track, WhatsApp-style. */
const TRACK_DOTS = 30;

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * A WhatsApp voice note: play/pause, a dotted seek track with a knob, the
 * elapsed-or-total time, and the sender's avatar with a mic badge. Plays
 * itself when it lands so the show needs no clicks.
 */
export default function VoiceNote({
  src,
  timestamp,
  outgoing,
  status,
  autoPlay = false,
  paused = false,
  senderColor,
}: VoiceNoteProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(0);

  // Playback is driven by the scene, not by clicks: it starts on its own and
  // stops dead when the curtain closes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (paused) audio.pause();
    else if (autoPlay) void audio.play().catch(() => {});
  }, [paused, autoPlay]);

  const progress = total > 0 ? Math.min(1, elapsed / total) : 0;
  // Before it has been touched the track shows how long the note is; once
  // running it counts up, the way the real app does.
  const shownTime = playing || elapsed > 0 ? elapsed : total;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => {});
    else audio.pause();
  };

  return (
    <div className="flex w-[620px] max-w-full items-center gap-5">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => setTotal(event.currentTarget.duration)}
        onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause voice note" : "Play voice note"}
        className="shrink-0 cursor-pointer text-[#54656f]"
      >
        {playing ? (
          <Pause className="h-14 w-14" fill="currentColor" strokeWidth={0} />
        ) : (
          <Play className="h-14 w-14" fill="currentColor" strokeWidth={0} />
        )}
      </button>

      <div className="min-w-0 flex-1">
        {/* Seek track */}
        <div className="relative flex h-8 items-center">
          <div className="flex w-full items-center justify-between">
            {Array.from({ length: TRACK_DOTS }, (_, index) => {
              const at = index / (TRACK_DOTS - 1);
              return (
                <span
                  key={index}
                  className={`h-[7px] w-[7px] rounded-full ${
                    at <= progress ? "bg-[#00a884]" : "bg-[#8696a0]/45"
                  }`}
                />
              );
            })}
          </div>
          <span
            className="absolute h-[26px] w-[26px] -translate-x-1/2 rounded-full bg-[#00a884] shadow-[0_1px_3px_rgba(11,20,26,0.3)]"
            style={{ left: `${progress * 100}%` }}
          />
        </div>

        {/* Duration + timestamp */}
        <div className="mt-1 flex items-baseline justify-between gap-4 text-[24px] font-semibold leading-[28px] text-[#667781]">
          <span className="tabular-nums">{formatClock(shownTime)}</span>
          <span className="flex items-center whitespace-nowrap">
            {playing ? (
              <span className="mr-4 rounded-full bg-[#8696a0]/20 px-3 py-0.5 text-[22px] font-bold text-[#54656f]">
                1×
              </span>
            ) : null}
            {timestamp}
            {outgoing ? <Ticks status={status} /> : null}
          </span>
        </div>
      </div>

      {/* Sender avatar with its mic badge */}
      <span className="relative shrink-0">
        <span
          className="flex h-[84px] w-[84px] items-center justify-center rounded-full"
          style={{ backgroundColor: senderColor ?? "#0b7d6f" }}
        >
          <User className="h-12 w-12 text-white" fill="white" strokeWidth={0} />
        </span>
        <Mic
          className="absolute -bottom-1 -left-1 h-9 w-9 text-[#00a884]"
          fill="currentColor"
          strokeWidth={0}
        />
      </span>
    </div>
  );
}

/** Same double-check as a text bubble, for the owner's own voice notes. */
function Ticks({ status }: { status: MessageStatus }) {
  const blue = status === "read";
  return (
    <svg
      viewBox="0 0 18 12"
      className={`ml-2 inline-block h-[28px] w-8 align-[-5px] ${
        blue ? "text-[#53bdeb]" : "text-[#8696a0]"
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 6.5l3.2 3.2L10.5 2.5" />
      {status === "sent" ? null : <path d="M6.5 9.7L12.8 2.5" />}
    </svg>
  );
}
