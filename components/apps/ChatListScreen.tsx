"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Archive,
  Bell,
  Camera,
  Check,
  MessageCircle,
  MoreHorizontal,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  Pin,
  Plus,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import type { ChatListEvent, PinnedChat } from "@/types/scene";
import {
  buildSenderColors,
  GROUP_AVATAR,
  resolveSenderColor,
} from "@/lib/sender-colors";

export type ChatListScreenProps = {
  events: ChatListEvent[];
  unreadTotal?: number;
  groupTotal?: number;
  /** Group kept at the top of the list, above everything that lands. */
  pinned?: PinnedChat;
  /**
   * Take the chats one at a time: each one rises over the list on its own,
   * at a size that reads from the back of a hall, holds, and eases away
   * again before the next arrives. The list is still built underneath, so
   * what is left at the end is the whole screen.
   */
  spotlight?: boolean;
  autoStart?: boolean;
  /** Called once when all rows have appeared. */
  onFinished?: () => void;
};

type Row = {
  id: string;
  name: string;
  preview: string;
  time: string;
  kind: "message" | "missed-call" | "ringing";
  ticks: "none" | "sent" | "delivered" | "read";
  unreadCount: number;
  highlight: boolean;
};

/** Rings and buzzes together while a call comes in. */
const RING_SRC = "/call.mp3";
const VIBRATE_SRC = "/vibrate.mp3";

/** How long a chat is left alone on screen before the next one arrives. */
const SPOT_HOLD_MS = 3200;

export default function ChatListScreen({
  events,
  unreadTotal = 139,
  groupTotal = 23,
  pinned,
  spotlight = false,
  autoStart = false,
  onFinished,
}: ChatListScreenProps) {
  const [rows, setRows] = useState<Row[]>([]);
  /** Who is calling right now, if anyone — drives the accept/decline banner. */
  const [incomingCall, setIncomingCall] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const onFinishedRef = useRef(onFinished);
  const soundRef = useRef<HTMLAudioElement | null>(null);
  const ringRef = useRef<HTMLAudioElement | null>(null);
  const vibrateRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  /* The newest chat is the one being read, so the list follows it down. */
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [rows]);

  /* --------------------------- playback engine --------------------------- */
  useEffect(() => {
    if (!autoStart) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    /** Ringtone and buzz run together, both looping until the call ends. */
    const startRinging = () => {
      const ring = (ringRef.current ??= new Audio(RING_SRC));
      const buzz = (vibrateRef.current ??= new Audio(VIBRATE_SRC));
      for (const sound of [ring, buzz]) {
        sound.loop = true;
        sound.currentTime = 0;
        void sound.play().catch(() => {});
      }
    };

    const stopRinging = () => {
      ringRef.current?.pause();
      vibrateRef.current?.pause();
    };

    const play = async () => {
      setRows([]);
      setIncomingCall(null);

      // The group they were all laughing in is already there, pinned, filling
      // the screen. It is left alone before anything lands on top of it.
      if (spotlight && pinned) {
        await wait(SPOT_HOLD_MS);
        if (cancelled) return;
      }

      let autoId = 0;
      for (const event of events) {
        if (cancelled) return;
        await wait(event.delay);
        if (cancelled) return;

        const id = `row-${autoId++}`;

        if (event.type === "call") {
          // Ringing: banner in, row live, both sounds going.
          setRows((previous) => [
            ...previous,
            {
              id,
              name: event.name,
              preview: "Voice call",
              time: event.time,
              kind: "ringing",
              ticks: "none",
              unreadCount: 0,
              highlight: true,
            },
          ]);
          setIncomingCall(event.name);
          startRinging();

          await wait(event.duration);

          // Nobody picks up.
          stopRinging();
          setIncomingCall(null);
          if (cancelled) return;
          setRows((previous) =>
            previous.map((row) =>
              row.id === id
                ? { ...row, kind: "missed-call", preview: "Missed voice call" }
                : row,
            ),
          );
          continue;
        }

        if (event.highlight) {
          const sound = (soundRef.current ??= new Audio("/notification.wav"));
          sound.currentTime = 0;
          void sound.play().catch(() => {});
        }

        setRows((previous) => [
          ...previous,
          {
            id,
            name: event.name,
            preview: event.preview,
            time: event.time,
            kind: event.kind ?? "message",
            ticks: event.ticks ?? "none",
            unreadCount: event.unreadCount ?? 0,
            highlight: event.highlight ?? false,
          },
        ]);

        // Left alone on screen before the next chat pushes it up.
        if (spotlight) {
          await wait(SPOT_HOLD_MS);
          if (cancelled) return;
        }
      }

      if (!cancelled) onFinishedRef.current?.();
    };

    void play();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      // A stopped scene stops ringing too.
      soundRef.current?.pause();
      ringRef.current?.pause();
      vibrateRef.current?.pause();
    };
  }, [events, autoStart, spotlight, pinned]);

  const colors = buildSenderColors(events.map((event) => event.name));

  /*
   * Sized for a hall when the scene asks for it: one chat fills the screen
   * and the next one pushes it up, rather than five sitting in a list nobody
   * past the third row can read.
   */
  const avatarClass = spotlight
    ? "h-[380px] w-[380px] text-[150px]"
    : "h-[86px] w-[86px] text-[34px] md:h-[104px] md:w-[104px] md:text-[42px]";
  const nameClass = spotlight
    ? "text-[124px]"
    : "text-[36px] md:text-[44px]";
  const previewClass = spotlight ? "text-[76px]" : "text-[26px] md:text-[32px]";
  const timeClass = spotlight ? "text-[64px]" : "text-[22px] md:text-[28px]";
  const rowClass = spotlight
    ? "gap-16 py-14"
    : "gap-6 py-6 md:gap-8 md:py-7";
  const tickClass = spotlight
    ? "h-14 w-20"
    : "h-6 w-8 md:h-8 md:w-11";

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white text-[#111b21]">
      {/* Incoming call banner — an OS overlay, so it stays dark over the
          light app, exactly as it does on the phone. */}
      {incomingCall ? (
        <div
          className="absolute left-1/2 top-4 z-30 flex w-[860px] max-w-[90%] -translate-x-1/2 items-center gap-8 rounded-[28px] bg-[#1f1f1f] px-9 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
          style={{ animation: "wa-notif-in 0.35s ease-out" }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <Image
                src="/apple.png"
                alt=""
                width={34}
                height={34}
                unoptimized
                className="h-[34px] w-[34px] shrink-0 rounded-[8px]"
              />
              <span className="truncate text-[28px] font-medium text-white/60">
                WhatsApp Audio…
              </span>
            </div>
            <div className="mt-1 truncate text-[44px] font-bold text-white">
              {incomingCall}
            </div>
          </div>

          <span className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full bg-[#e5342c]">
            <X className="h-10 w-10 text-white" strokeWidth={3.5} />
          </span>
          <span className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full bg-[#0b6bf2]">
            <Check className="h-10 w-10 text-white" strokeWidth={3.5} />
          </span>
        </div>
      ) : null}

      <div className="flex h-full w-full flex-col px-6 md:px-10">
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between pt-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f2f5]">
            <MoreHorizontal className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f2f5]">
              <Camera className="h-6 w-6" strokeWidth={2} />
            </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25d366]">
              <Plus className="h-7 w-7 text-white" strokeWidth={3} />
            </span>
          </div>
        </div>

        {/* Title + search share a row once there is width for it. Both are
            dropped when one chat is filling the screen — every pixel they
            take is a pixel off the thing the room is meant to read. */}
        <div
          className={`mt-2 flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:gap-8 ${
            spotlight ? "hidden" : ""
          }`}
        >
          <h1 className="text-[44px] font-bold leading-tight md:text-[52px]">
            Chats
          </h1>
          <div className="flex h-14 flex-1 items-center gap-4 rounded-full bg-[#f0f2f5] px-5 md:h-16">
            <Search
              className="h-6 w-6 shrink-0 text-[#8696a0]"
              strokeWidth={2.5}
            />
            <span className="text-[22px] font-medium text-[#8696a0] md:text-[26px]">
              Ask Meta AI or Search
            </span>
          </div>
        </div>

        {/* Filter pills + archived share a row on wide screens */}
        <div
          className={`mt-3 flex shrink-0 flex-col gap-3 border-b border-[#e9edef] pb-3 md:flex-row md:items-center md:justify-between ${
            spotlight ? "hidden" : ""
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Pill active>All</Pill>
            <Pill>Unread {unreadTotal}</Pill>
            <Pill>Favorites</Pill>
            <Pill>Groups {groupTotal}</Pill>
          </div>
          <div className="flex items-center gap-5 md:shrink-0">
            <Archive className="h-7 w-7 text-[#54656f]" strokeWidth={2} />
            <span className="flex-1 text-[26px] font-semibold">Archived</span>
            <span className="text-[22px] text-[#8696a0]">27</span>
          </div>
        </div>

        {/* Chat rows — full width of the landscape screen */}
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
          {/* The group sits pinned above everything, there from the start. */}
          {pinned ? (
            <div
              className={`flex w-full items-center border-b border-[#e9edef] ${rowClass}`}
            >
              <Image
                src={GROUP_AVATAR}
                alt=""
                width={380}
                height={380}
                unoptimized
                className={`shrink-0 rounded-full object-cover ${avatarClass}`}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-3">
                  <span
                    className={`min-w-0 flex-1 truncate font-bold leading-tight ${nameClass}`}
                  >
                    {pinned.name}
                  </span>
                  <span
                    className={`shrink-0 ${timeClass} ${
                      pinned.unreadCount
                        ? "font-semibold text-[#1da851]"
                        : "text-[#667781]"
                    }`}
                  >
                    {pinned.time}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2.5">
                  <span
                    className={`min-w-0 flex-1 truncate ${previewClass} ${
                      pinned.unreadCount
                        ? "font-semibold text-[#111b21]"
                        : "text-[#667781]"
                    }`}
                  >
                    {pinned.preview}
                  </span>
                  <Pin
                    className={`shrink-0 rotate-45 text-[#8696a0] ${
                      spotlight ? "h-14 w-14" : "h-7 w-7 md:h-8 md:w-8"
                    }`}
                    fill="currentColor"
                    strokeWidth={0}
                  />
                  {pinned.unreadCount ? (
                    <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-[#25d366] px-2 text-[20px] font-bold text-white md:h-11 md:min-w-11 md:text-[24px]">
                      {pinned.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {rows.map((row) => (
            <div
              key={row.id}
              className={`flex w-full items-center border-b border-[#e9edef] ${rowClass}`}
              style={{
                animation: `wa-slide-up ${spotlight ? "0.7s" : "0.35s"} cubic-bezier(0.2, 0, 0.1, 1)`,
              }}
            >
              <span
                className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${avatarClass}`}
                style={{ backgroundColor: resolveSenderColor(row.name, colors) }}
              >
                {row.name.slice(0, 1).toUpperCase()}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-3">
                  <span
                    className={`min-w-0 flex-1 truncate font-bold leading-tight ${nameClass}`}
                  >
                    {row.name}
                  </span>
                  <span
                    className={`shrink-0 ${timeClass} ${
                      row.unreadCount
                        ? "font-semibold text-[#1da851]"
                        : "text-[#667781]"
                    }`}
                  >
                    {row.time}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2.5">
                  {row.kind === "missed-call" ? (
                    <PhoneMissed
                      className={`shrink-0 text-[#f15c6d] ${
                        spotlight ? "h-16 w-16" : "h-6 w-6 md:h-8 md:w-8"
                      }`}
                      strokeWidth={2.5}
                    />
                  ) : row.kind === "ringing" ? (
                    <PhoneIncoming
                      className={`shrink-0 text-[#25d366] ${
                        spotlight ? "h-16 w-16" : "h-6 w-6 md:h-8 md:w-8"
                      }`}
                      strokeWidth={2.5}
                    />
                  ) : row.ticks !== "none" ? (
                    <Ticks status={row.ticks} sizeClass={tickClass} />
                  ) : null}

                  {row.kind === "ringing" ? (
                    <span className={`min-w-0 flex-1 truncate ${previewClass}`}>
                      <span className="font-bold text-[#25d366]">
                        {row.preview}
                      </span>
                      <span className="text-[#667781]"> • Ringing</span>
                    </span>
                  ) : (
                    <span
                      className={`min-w-0 flex-1 truncate ${previewClass} ${
                        row.unreadCount
                          ? "font-semibold text-[#111b21]"
                          : "text-[#667781]"
                      }`}
                    >
                      {row.preview}
                    </span>
                  )}
                  {row.unreadCount ? (
                    <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-[#25d366] px-2 text-[20px] font-bold text-white md:h-11 md:min-w-11 md:text-[24px]">
                      {row.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div
          className={`mx-auto mb-2 mt-2 w-full max-w-[820px] shrink-0 items-center justify-around rounded-full bg-[#f0f2f5] px-2 py-2.5 ${
            spotlight ? "hidden" : "flex"
          }`}
        >
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
function Ticks({
  status,
  sizeClass = "h-6 w-8 md:h-8 md:w-11",
}: {
  status: "sent" | "delivered" | "read";
  sizeClass?: string;
}) {
  return (
    <svg
      viewBox="0 0 18 12"
      className={`shrink-0 ${sizeClass} ${
        status === "read" ? "text-[#53bdeb]" : "text-[#8696a0]"
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
        active ? "bg-[#d9fdd3] text-[#1d7a4c]" : "bg-[#f0f2f5] text-[#54656f]"
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
        active ? "bg-white text-[#111b21] shadow-[0_1px_3px_rgba(11,20,26,0.12)]" : "text-[#54656f]"
      }`}
    >
      {icon}
      {badge ? (
        <span className="absolute -top-1 left-1/2 ml-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#25d366] px-1.5 text-[14px] font-bold text-white">
          {badge}
        </span>
      ) : null}
      <span className="text-[16px] font-medium">{label}</span>
    </div>
  );
}
