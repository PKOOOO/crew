"use client";

import { useEffect, useRef, useState } from "react";
import {
  Archive,
  Bell,
  Camera,
  MessageCircle,
  MoreHorizontal,
  Phone,
  PhoneMissed,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";
import type { ChatListEvent } from "@/types/scene";
import { buildSenderColors, resolveSenderColor } from "@/lib/sender-colors";

export type ChatListScreenProps = {
  events: ChatListEvent[];
  unreadTotal?: number;
  groupTotal?: number;
  autoStart?: boolean;
  /** Called once when all rows have appeared. */
  onFinished?: () => void;
};

type Row = {
  name: string;
  preview: string;
  time: string;
  kind: "message" | "missed-call";
  ticks: "none" | "sent" | "delivered" | "read";
  unreadCount: number;
  highlight: boolean;
};

export default function ChatListScreen({
  events,
  unreadTotal = 139,
  groupTotal = 23,
  autoStart = false,
  onFinished,
}: ChatListScreenProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const onFinishedRef = useRef(onFinished);
  const soundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

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
      setRows([]);

      for (const event of events) {
        if (cancelled) return;
        await wait(event.delay);
        if (cancelled) return;

        if (event.highlight) {
          const sound = (soundRef.current ??= new Audio("/notification.wav"));
          sound.currentTime = 0;
          void sound.play().catch(() => {});
        }

        setRows((previous) => [
          ...previous,
          {
            name: event.name,
            preview: event.preview,
            time: event.time,
            kind: event.kind ?? "message",
            ticks: event.ticks ?? "none",
            unreadCount: event.unreadCount ?? 0,
            highlight: event.highlight ?? false,
          },
        ]);
      }

      if (!cancelled) onFinishedRef.current?.();
    };

    void play();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [events, autoStart]);

  const colors = buildSenderColors(events.map((event) => event.name));

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-black text-white">
      <div className="flex h-full w-full flex-col px-6 md:px-10">
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between pt-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <MoreHorizontal className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Camera className="h-6 w-6" strokeWidth={2} />
            </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25d366]">
              <Plus className="h-7 w-7 text-black" strokeWidth={3} />
            </span>
          </div>
        </div>

        {/* Title + search share a row once there is width for it */}
        <div className="mt-2 flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:gap-8">
          <h1 className="text-[44px] font-bold leading-tight md:text-[52px]">
            Chats
          </h1>
          <div className="flex h-14 flex-1 items-center gap-4 rounded-full bg-[#1c1c1e] px-5 md:h-16">
            <Search
              className="h-6 w-6 shrink-0 text-white/50"
              strokeWidth={2.5}
            />
            <span className="text-[22px] font-medium text-white/50 md:text-[26px]">
              Ask Meta AI or Search
            </span>
          </div>
        </div>

        {/* Filter pills + archived share a row on wide screens */}
        <div className="mt-3 flex shrink-0 flex-col gap-3 border-b border-white/10 pb-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Pill active>All</Pill>
            <Pill>Unread {unreadTotal}</Pill>
            <Pill>Favorites</Pill>
            <Pill>Groups {groupTotal}</Pill>
          </div>
          <div className="flex items-center gap-5 md:shrink-0">
            <Archive className="h-7 w-7 text-white/70" strokeWidth={2} />
            <span className="flex-1 text-[26px] font-semibold">Archived</span>
            <span className="text-[22px] text-white/50">27</span>
          </div>
        </div>

        {/* Chat rows — full width of the landscape screen */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rows.map((row, index) => (
            <div
              key={`${row.name}-${index}`}
              className="flex w-full items-center gap-6 border-b border-white/[0.07] py-6 md:gap-8 md:py-7"
              style={{ animation: "wa-slide-up 0.35s ease-out" }}
            >
              <span
                className="flex h-[86px] w-[86px] shrink-0 items-center justify-center rounded-full text-[34px] font-bold text-white md:h-[104px] md:w-[104px] md:text-[42px]"
                style={{ backgroundColor: resolveSenderColor(row.name, colors) }}
              >
                {row.name.slice(0, 1).toUpperCase()}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-3">
                  <span className="min-w-0 flex-1 truncate text-[36px] font-bold leading-tight md:text-[44px]">
                    {row.name}
                  </span>
                  <span
                    className={`shrink-0 text-[22px] md:text-[28px] ${
                      row.unreadCount ? "font-semibold text-[#25d366]" : "text-white/50"
                    }`}
                  >
                    {row.time}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2.5">
                  {row.kind === "missed-call" ? (
                    <PhoneMissed
                      className="h-6 w-6 shrink-0 text-[#f15c6d] md:h-8 md:w-8"
                      strokeWidth={2.5}
                    />
                  ) : row.ticks !== "none" ? (
                    <Ticks status={row.ticks} />
                  ) : null}
                  <span
                    className={`min-w-0 flex-1 truncate text-[26px] md:text-[32px] ${
                      row.unreadCount
                        ? "font-semibold text-white"
                        : "text-white/60"
                    }`}
                  >
                    {row.preview}
                  </span>
                  {row.unreadCount ? (
                    <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-[#25d366] px-2 text-[20px] font-bold text-black md:h-11 md:min-w-11 md:text-[24px]">
                      {row.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div className="mx-auto mb-2 mt-2 flex w-full max-w-[820px] shrink-0 items-center justify-around rounded-full bg-[#1c1c1e] px-2 py-2.5">
          <NavItem icon={<Bell className="h-7 w-7" strokeWidth={2} />} label="Updates" />
          <NavItem
            icon={<Phone className="h-7 w-7" strokeWidth={2} />}
            label="Calls"
            badge={2}
          />
          <NavItem
            icon={<Users className="h-7 w-7" strokeWidth={2} />}
            label="Communities"
          />
          <NavItem
            icon={<MessageCircle className="h-7 w-7" strokeWidth={2} />}
            label="Chats"
            badge={unreadTotal}
            active
          />
          <NavItem
            icon={<Settings className="h-7 w-7" strokeWidth={2} />}
            label="Settings"
            badge={1}
          />
        </div>
      </div>
    </div>
  );
}

/** Delivered (grey) vs read (blue) ticks, as shown on a chat row. */
function Ticks({ status }: { status: "sent" | "delivered" | "read" }) {
  return (
    <svg
      viewBox="0 0 18 12"
      className={`h-6 w-8 shrink-0 md:h-8 md:w-11 ${
        status === "read" ? "text-[#53bdeb]" : "text-white/45"
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 6.5l3.2 3.2L10.5 2.5" />
      {status === "sent" ? null : <path d="M6.5 9.7L12.8 2.5" />}
    </svg>
  );
}

function Pill({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-[22px] font-semibold ${
        active ? "bg-[#0a3d2a] text-[#25d366]" : "bg-[#1c1c1e] text-white/70"
      }`}
    >
      {children}
    </span>
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
      className={`relative flex flex-col items-center gap-1 rounded-full px-4 py-1 ${
        active ? "bg-white/10 text-white" : "text-white/60"
      }`}
    >
      {icon}
      {badge ? (
        <span className="absolute -top-1 left-1/2 ml-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#25d366] px-1.5 text-[14px] font-bold text-black">
          {badge}
        </span>
      ) : null}
      <span className="text-[16px] font-medium">{label}</span>
    </div>
  );
}
