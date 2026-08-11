"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import type { TikTokEvent } from "@/types/scene";

export type TikTokScreenProps = {
  events: TikTokEvent[];
  username?: string;
  autoStart?: boolean;
  /** Called once when all events have played. */
  onFinished?: () => void;
};

/** Dwell before a caption replaces one already on screen, so both register. */
const CAPTION_SWAP_DWELL_MS = 1600;

/** Gap between like-sound pops while the counter is climbing. */
const LIKE_POP_INTERVAL_MS = 320;

type Comment = { author: string; text: string };

/** TikTok-style count: 999 → "999", 1200 → "1.2K", 4200000 → "4.2M". */
function formatCount(count: number): string {
  if (count >= 1_000_000)
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(count);
}

export default function TikTokScreen({
  events,
  username = "maya.k",
  autoStart = false,
  onFinished,
}: TikTokScreenProps) {
  const [caption, setCaption] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState(0);
  const onFinishedRef = useRef(onFinished);
  const likesSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  /* --------------------------- playback engine --------------------------- */
  useEffect(() => {
    if (!autoStart) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    const play = async () => {
      setCaption(null);
      setComments([]);
      setLikes(0);
      let likesNow = 0;
      let captionShown = false;

      for (const event of events) {
        if (cancelled) return;

        if (event.type === "caption") {
          if (captionShown) await wait(CAPTION_SWAP_DWELL_MS);
          if (cancelled) return;
          setCaption(event.text);
          captionShown = true;
          continue;
        }

        if (event.type === "comment") {
          await wait(event.delay);
          if (cancelled) return;
          setComments((previous) => [
            ...previous,
            { author: event.author, text: event.text },
          ]);
          continue;
        }

        // likes: tween from the current value to target over duration. The
        // sound retriggers in short pops while the counter climbs, rather
        // than playing once continuously.
        const likesSound = (likesSoundRef.current ??= new Audio("/likes.mp3"));
        const from = likesNow;
        let lastPop = 0;
        await new Promise<void>((resolve) => {
          const startedAt = performance.now();
          const step = (now: number) => {
            if (cancelled) {
              resolve();
              return;
            }
            const progress = Math.min(1, (now - startedAt) / event.duration);
            likesNow = Math.round(from + (event.target - from) * progress);
            setLikes(likesNow);
            if (now - lastPop >= LIKE_POP_INTERVAL_MS && progress < 1) {
              lastPop = now;
              likesSound.currentTime = 0;
              void likesSound.play().catch(() => {});
            }
            if (progress < 1) {
              frame = requestAnimationFrame(step);
            } else {
              likesSound.pause();
              resolve();
            }
          };
          frame = requestAnimationFrame(step);
        });
      }

      if (!cancelled) onFinishedRef.current?.();
    };

    void play();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      cancelAnimationFrame(frame);
      likesSoundRef.current?.pause();
    };
  }, [events, autoStart]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0b0b0f] text-white">
      {/* Video placeholder */}
      <div className="absolute inset-0 bg-[radial-gradient(130%_90%_at_30%_15%,#232c3b_0%,#12141c_55%,#0b0b0f_100%)]" />

      {/* Right action rail */}
      <div className="absolute bottom-36 right-5 z-10 flex flex-col items-center gap-7">
        <RailAction
          icon={
            <Heart
              className="h-8 w-8"
              fill={likes > 0 ? "#fe2c55" : "none"}
              stroke={likes > 0 ? "#fe2c55" : "currentColor"}
              strokeWidth={1.8}
            />
          }
          label={formatCount(likes)}
        />
        <RailAction
          icon={<MessageCircle className="h-8 w-8" strokeWidth={1.8} />}
          label={formatCount(comments.length)}
        />
        <RailAction
          icon={<Share2 className="h-8 w-8" strokeWidth={1.8} />}
          label="Share"
        />
      </div>

      {/* Comments + caption, bottom-left */}
      <div className="absolute bottom-8 left-6 right-24 z-10 flex flex-col gap-3">
        <div className="flex max-h-44 flex-col justify-end gap-1.5 overflow-hidden">
          {comments.map((comment, index) => (
            <div
              key={index}
              className="w-fit max-w-full rounded-2xl bg-black/45 px-3.5 py-2 text-[16px] font-medium leading-snug"
              style={{ animation: "wa-slide-up 0.3s ease-out" }}
            >
              <span className="font-semibold">@{comment.author}</span>{" "}
              <span className="text-white/90">{comment.text}</span>
            </div>
          ))}
        </div>

        <div className="text-[18px] font-bold">@{username}</div>
        {caption ? (
          <div
            key={caption}
            className="text-[17px] font-semibold leading-snug text-white/95"
            style={{ animation: "wa-slide-up 0.3s ease-out" }}
          >
            {caption}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RailAction({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
      {icon}
      <span className="text-[14px] font-bold">{label}</span>
    </div>
  );
}
