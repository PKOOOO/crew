"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  CloudSun,
  Flashlight,
  Lock,
  MessageCircle,
  Moon,
  Phone,
  X,
} from "lucide-react";
import type { LockscreenEvent } from "@/types/scene";

export type LockscreenScreenProps = {
  events: LockscreenEvent[];
  /** The scene's clock, 12-hour ("11:43 PM"). Omitted = live clock. */
  time?: string;
  /** The scene's date line, e.g. "Sunday 19 July". Omitted = today. */
  date?: string;
  autoStart?: boolean;
  /** Called once when all events have played. */
  onFinished?: () => void;
};

type Banner = {
  id: string;
  app: "call" | "message";
  from: string;
  preview: string;
  icon?: string;
  status: "delivered" | "read" | "missed" | null;
  statusLabel?: string;
};

/** Place shown beside the date — set dressing, not scene data. */
const WEATHER = { place: "Mvita" };

const STATUS_LABEL: Record<NonNullable<Banner["status"]>, string> = {
  delivered: "Delivered",
  read: "Read",
  missed: "Missed",
};

export default function LockscreenScreen({
  events,
  time: fixedTime,
  date: fixedDate,
  autoStart = false,
  onFinished,
}: LockscreenScreenProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [now, setNow] = useState<Date>(() => new Date());
  const onFinishedRef = useRef(onFinished);
  const soundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  /* Live clock */
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  /* --------------------------- playback engine --------------------------- */
  useEffect(() => {
    if (!autoStart) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    const play = async () => {
      setBanners([]);

      let autoId = 0;
      for (const event of events) {
        if (cancelled) return;
        await wait(event.delay);
        if (cancelled) return;

        if (event.type === "notification") {
          const id = event.id ?? `notif-${autoId++}`;
          const sound = (soundRef.current ??= new Audio("/notification.wav"));
          sound.currentTime = 0;
          void sound.play().catch(() => {});
          setBanners((previous) => [
            ...previous,
            {
              id,
              app: event.app,
              from: event.from,
              preview: event.preview,
              icon: event.icon,
              status: event.app === "call" ? "missed" : null,
            },
          ]);
          continue;
        }

        // status: update the text under the target banner. The banner stays
        // mounted (keyed by id), so its entrance animation does not re-run.
        setBanners((previous) =>
          previous.map((banner) =>
            banner.id === event.targetNotificationId
              ? { ...banner, status: event.status, statusLabel: event.label }
              : banner,
          ),
        );
      }

      if (!cancelled) onFinishedRef.current?.();
    };

    void play();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      // Stopping the scene stops its sound mid-buzz too.
      soundRef.current?.pause();
    };
  }, [events, autoStart]);

  const time =
    fixedTime ??
    now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const date =
    fixedDate ??
    now.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  // A sun over a midnight scene reads wrong — the glyph follows the clock.
  const hour = Number(time.slice(0, 2));
  const nighttime = Number.isFinite(hour) && (hour >= 19 || hour < 6);

  return (
    <div className="relative h-full w-full overflow-hidden text-white">
      {/* Cloudy dusk wallpaper */}
      <div className="absolute inset-0 bg-[linear-gradient(175deg,#3d6172_0%,#456d80_30%,#4a7387_55%,#3a5a69_100%)]" />
      <div className="absolute -left-24 top-8 h-72 w-[38rem] rounded-full bg-white/12 blur-3xl" />
      <div className="absolute left-1/3 -top-16 h-64 w-[30rem] rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-20 top-1/3 h-80 w-[34rem] rounded-full bg-white/8 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent" />

      {/* One centered column: clock on top, notifications running full width
          underneath it. */}
      <div className="relative flex h-full flex-col items-center px-16 pb-28 pt-12">
        <Lock className="h-9 w-9 shrink-0" strokeWidth={2.6} />

        <div
          suppressHydrationWarning
          className="mt-4 flex shrink-0 items-center gap-3 text-[30px] font-semibold"
        >
          <span>{date}</span>
          {nighttime ? (
            <Moon className="h-8 w-8" fill="white" strokeWidth={0} />
          ) : (
            <CloudSun className="h-9 w-9" strokeWidth={2.2} />
          )}
          <span>{WEATHER.place}</span>
        </div>

        {/* Frosted-glass clock */}
        <div
          suppressHydrationWarning
          className="shrink-0 bg-gradient-to-b from-white/70 to-white/25 bg-clip-text text-[190px] font-semibold leading-[0.95] tracking-tight text-transparent drop-shadow-[0_2px_12px_rgba(0,0,0,0.18)]"
        >
          {time}
        </div>

        {/* Notification centre, below the clock and running the full width */}
        <div className="mt-10 flex min-h-0 w-full max-w-[1240px] flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-4">
            <span className="text-[38px] font-bold">Notification Centre</span>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <X className="h-7 w-7" strokeWidth={2.8} />
            </span>
          </div>

          <div className="mt-6 flex min-h-0 flex-1 flex-col gap-5 overflow-hidden">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="flex w-full shrink-0 items-center gap-7 rounded-[36px] bg-white/15 px-9 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.22)] ring-1 ring-white/15 backdrop-blur-xl"
                style={{ animation: "wa-notif-in 0.35s ease-out" }}
              >
                <AppIcon app={banner.app} icon={banner.icon} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[34px] font-bold">
                      {banner.from}
                    </span>
                    <span className="shrink-0 text-[24px] font-medium text-white/70">
                      now
                    </span>
                  </div>
                  <div className="text-[52px] font-extrabold leading-tight text-white">
                    {banner.preview}
                  </div>
                  {/* A delivered or read message says so with ticks, not
                      words. Anything else (a missed call) still needs text. */}
                  {banner.status === "delivered" || banner.status === "read" ? (
                    <Ticks read={banner.status === "read"} />
                  ) : banner.status ? (
                    <div className="mt-2 text-[26px] font-bold text-white/65">
                      {banner.statusLabel ?? STATUS_LABEL[banner.status]}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Torch, camera, home indicator */}
      <span className="absolute bottom-9 left-16 flex h-20 w-20 items-center justify-center rounded-full bg-black/25 backdrop-blur-md">
        <Flashlight className="h-9 w-9" strokeWidth={2.2} />
      </span>
      <span className="absolute bottom-9 right-16 flex h-20 w-20 items-center justify-center rounded-full bg-black/25 backdrop-blur-md">
        <Camera className="h-9 w-9" strokeWidth={2.2} />
      </span>
      <span className="absolute bottom-3 left-1/2 h-1.5 w-56 -translate-x-1/2 rounded-full bg-white/80" />
    </div>
  );
}

/** Double check on the notification — blue once it has been read. */
function Ticks({ read }: { read: boolean }) {
  return (
    <svg
      viewBox="0 0 18 12"
      className={`mt-3 h-[44px] w-[62px] ${
        read ? "text-[#53bdeb]" : "text-white/60"
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={read ? "Read" : "Delivered"}
    >
      <path d="M1 6.5l3.2 3.2L10.5 2.5" />
      <path d="M6.5 9.7L12.8 2.5" />
    </svg>
  );
}

/** The notification's app tile: the real icon when the scene supplies one. */
function AppIcon({ app, icon }: { app: "call" | "message"; icon?: string }) {
  if (icon) {
    return (
      <Image
        src={icon}
        alt=""
        width={72}
        height={72}
        unoptimized
        className="h-[72px] w-[72px] shrink-0 rounded-[18px] object-cover"
      />
    );
  }

  return (
    <span
      className={`flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[18px] ${
        app === "call" ? "bg-[#34c759]" : "bg-[#00a884]"
      }`}
    >
      {app === "call" ? (
        <Phone className="h-10 w-10" fill="white" strokeWidth={0} />
      ) : (
        <MessageCircle className="h-10 w-10" fill="white" strokeWidth={0} />
      )}
    </span>
  );
}
