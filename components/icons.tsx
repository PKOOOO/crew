"use client";

import type React from "react";

export function Avatar({
  name,
  color,
  size,
}: {
  name: string;
  color: string;
  size: number;
}) {
  const initials = name
    .split(" ")
    .filter((part) => /[a-zA-Z]/.test(part[0] ?? ""))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-medium text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.36,
      }}
    >
      {initials || <PersonIcon />}
    </span>
  );
}

/* -------------------------------- messages ------------------------------- */

/* ---------------------------------- icons -------------------------------- */

export function IconButton({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-14 w-14 items-center justify-center rounded-full text-[#54656f] hover:bg-black/5"
    >
      <span className="[&>svg]:h-8 [&>svg]:w-8">{children}</span>
    </button>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L21 21" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

export function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8" />
      <path d="M10 12h4" strokeLinecap="round" />
    </svg>
  );
}

export function AtIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-4 8" strokeLinecap="round" />
    </svg>
  );
}

export function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 6h10a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zm14 4.5l3.2-2.3a.6.6 0 011 .5v6.6a.6.6 0 01-1 .5L18 13.5z" />
    </svg>
  );
}

export function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011-.25c1.1.37 2.3.57 3.6.57a1 1 0 011 1V20a1 1 0 01-1 1C11.3 21 3 12.7 3 2.4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.3.2 2.5.57 3.6a1 1 0 01-.25 1z" />
    </svg>
  );
}

export function ChatBubbleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M21 11.5a8.5 8.5 0 01-12.3 7.6L3 21l1.9-5.6A8.5 8.5 0 1121 11.5z" strokeLinejoin="round" />
    </svg>
  );
}

export function StatusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
    </svg>
  );
}

export function ChannelsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12a3.5 3.5 0 017 0M6 12a6 6 0 0112 0" strokeLinecap="round" />
    </svg>
  );
}

export function CommunitiesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="9" cy="9" r="3" />
      <circle cx="16.5" cy="10" r="2.5" />
      <path d="M3.5 18a5.5 5.5 0 0111 0M15 15.5a4.5 4.5 0 015.5 2.5" strokeLinecap="round" />
    </svg>
  );
}

export function FlowerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3c1.7 1.4 2.6 3 2.6 5S13.7 11.6 12 13c-1.7-1.4-2.6-3-2.6-5S10.3 4.4 12 3z"
        fill="#e879a6"
      />
      <path
        d="M20.3 8.5c-.4 2.1-1.5 3.6-3.2 4.6s-3.5 1.2-5.1.5c.4-2.1 1.5-3.6 3.2-4.6s3.5-1.2 5.1-.5z"
        fill="#f5a623"
      />
      <path
        d="M18.4 18.6c-2-.8-3.2-2.1-3.8-4s-.3-3.6.7-5c2 .8 3.2 2.1 3.8 4s.3 3.6-.7 5z"
        fill="#6ec1e4"
      />
      <path
        d="M5.6 18.6c-1-1.4-1.3-3.1-.7-5s1.8-3.2 3.8-4c1 1.4 1.3 3.1.7 5s-1.8 3.2-3.8 4z"
        fill="#8b7fd6"
      />
      <path
        d="M3.7 8.5c1.6-.7 3.4-.5 5.1.5s2.8 2.5 3.2 4.6c-1.6.7-3.4.5-5.1-.5S4.1 10.6 3.7 8.5z"
        fill="#5ec39a"
      />
    </svg>
  );
}

export function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 16l5-5 4 4 3-3 6 6" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function EmojiIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M8.5 14.5a4.5 4.5 0 007 0" strokeLinecap="round" />
    </svg>
  );
}

export function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3z" />
      <path d="M18 12a6 6 0 01-12 0H4a8 8 0 007 7.9V22h2v-2.1A8 8 0 0020 12z" />
    </svg>
  );
}

export function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-1/2 w-1/2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0116 0z" />
    </svg>
  );
}

