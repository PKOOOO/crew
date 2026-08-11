"use client";

import Image from "next/image";
import { Ban } from "lucide-react";

export type MessageStatus = "sent" | "delivered" | "read";

export type MessageBubbleProps = {
  sender: "me" | string;
  text: string;
  /** Optional image attachment (path under /public). */
  image?: string;
  timestamp: string;
  senderName?: string;
  senderColor?: string;
  isDeleted?: boolean;
  isFirstInGroup: boolean;
  status?: MessageStatus;
};

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|️|‍|\s)+$/u;

function isEmojiOnly(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && EMOJI_ONLY.test(trimmed);
}

export default function MessageBubble({
  sender,
  text,
  image,
  timestamp,
  senderName,
  senderColor,
  isDeleted = false,
  isFirstInGroup,
  status = "read",
}: MessageBubbleProps) {
  const outgoing = sender === "me";
  const emojiOnly = !isDeleted && !image && isEmojiOnly(text);

  return (
    <div
      className={`flex ${outgoing ? "justify-end" : "justify-start"}`}
      style={{ marginTop: isFirstInGroup ? 8 : 2 }}
    >
      <div
        className={`relative max-w-[min(65%,620px)] ${
          emojiOnly
            ? ""
            : `rounded-lg shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
                outgoing ? "bg-[#d9fdd3]" : "bg-white"
              } ${
                isFirstInGroup
                  ? outgoing
                    ? "rounded-tr-none"
                    : "rounded-tl-none"
                  : ""
              }`
        }`}
      >
        {/* Tail: only on the first bubble of a group */}
        {!emojiOnly && isFirstInGroup ? <Tail outgoing={outgoing} /> : null}

        <div className={emojiOnly ? "" : "px-2.5 py-1.5"}>
          {senderName && isFirstInGroup && !outgoing ? (
            <div
              className="text-[15px] font-bold leading-tight"
              style={{ color: senderColor ?? "#00a884" }}
            >
              {senderName}
            </div>
          ) : null}

          {!isDeleted && image ? (
            <div className="relative pb-1">
              <Image
                src={image}
                alt=""
                width={340}
                height={340}
                unoptimized
                className="h-auto w-[340px] rounded-md object-cover"
              />
              {text ? (
                <span className="mt-1 block whitespace-pre-wrap break-words text-[17px] font-medium leading-[24px] text-[#111b21]">
                  {text}
                  <Meta
                    timestamp={timestamp}
                    outgoing={outgoing}
                    status={status}
                    inline
                  />
                </span>
              ) : (
                <span className="absolute bottom-2 right-1.5 flex items-center rounded bg-black/40 px-1.5 py-0.5 text-[12px] leading-[15px] text-white [&_svg]:text-white">
                  {timestamp}
                  {outgoing ? <Ticks status={status} /> : null}
                </span>
              )}
            </div>
          ) : isDeleted ? (
            <span className="inline-flex items-center gap-1.5 text-[16px] font-medium italic text-[#8696a0]">
              <Ban className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              This message was deleted
              <Meta
                timestamp={timestamp}
                outgoing={outgoing}
                status={status}
                inline={false}
              />
            </span>
          ) : emojiOnly ? (
            <span className="inline-block text-[3rem] leading-tight">
              {text}
              <Meta
                timestamp={timestamp}
                outgoing={outgoing}
                status={status}
                inline={false}
              />
            </span>
          ) : (
            <span className="whitespace-pre-wrap break-words text-[17px] font-medium leading-[24px] text-[#111b21]">
              {text}
              <Meta
                timestamp={timestamp}
                outgoing={outgoing}
                status={status}
                inline
              />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Timestamp + ticks. Trails the last words of the message as an inline-block so
 * the text wraps around it, exactly like WhatsApp.
 */
function Meta({
  timestamp,
  outgoing,
  status,
  inline,
}: {
  timestamp: string;
  outgoing: boolean;
  status: MessageStatus;
  inline: boolean;
}) {
  return (
    <span
      className={`ml-2 inline-block h-[15px] translate-y-[3px] select-none whitespace-nowrap align-bottom text-[12px] leading-[15px] text-[#667781] ${
        inline ? "float-right" : ""
      }`}
    >
      {timestamp}
      {outgoing ? <Ticks status={status} /> : null}
    </span>
  );
}

function Ticks({ status }: { status: MessageStatus }) {
  const blue = status === "read";
  return (
    <svg
      viewBox="0 0 18 12"
      className={`ml-1 inline-block h-[15px] w-4 align-[-3px] ${
        blue ? "text-[#53bdeb]" : "text-[#8696a0]"
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 6.5l3.2 3.2L10.5 2.5" />
      {status === "sent" ? null : <path d="M6.5 9.7L12.8 2.5" />}
    </svg>
  );
}

export function Tail({ outgoing }: { outgoing: boolean }) {
  return (
    <svg
      viewBox="0 0 8 13"
      className={`absolute top-0 h-[13px] w-2 ${
        outgoing ? "right-[-8px] text-[#d9fdd3]" : "left-[-8px] text-white"
      }`}
      aria-hidden
    >
      <path
        d={outgoing ? "M0 0h8L0 13z" : "M8 0H0l8 13z"}
        fill="currentColor"
      />
    </svg>
  );
}
