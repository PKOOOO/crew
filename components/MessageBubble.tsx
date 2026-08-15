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
      style={{ marginTop: isFirstInGroup ? 20 : 6 }}
    >
      <div
        className={`relative max-w-[min(72%,900px)] ${
          emojiOnly
            ? ""
            : `rounded-2xl shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
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

        <div className={emojiOnly ? "" : "px-6 py-4"}>
          {senderName && isFirstInGroup && !outgoing ? (
            <div
              className="text-[32px] font-bold leading-tight"
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
                width={420}
                height={420}
                unoptimized
                className="h-auto w-[420px] rounded-md object-cover"
              />
              {text ? (
                <div className="relative mt-2">
                  <span className="block whitespace-pre-wrap break-words text-[44px] font-bold leading-[58px] text-[#111b21]">
                    {text}
                    <Meta
                      timestamp={timestamp}
                      outgoing={outgoing}
                      status={status}
                      variant="reserve"
                    />
                  </span>
                  <Meta
                    timestamp={timestamp}
                    outgoing={outgoing}
                    status={status}
                    variant="pinned"
                  />
                </div>
              ) : (
                <span className="absolute bottom-3 right-3 flex items-center rounded bg-black/45 px-2.5 py-1 text-[24px] font-semibold leading-[28px] text-white [&_svg]:text-white">
                  {timestamp}
                  {outgoing ? <Ticks status={status} /> : null}
                </span>
              )}
            </div>
          ) : isDeleted ? (
            <span className="inline-flex items-center gap-3 text-[36px] font-bold italic text-[#8696a0]">
              <Ban className="h-9 w-9 shrink-0" strokeWidth={2} />
              This message was deleted
              <Meta
                timestamp={timestamp}
                outgoing={outgoing}
                status={status}
                variant="trailing"
              />
            </span>
          ) : emojiOnly ? (
            <span className="inline-block text-[7rem] leading-tight">
              {text}
              <Meta
                timestamp={timestamp}
                outgoing={outgoing}
                status={status}
                variant="trailing"
              />
            </span>
          ) : (
            <div className="relative">
              <span className="block whitespace-pre-wrap break-words text-[44px] font-bold leading-[58px] text-[#111b21]">
                {text}
                <Meta
                  timestamp={timestamp}
                  outgoing={outgoing}
                  status={status}
                  variant="reserve"
                />
              </span>
              <Meta
                timestamp={timestamp}
                outgoing={outgoing}
                status={status}
                variant="pinned"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Timestamp + ticks.
 *
 * "pinned" sits in the bottom-right corner of the message body; "reserve" is an
 * invisible copy riding at the end of the text so the last line keeps room for
 * it and the two never collide — the trick WhatsApp itself uses. A float can't
 * do this: floats add no height to their parent, so one that didn't fit on the
 * last line spilled out under the bubble. "trailing" just follows the text, for
 * bodies that aren't plain wrapped paragraphs.
 */
function Meta({
  timestamp,
  outgoing,
  status,
  variant,
}: {
  timestamp: string;
  outgoing: boolean;
  status: MessageStatus;
  variant: "pinned" | "reserve" | "trailing";
}) {
  const placement = {
    pinned: "absolute bottom-0 right-0",
    reserve: "invisible ml-4 inline-block h-[28px] align-bottom",
    trailing: "ml-4 inline-block h-[28px] translate-y-[6px] align-bottom",
  }[variant];

  return (
    <span
      aria-hidden={variant === "reserve"}
      className={`select-none whitespace-nowrap text-[24px] font-semibold leading-[28px] text-[#667781] ${placement}`}
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
      className={`ml-2 inline-block h-[28px] w-8 align-[-5px] ${
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
      className={`absolute top-0 h-[28px] w-[18px] ${
        outgoing ? "right-[-18px] text-[#d9fdd3]" : "left-[-18px] text-white"
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
