"use client";

import { Ban } from "lucide-react";
import VoiceNote from "@/components/VoiceNote";

export type MessageStatus = "sent" | "delivered" | "read";

export type MessageBubbleProps = {
  sender: "me" | string;
  text: string;
  /** Optional image attachment (path under /public). */
  image?: string;
  /** Rendered width of the image card in px. Defaults to 420. */
  imageWidth?: number;
  /** Intrinsic width ÷ height, so the box is right before the file loads. */
  imageAspect?: number;
  /** Voice note audio (path under /public); renders a voice-note bubble. */
  audio?: string;
  /** Play the voice note as it lands. */
  audioAutoPlay?: boolean;
  /** The curtain is shut: stop any audio in this bubble. */
  paused?: boolean;
  /** Marks this bubble in the DOM so a focus beat can find it. */
  domId?: string;
  /** Text sitting to the left of the timestamp, e.g. a last-seen line. */
  metaPrefix?: string;
  /** The prefix reserves its space from the start and fades in when true. */
  metaPrefixShown?: boolean;
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
  imageWidth = 420,
  imageAspect,
  audio,
  audioAutoPlay = false,
  paused = false,
  domId,
  metaPrefix,
  metaPrefixShown = false,
  timestamp,
  senderName,
  senderColor,
  isDeleted = false,
  isFirstInGroup,
  status = "read",
}: MessageBubbleProps) {
  const outgoing = sender === "me";
  const emojiOnly = !isDeleted && !image && !audio && isEmojiOnly(text);

  return (
    <div
      data-message-id={domId}
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

          {!isDeleted && audio ? (
            <VoiceNote
              src={audio}
              timestamp={timestamp}
              outgoing={outgoing}
              status={status}
              autoPlay={audioAutoPlay}
              paused={paused}
              senderColor={outgoing ? undefined : senderColor}
            />
          ) : !isDeleted && image ? (
            <div className="relative pb-1">
              {/* Width is set; height comes from the file's own proportions,
                  reserved up front by the measured aspect ratio so the bubble
                  never lands flat and then jump. next/image is no use here —
                  it wants both dimensions declared, and guessing a square for
                  an unknown photo is what cropped these in the first place. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt=""
                className="block rounded-md"
                style={{
                  width: imageWidth,
                  aspectRatio: imageAspect || undefined,
                  height: imageAspect ? undefined : "auto",
                }}
              />
              {text ? (
                <div className="relative mt-2" style={{ width: imageWidth }}>
                  <span className="block whitespace-pre-wrap break-words text-[44px] font-bold leading-[58px] text-[#111b21]">
                    {text}
                    <Meta
                      timestamp={timestamp}
                      outgoing={outgoing}
                      status={status}
                      variant="reserve"
                      prefix={metaPrefix}
                      prefixShown={metaPrefixShown}
                    />
                  </span>
                  <Meta
                    timestamp={timestamp}
                    outgoing={outgoing}
                    status={status}
                    variant="pinned"
                    prefix={metaPrefix}
                    prefixShown={metaPrefixShown}
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
            <span className="inline-flex items-center gap-4 text-[40px] font-medium italic text-[#8696a0]">
              <Ban className="h-11 w-11 shrink-0" strokeWidth={2} />
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
                  prefix={metaPrefix}
                  prefixShown={metaPrefixShown}
                />
              </span>
              <Meta
                timestamp={timestamp}
                outgoing={outgoing}
                status={status}
                variant="pinned"
                prefix={metaPrefix}
                prefixShown={metaPrefixShown}
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
  prefix,
  prefixShown = false,
}: {
  timestamp: string;
  outgoing: boolean;
  status: MessageStatus;
  variant: "pinned" | "reserve" | "trailing";
  /** Sits left of the timestamp; holds its space before it fades in. */
  prefix?: string;
  prefixShown?: boolean;
}) {
  const placement = {
    pinned: "absolute bottom-0 right-0",
    reserve: "invisible ml-4 inline-block h-[28px] align-bottom",
    trailing: "ml-4 inline-block h-[28px] translate-y-[6px] align-bottom",
  }[variant];

  // Once the focus beat lands, the line glows so the eye goes to it. A label
  // is optional — the time alone is enough to carry the beat.
  const breathing = variant === "pinned" && prefixShown;

  return (
    <span
      aria-hidden={variant === "reserve"}
      className={`select-none whitespace-nowrap text-[24px] font-semibold leading-[28px] text-[#667781] ${placement}`}
      style={
        breathing
          ? { animation: "wa-meta-glow 2.6s ease-in-out infinite" }
          : undefined
      }
    >
      {prefix ? (
        <span
          className="mr-4 transition-opacity duration-700 ease-out"
          style={{ opacity: prefixShown ? 1 : 0 }}
        >
          {prefix}
        </span>
      ) : null}
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
