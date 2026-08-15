"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import type { LockscreenEvent } from "@/types/scene";

export type LockscreenScreenProps = {
  events: LockscreenEvent[];
  /** The scene's clock, 24-hour ("23:43"). Omitted = live clock. */
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
  status: "delivered" | "read" | "missed" | null;
  statusLabel?: string;
};

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

  return (
    <div className="relative h-full w-full overflow-hidden text-white">
      {/* Dark blurred-wallpaper background */}
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#1d2951_0%,#101433_45%,#2b1548_100%)]" />
      <div className="absolute -left-16 top-24 h-64 w-64 rounded-full bg-[#4a5fc1]/30 blur-3xl" />
      <div className="absolute -right-12 bottom-24 h-72 w-72 rounded-full bg-[#7b3fa0]/25 blur-3xl" />

      <div className="relative flex h-full flex-col items-center px-3 pt-16">
        {/* Clock */}
        <div
          suppressHydrationWarning
          className="text-[96px] font-extralight leading-none tracking-tight"
        >
          {time}
        </div>
        <div suppressHydrationWarning className="mt-3 text-[19px] text-white/80">
          {date}
        </div>

        {/* Notification banners */}
        <div className="mt-12 flex w-full max-w-[560px] flex-col gap-2.5">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="flex items-start gap-3 rounded-3xl bg-white/15 p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-xl"
              style={{ animation: "wa-notif-in 0.35s ease-out" }}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                  banner.app === "call" ? "bg-[#34c759]" : "bg-[#00a884]"
                }`}
              >
                {banner.app === "call" ? (
                  <Phone className="h-5 w-5" fill="white" strokeWidth={0} />
                ) : (
                  <MessageCircle
                    className="h-5 w-5"
                    fill="white"
                    strokeWidth={0}
                  />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[18px] font-bold">
                    {banner.from}
                  </span>
                  <span className="shrink-0 text-[13px] text-white/60">
                    now
                  </span>
                </div>
                <div className="truncate text-[17px] font-medium text-white/95">
                  {banner.preview}
                </div>
                {banner.status ? (
                  <div className="mt-0.5 text-[14px] font-medium text-white/60">
                    {banner.statusLabel ?? STATUS_LABEL[banner.status]}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
