"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Share,
  Users,
  Video,
} from "lucide-react";
import type { GroupInfoEvent } from "@/types/scene";
import { buildSenderColors, resolveSenderColor } from "@/lib/sender-colors";

export type GroupInfoScreenProps = {
  events: GroupInfoEvent[];
  groupName?: string;
  memberCount?: number;
  autoStart?: boolean;
  /** Called once when all members have appeared. */
  onFinished?: () => void;
};

type Member = {
  name: string;
  status: string;
  isAdmin: boolean;
  isYou: boolean;
  highlight: boolean;
};

export default function GroupInfoScreen({
  events,
  groupName = "THE CREW 🔥",
  memberCount,
  autoStart = false,
  onFinished,
}: GroupInfoScreenProps) {
  const [members, setMembers] = useState<Member[]>([]);
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
      setMembers([]);

      for (const event of events) {
        if (cancelled) return;
        await wait(event.delay);
        if (cancelled) return;

        if (event.highlight) {
          const sound = (soundRef.current ??= new Audio("/notification.wav"));
          sound.currentTime = 0;
          void sound.play().catch(() => {});
        }

        setMembers((previous) => [
          ...previous,
          {
            name: event.name,
            status: event.status,
            isAdmin: event.isAdmin ?? false,
            isYou: event.isYou ?? false,
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

  const total = memberCount ?? events.length;
  const colors = buildSenderColors(events.map((event) => event.name));

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-black text-white md:flex-row">
      {/* Top bar (mobile) — floats over the header on tablet */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-3 md:w-[42%]">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <MoreHorizontal className="h-5 w-5" strokeWidth={2.5} />
        </span>
      </div>

      {/* LEFT: group identity + actions */}
      <div className="flex shrink-0 flex-col items-center px-6 pt-14 md:w-[42%] md:justify-center md:border-r md:border-white/10 md:pt-0">
        <span className="flex h-28 w-28 items-center justify-center rounded-full bg-[#0b3a5c] md:h-40 md:w-40">
          <Users
            className="h-14 w-14 text-[#4a9eff] md:h-20 md:w-20"
            fill="#4a9eff"
            strokeWidth={0}
          />
        </span>

        <h1 className="mt-5 text-center text-[42px] font-bold leading-tight md:text-[56px]">
          {groupName}
        </h1>
        <p className="mt-3 text-[26px] text-white/50">Group · {total} members</p>
        <p className="mt-3 text-[24px] font-medium text-[#25d366]">
          Add group description
        </p>

        <div className="mt-6 grid w-full max-w-[520px] grid-cols-4 gap-2.5">
          <ActionTile icon={<Phone className="h-8 w-8" strokeWidth={2} />} label="Audio" />
          <ActionTile icon={<Video className="h-8 w-8" strokeWidth={2} />} label="Video" />
          <ActionTile
            icon={<Share className="h-8 w-8" strokeWidth={2} />}
            label="Share"
            disabled
          />
          <ActionTile icon={<Search className="h-8 w-8" strokeWidth={2} />} label="Search" />
        </div>
      </div>

      {/* RIGHT: member list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4 md:px-6 md:pt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[36px] font-bold">{total} members</h2>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Search className="h-6 w-6" strokeWidth={2.5} />
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl bg-[#131313]">
          <div className="flex items-center gap-6 px-6 py-5">
            <span className="flex h-[86px] w-[86px] items-center justify-center rounded-full bg-white/10">
              <Plus className="h-10 w-10" strokeWidth={2.5} />
            </span>
            <span className="text-[34px] font-medium">Add members</span>
          </div>

          {members.map((member, index) => (
            <div
              key={`${member.name}-${index}`}
              className="flex items-center gap-6 border-t border-white/[0.07] px-6 py-5"
              style={{ animation: "wa-slide-up 0.35s ease-out" }}
            >
              <span
                className="flex h-[86px] w-[86px] shrink-0 items-center justify-center rounded-full text-[34px] font-bold text-white"
                style={{ backgroundColor: resolveSenderColor(member.name, colors) }}
              >
                {member.name.slice(0, 1).toUpperCase()}
              </span>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[44px] font-bold leading-tight">
                  {member.isYou ? "You" : member.name}
                </div>
                <div
                  className={`mt-1 truncate text-[32px] font-semibold ${
                    member.highlight ? "text-white/75" : "text-[#25d366]"
                  }`}
                >
                  {member.status}
                </div>
              </div>

              {member.isAdmin ? (
                <span className="shrink-0 text-[26px] font-medium text-white/45">
                  Admin
                </span>
              ) : null}
              <ChevronRight
                className="h-9 w-9 shrink-0 text-white/30"
                strokeWidth={2.5}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionTile({
  icon,
  label,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 rounded-xl bg-[#131313] py-4 ${
        disabled ? "text-white/30" : "text-[#25d366]"
      }`}
    >
      {icon}
      <span
        className={`text-[22px] font-semibold ${
          disabled ? "text-white/30" : "text-white"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
