"use client";

import Image from "next/image";

export type ChatListItemProps = {
  name: string;
  avatarColor: string;
  /** Photo shown instead of initials — the group's picture. */
  avatarImage?: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  isGroup?: boolean;
  active?: boolean;
  onSelect?: () => void;
};

export default function ChatListItem({
  name,
  avatarColor,
  avatarImage,
  lastMessage,
  time,
  unreadCount,
  isGroup = false,
  active = false,
  onSelect,
}: ChatListItemProps) {
  const hasUnread = typeof unreadCount === "number" && unreadCount > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-[72px] w-full items-center gap-3 pl-3 text-left ${
        active ? "bg-[#f0f2f5]" : "bg-transparent hover:bg-[#f5f6f6]"
      }`}
    >
      <Avatar
        name={name}
        color={avatarColor}
        isGroup={isGroup}
        image={avatarImage}
      />

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 border-b border-[#f0f2f5] py-3 pr-3">
        <div className="flex items-baseline gap-2">
          <span
            className={`min-w-0 flex-1 truncate text-[17px] leading-tight ${
              hasUnread ? "font-medium text-[#111b21]" : "text-[#111b21]"
            }`}
          >
            {name}
          </span>
          <span
            className={`shrink-0 text-[12px] leading-tight ${
              hasUnread ? "font-medium text-[#00a884]" : "text-[#667781]"
            }`}
          >
            {time}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[14px] text-[#667781]">
            {lastMessage}
          </span>
          {hasUnread ? (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#00a884] px-1.5 text-[12px] font-bold leading-none text-white">
              {unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function Avatar({
  name,
  color,
  isGroup,
  image,
}: {
  name: string;
  color: string;
  isGroup: boolean;
  image?: string;
}) {
  const initials = name
    .split(" ")
    .filter((part) => /[a-zA-Z]/.test(part[0] ?? ""))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={49}
        height={49}
        unoptimized
        className="h-[49px] w-[49px] shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      className="flex h-[49px] w-[49px] shrink-0 items-center justify-center rounded-full text-[17px] font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {isGroup ? (
        <GroupIcon />
      ) : initials ? (
        initials
      ) : (
        <PersonIcon />
      )}
    </span>
  );
}

function GroupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <circle cx="8.5" cy="9" r="3" />
      <circle cx="16" cy="10" r="2.5" />
      <path d="M2.5 18.5a6 6 0 0112 0zM14.6 14.2a4.9 4.9 0 016.9 4.3h-5.3a7.4 7.4 0 00-1.6-4.3z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0116 0z" />
    </svg>
  );
}
