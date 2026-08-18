"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Heart,
  House,
  MessageCircle,
  Music2,
  Plus,
  Share2,
  User,
  Users,
} from "lucide-react";
import type { TikTokEvent } from "@/types/scene";

export type TikTokScreenProps = {
  events: TikTokEvent[];
  username?: string;
  /** The clip playing behind the UI (path under /public). */
  video?: string;
  /** Pop heard while the like counter climbs. */
  likesSound?: string;
  autoStart?: boolean;
  /** Called once when all events have played. */
  onFinished?: () => void;
};

/** Dwell before a caption replaces one already on screen, so both register. */
const CAPTION_SWAP_DWELL_MS = 1600;

/** Gap between like-sound pops while the counter is climbing. */
const LIKE_POP_INTERVAL_MS = 320;

/**
 * Comments kept on screen. Older ones drop off whole rather than being
 * sliced in half by the overflow edge.
 */
const MAX_VISIBLE_COMMENTS = 5;

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
  video,
  likesSound = "/likes.mp3",
  autoStart = false,
  onFinished,
}: TikTokScreenProps) {
  const [caption, setCaption] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState(0);
  /** The post on screen. A swipe replaces all three. */
  const [clip, setClip] = useState(video);
  const [author, setAuthor] = useState(username);
  /** Bumped per swipe so the slide-in animation retriggers. */
  const [swipe, setSwipe] = useState(0);
  const onFinishedRef = useRef(onFinished);
  const likesSoundRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const backdropRef = useRef<HTMLVideoElement>(null);

  /* The clip runs with the scene: from the top when it starts, stopped dead
   * when the curtain shuts. */
  useEffect(() => {
    const main = videoRef.current;
    const backdrop = backdropRef.current;
    if (!main) return;

    if (!autoStart) {
      main.pause();
      backdrop?.pause();
      return;
    }

    main.currentTime = 0;
    if (backdrop) backdrop.currentTime = 0;

    // Autoplay with sound is blocked until the page has been clicked. The
    // display's "tap to enable sound" gate handles that — but if it is still
    // refused, fall back to a muted play so the clip is at least visible.
    void main.play().catch(() => {
      main.muted = true;
      void main.play().catch(() => {});
    });
    void backdrop?.play().catch(() => {});
  }, [autoStart, clip]);

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
      setClip(video);
      setAuthor(username);
      let likesNow = 0;
      let captionShown = false;

      for (const event of events) {
        if (cancelled) return;

        if (event.type === "swipe") {
          // A whole new post: clip, caption, author and count all replaced,
          // and the screen slides up to meet it.
          if (event.video !== undefined) setClip(event.video);
          if (event.username !== undefined) setAuthor(event.username);
          setCaption(event.caption ?? null);
          setComments([]);
          likesNow = event.likes ?? 0;
          setLikes(likesNow);
          captionShown = Boolean(event.caption);
          setSwipe((count) => count + 1);

          await wait(event.duration);
          continue;
        }

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
        const pop = (likesSoundRef.current ??= new Audio(likesSound));
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
              pop.currentTime = 0;
              void pop.play().catch(() => {});
            }
            if (progress < 1) {
              frame = requestAnimationFrame(step);
            } else {
              pop.pause();
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
  }, [events, autoStart, video, username, likesSound]);

  const saves = Math.round(likes * 0.5);
  const shares = Math.round(likes * 0.05);
  const visibleComments = comments.slice(-MAX_VISIBLE_COMMENTS);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black text-white">
      {/* The clip. It is shot portrait and the frame is landscape, so the
          video is contained at full height over a blurred, cropped copy of
          itself — no black bars, the way the apps themselves handle it. The
          key is the swipe counter: a new post climbs in from below. */}
      <div
        key={swipe}
        className="absolute inset-0"
        style={
          swipe > 0
            ? { animation: "tiktok-swipe-up 0.45s cubic-bezier(0.2,0,0.1,1)" }
            : undefined
        }
      >
        {clip ? (
          <>
            <video
              ref={backdropRef}
              src={clip}
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-[0.45]"
            />
            <video
              ref={videoRef}
              src={clip}
              loop
              playsInline
              preload="auto"
              className="absolute inset-0 h-full w-full object-contain"
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_45%_35%,#3a3230_0%,#1a1614_50%,#0a0908_100%)]" />
        )}
      </div>

      {/* Top tabs — pushed clear of the phone's overlay status bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-center gap-6 px-5 pt-11 md:pt-14">
        <span className="text-[24px] font-semibold text-white/70">STEM</span>
        <span className="text-[24px] font-semibold text-white/70">
          Community
        </span>
        <span className="text-[24px] font-semibold text-white/70">
          Following
        </span>
        <span className="flex flex-col items-center">
          <span className="text-[24px] font-bold text-white">For You</span>
          <span className="mt-1 h-[3px] w-7 rounded-full bg-white" />
        </span>
      </div>

      {/* Right action rail */}
      <div className="absolute bottom-32 right-5 z-20 flex flex-col items-center gap-7">
        {/* Profile avatar with follow badge */}
        <div className="relative mb-2">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#b39ddb] to-[#7e57c2] ring-2 ring-white">
            <User className="h-8 w-8" fill="white" strokeWidth={0} />
          </span>
          <span className="absolute -bottom-2.5 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-[#fe2c55]">
            <Plus className="h-4.5 w-4.5" strokeWidth={3} />
          </span>
        </div>

        <RailAction
          icon={
            <Heart
              className="h-14 w-14"
              fill={likes > 0 ? "#fe2c55" : "white"}
              stroke={likes > 0 ? "#fe2c55" : "white"}
              strokeWidth={0}
            />
          }
          label={formatCount(likes)}
        />
        <RailAction
          icon={
            <MessageCircle className="h-14 w-14" fill="white" strokeWidth={0} />
          }
          label={formatCount(comments.length)}
        />
        <RailAction
          icon={<Bookmark className="h-14 w-14" fill="white" strokeWidth={0} />}
          label={formatCount(saves)}
        />
        <RailAction
          icon={<Share2 className="h-14 w-14" fill="white" strokeWidth={0} />}
          label={formatCount(shares)}
        />

        {/* Spinning album art */}
        <span className="mt-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#5d4037] to-[#212121] ring-[3px] ring-[#2a2a2a]">
          <Music2 className="h-6 w-6" fill="white" strokeWidth={0} />
        </span>
      </div>

      {/* Bottom-left column: comments stack above the caption block. One
          flex column so a long caption pushes the comments up instead of
          overlapping them. */}
      <div className="absolute bottom-[96px] left-5 right-32 top-[20%] z-20 flex flex-col justify-end gap-3">
        {/* Comments */}
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-4 overflow-hidden">
          {visibleComments.map((comment, index) => (
            <div
              key={`${comment.author}-${index}`}
              className="w-fit max-w-full rounded-2xl bg-black/50 px-7 py-4 text-[46px] font-bold leading-snug backdrop-blur-sm"
              style={{ animation: "tiktok-comment-in 0.5s ease-out" }}
            >
              <span className="font-semibold text-white/70">
                @{comment.author}
              </span>{" "}
              <span className="text-white">{comment.text}</span>
            </div>
          ))}
        </div>

        {/* Username + caption */}
        <div className="flex shrink-0 flex-col gap-2">
          <div className="text-[32px] font-bold">{author}</div>
          {caption ? (
            <div
              key={caption}
              className="text-[30px] font-semibold leading-snug text-white/95"
              style={{ animation: "wa-slide-up 0.3s ease-out" }}
            >
              {caption}
            </div>
          ) : null}
          <div className="mt-1 flex items-center gap-3 text-[24px] font-medium">
            <Music2 className="h-6 w-6 shrink-0" fill="white" strokeWidth={0} />
            <span className="truncate">
              Contains: original sound — {author}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom nav bar */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-white/10 bg-black px-2 pb-2 pt-1.5">
        <NavItem icon={<House className="h-8 w-8" strokeWidth={2} />} label="Home" active />
        <NavItem
          icon={<Users className="h-8 w-8" strokeWidth={2} />}
          label="Friends"
          badge={4}
        />
        <span className="relative flex h-11 w-16 items-center justify-center">
          <span className="absolute inset-0 -translate-x-1 rounded-lg bg-[#25f4ee]" />
          <span className="absolute inset-0 translate-x-1 rounded-lg bg-[#fe2c55]" />
          <span className="relative flex h-full w-full items-center justify-center rounded-lg bg-white">
            <Plus className="h-7 w-7 text-black" strokeWidth={3} />
          </span>
        </span>
        <NavItem
          icon={<MessageCircle className="h-8 w-8" strokeWidth={2} />}
          label="Inbox"
          badge={3}
        />
        <NavItem icon={<User className="h-8 w-8" strokeWidth={2} />} label="Profile" />
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
    <div className="flex flex-col items-center gap-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
      {icon}
      <span className="text-[28px] font-bold">{label}</span>
    </div>
  );
}

function NavItem({
  icon,
  label,
  badge,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  active?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col items-center gap-0.5 ${
        active ? "text-white" : "text-white/60"
      }`}
    >
      {icon}
      {badge ? (
        <span className="absolute -top-1 left-1/2 ml-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#fe2c55] px-1.5 text-[14px] font-bold text-white">
          {badge}
        </span>
      ) : null}
      <span className="text-[16px] font-medium">{label}</span>
    </div>
  );
}
