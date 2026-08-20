"use client";

import { useEffect, useRef } from "react";
import {
  Copy,
  CornerUpLeft,
  Forward,
  Info,
  Pin,
  SmilePlus,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { Avatar } from "@/components/icons";
import { resolveSenderColor } from "@/lib/sender-colors";
import type { InfoRow } from "@/types/scene";

/* ------------------------------ the pointer ------------------------------ */

export type PointerProps = {
  x: number;
  y: number;
  /** How long the current move takes, ms. */
  travelMs: number;
  /** Pressed: the arrow dips and a ring goes out from the tip. */
  clicking: boolean;
  visible: boolean;
};

/**
 * An oversized mouse pointer, driven from outside. It is not a real cursor —
 * it is a prop, big enough to be followed from the back of a hall, and every
 * move it makes is a transition rather than a jump.
 */
export function Pointer({ x, y, travelMs, clicking, visible }: PointerProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-40"
      style={{
        transform: `translate(${x}px, ${y}px)`,
        transition: `transform ${travelMs}ms cubic-bezier(0.33, 0, 0.15, 1), opacity 500ms ease-out`,
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Ring going out from the tip on a click */}
      <span
        className="absolute left-0 top-0 block rounded-full border-[6px] border-white"
        style={{
          width: 130,
          height: 130,
          marginLeft: -65,
          marginTop: -65,
          opacity: clicking ? 0 : 0,
          animation: clicking ? "wa-click-ring 620ms ease-out" : undefined,
        }}
      />

      {/* The arrow itself. Its tip is the origin, so the transform above
          positions exactly the point that does the clicking. */}
      <svg
        width={112}
        height={132}
        viewBox="0 0 28 33"
        className="block drop-shadow-[0_6px_16px_rgba(0,0,0,0.65)]"
        style={{
          transform: clicking ? "scale(0.84)" : "scale(1)",
          transformOrigin: "0 0",
          transition: "transform 160ms ease-out",
        }}
      >
        <path
          d="M1 1l0 25.5 6.2-6.2 4.6 10.4 4.9-2.2-4.6-10.3 8.7 0z"
          fill="#fff"
          stroke="#111"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* ----------------------------- the long-press ---------------------------- */

/** Fixed metrics, so the row to click next can be found without measuring. */
export const MENU_WIDTH = 560;
export const MENU_ROW_HEIGHT = 88;
export const MENU_PAD_Y = 14;

const MENU_ITEMS = [
  { label: "Message info", Icon: Info },
  { label: "Reply", Icon: CornerUpLeft },
 
  { label: "React", Icon: SmilePlus },
  { label: "Forward", Icon: Forward },

  { label: "Delete", Icon: Trash2 },
];

export const MENU_HEIGHT = MENU_ITEMS.length * MENU_ROW_HEIGHT + MENU_PAD_Y * 2;

/** The card that opens on a held message. Top row highlights on approach. */
export function MessageMenu({
  x,
  y,
  highlight,
}: {
  x: number;
  y: number;
  highlight: boolean;
}) {
  return (
    <div
      className="absolute z-30 overflow-hidden rounded-[28px] bg-[#233138] shadow-[0_18px_60px_rgba(0,0,0,0.6)]"
      style={{
        left: x,
        top: y,
        width: MENU_WIDTH,
        paddingTop: MENU_PAD_Y,
        paddingBottom: MENU_PAD_Y,
        transformOrigin: "0 0",
        animation: "wa-menu-in 260ms cubic-bezier(0.2, 0, 0.1, 1)",
      }}
    >
      {MENU_ITEMS.map(({ label, Icon }, index) => (
        <div
          key={label}
          className={`flex items-center gap-8 px-9 text-[34px] font-medium text-[#e9edef] transition-colors duration-200 ${
            index === 0 && highlight ? "bg-white/10" : ""
          }`}
          style={{ height: MENU_ROW_HEIGHT }}
        >
          <Icon className="h-9 w-9 shrink-0 text-[#aebac1]" strokeWidth={2} />
          {label}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------- the info screen ---------------------------- */

/** Beat held on the message before the list starts moving. */
const INFO_HOLD_MS = 2200;

/**
 * WhatsApp's "Message info": the message itself at the top, then who read it
 * and when. For this play it is the whole point — every name is there, every
 * time is the same, and not one of them answered.
 *
 * Sized for a hall rather than a hand. Everything is big enough that only the
 * message and a name or two are on screen at once, so the list is crawled
 * from the top instead of being fitted — the room reads the names one at a
 * time as they come past.
 */
export function MessageInfoScreen({
  text,
  timestamp,
  readBy,
  deliveredTo,
  senderColors,
  scrollMs = 20000,
  sweeps = 1,
  paused = false,
  onFinished,
}: {
  text: string;
  timestamp: string;
  readBy: InfoRow[];
  deliveredTo?: InfoRow[];
  senderColors?: Record<string, string>;
  /** How long one pass from the message down to the last name takes. */
  scrollMs?: number;
  /**
   * How many one-way passes to make. 1 crawls down and stops; 2 comes back
   * up; 4 goes down, up, down, up. The turns are eased, so the list slows
   * into each end and away from it rather than snapping around.
   */
  sweeps?: number;
  paused?: boolean;
  /** Called once every pass has been made. */
  onFinished?: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const onFinishedRef = useRef(onFinished);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    if (paused) return;
    const body = bodyRef.current;
    if (!body) return;

    body.scrollTop = 0;
    let frame = 0;
    const total = scrollMs * sweeps;

    const begin = setTimeout(() => {
      const startedAt = performance.now();
      const step = (now: number) => {
        // Re-measured every frame: the avatars settle their own heights as
        // they paint, and a distance read once would come up short.
        const distance = body.scrollHeight - body.clientHeight;
        const progress = Math.min(1, (now - startedAt) / total);

        // A cosine turned into 0→1→0→1… over the passes. It reaches each end
        // at zero speed, so a change of direction reads as the list settling
        // and setting off again rather than bouncing off a wall.
        const phase = progress * sweeps;
        body.scrollTop = distance * ((1 - Math.cos(phase * Math.PI)) / 2);

        if (progress < 1) frame = requestAnimationFrame(step);
        else onFinishedRef.current?.();
      };
      frame = requestAnimationFrame(step);
    }, INFO_HOLD_MS);

    return () => {
      clearTimeout(begin);
      cancelAnimationFrame(frame);
    };
  }, [scrollMs, sweeps, paused]);

  return (
    <div
      ref={bodyRef}
      className="absolute inset-0 z-30 overflow-hidden bg-[#f0f2f5] px-16 pt-12 text-[#111b21]"
      style={{ animation: "wa-info-in 420ms cubic-bezier(0.2, 0, 0.1, 1)" }}
    >
      {/* The message, sitting where it sat in the chat — across most of the
          frame, so it reads as the subject of the screen. */}
      <div className="flex justify-end">
        <div className="relative max-w-[88%] rounded-[32px] rounded-tr-none bg-[#d9fdd3] px-12 py-9 shadow-[0_1px_1px_rgba(11,20,26,0.13)]">
          <span className="block whitespace-pre-wrap break-words text-[76px] font-semibold leading-[98px]">
            {text}
            <span className="invisible ml-6 inline-block text-[40px]">
              {timestamp}
            </span>
          </span>
          <span className="absolute bottom-6 right-10 flex items-center gap-4 text-[40px] font-medium text-[#667781]">
            {timestamp}
            <DoubleTick className="h-[42px] w-[54px] text-[#53bdeb]" />
          </span>
        </div>
      </div>

      <Section
        label="Read by"
        tickClass="text-[#53bdeb]"
        rows={readBy}
        senderColors={senderColors}
        pulse
      />

      {deliveredTo?.length ? (
        <Section
          label="Delivered to"
          tickClass="text-[#667781]"
          rows={deliveredTo}
          senderColors={senderColors}
        />
      ) : null}

      {/* Room under the last name, so it can crawl clear of the bottom edge. */}
      <div className="h-40" />
    </div>
  );
}

function Section({
  label,
  tickClass,
  rows,
  senderColors,
  pulse = false,
}: {
  label: string;
  tickClass: string;
  rows: InfoRow[];
  senderColors?: Record<string, string>;
  /** Breathe the times in and out — they are the point of the screen. */
  pulse?: boolean;
}) {
  return (
    <div className="mt-16">
      <div className="flex items-center gap-7">
        <DoubleTick className={`h-[48px] w-[62px] ${tickClass}`} />
        <span className="text-[54px] font-medium text-[#667781]">{label}</span>
      </div>

      {/* Each row is about half the screen tall, so the crawl brings two
          names past at a time and neither has to be squinted at. */}
      <div className="mt-12 flex flex-col gap-40">
        {rows.map((row) => (
          <div key={`${label}-${row.name}`} className="flex items-center gap-12">
            <Avatar
              name={row.name}
              color={resolveSenderColor(row.name, senderColors ?? {})}
              size={360}
            />
            <div className="min-w-0">
              <div className="truncate text-[150px] font-bold leading-tight text-[#111b21]">
                {row.name}
              </div>
              <div className="mt-4 text-[92px] font-medium text-[#667781]">
                <span
                  className="inline-block origin-left"
                  style={
                    pulse
                      ? {
                          animation:
                            "wa-time-pulse 2.4s ease-in-out infinite",
                        }
                      : undefined
                  }
                >
                  {row.time}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DoubleTick({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 12"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 6.5l3.2 3.2L10.5 2.5" />
      <path d="M6.5 9.7L12.8 2.5" />
    </svg>
  );
}
