"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatEvent, ChatListItem } from "@/types/chat";
import MessageBubble from "@/components/MessageBubble";
import TypingIndicator from "@/components/TypingIndicator";
import { resolveSenderColor } from "@/lib/sender-colors";
import {
  Avatar,
  EmojiIcon,
  IconButton,
  MenuIcon,
  MicIcon,
  PhoneIcon,
  PlusIcon,
  SearchIcon,
  VideoIcon,
} from "@/components/icons";

const DOODLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" viewBox="0 0 260 260"><g fill="none" stroke="#000" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.05"><circle cx="34" cy="30" r="11"/><path d="M28 30l4 4 7-8"/><path d="M96 22h30v20H112l-8 8v-8H96z"/><path d="M170 18c6-6 16-6 22 0s6 16 0 22l-11 11-11-11c-6-6-6-16 0-22z"/><path d="M226 26h20M226 34h14"/><path d="M20 90h26v18H32l-6 6v-6h-6z"/><circle cx="90" cy="98" r="13"/><path d="M90 90v8l6 4"/><path d="M144 86l10 20h-20z"/><path d="M150 112v10"/><path d="M196 84h34v24h-34z"/><path d="M196 92h34"/><path d="M40 160c8-8 20-8 28 0"/><path d="M46 168c5-5 11-5 16 0"/><circle cx="54" cy="176" r="2.5"/><path d="M104 154h26v26h-26z"/><path d="M110 168l6-7 5 6 5-5"/><path d="M176 150l6 14h14l-11 9 4 14-13-9-13 9 4-14-11-9h14z"/><path d="M230 156c0 10-8 18-18 18"/><path d="M24 216c10-10 26-10 36 0"/><path d="M112 208h24v16h-24z"/><path d="M120 208v-8h8v8"/><circle cx="182" cy="218" r="12"/><path d="M182 210v8h7"/><path d="M226 206l14 14M240 206l-14 14"/></g></svg>`;

const DOODLE_URL = `url("data:image/svg+xml,${encodeURIComponent(DOODLE_SVG)}")`;

/** How long the typing bubble shows right before a message lands. */
const PRE_MESSAGE_TYPING_MS = 1000;

/** Notification tone for incoming messages. */
const TONE_SRC = "/whatsapp.mp3";

export type VisibleMessage = {
  id: string;
  sender: string;
  text: string;
  image?: string;
  timestamp: string;
  isFirstInGroup: boolean;
  isDeleted: boolean;
};

export type ChatPanelProps = {
  chat: ChatListItem | undefined;
  script: ChatEvent[];
  /** Sender name → name-label color. Missing senders fall back to a hash. */
  senderColors?: Record<string, string>;
  /** Start playing as soon as the panel mounts (editor "Play" button). */
  autoStart?: boolean;
  onMessage?: (message: VisibleMessage) => void;
  /** Called once when the script has played to the end. */
  onFinished?: () => void;
};

function nowTime(): string {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPanel({
  chat,
  script,
  senderColors = {},
  autoStart = false,
  onMessage,
  onFinished,
}: ChatPanelProps) {
  const [visibleMessages, setVisibleMessages] = useState<VisibleMessage[]>([]);
  const [currentlyTyping, setCurrentlyTyping] = useState<string | null>(null);
  /** null = not started; a number identifies the current playback run. */
  const [runId, setRunId] = useState<number | null>(autoStart ? 1 : null);
  const [finished, setFinished] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const onMessageRef = useRef(onMessage);
  const onFinishedRef = useRef(onFinished);
  const toneRef = useRef<HTMLAudioElement | null>(null);

  /** Plays the incoming-message tone, restarting it if it's still playing. */
  const playTone = () => {
    if (typeof window === "undefined") return;
    const tone = (toneRef.current ??= new Audio(TONE_SRC));
    tone.currentTime = 0;
    // Rejects when the browser blocks autoplay — nothing to do about it.
    void tone.play().catch(() => {});
  };

  useEffect(() => {
    onMessageRef.current = onMessage;
    onFinishedRef.current = onFinished;
  }, [onMessage, onFinished]);

  /* --------------------------- playback engine --------------------------- */
  useEffect(() => {
    // Playback is explicit: nothing runs until "Start chat" / "Replay".
    if (runId === null) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    const play = async () => {
      // Every run starts from a clean slate at event index 0.
      setVisibleMessages([]);
      setCurrentlyTyping(null);
      setFinished(false);

      for (const event of script) {
        if (cancelled) return;

        if (event.type === "typing") {
          // Bait: show the indicator, then clear it without a message landing.
          setCurrentlyTyping(event.sender);
          await wait(event.duration);
          if (cancelled) return;
          setCurrentlyTyping(null);
          continue;
        }

        if (event.type === "message") {
          await wait(event.delay);
          if (cancelled) return;

          if (event.sender !== "me") {
            setCurrentlyTyping(event.sender);
            await wait(PRE_MESSAGE_TYPING_MS);
            if (cancelled) return;
            setCurrentlyTyping(null);
          }

          const message: VisibleMessage = {
            id: event.id,
            sender: event.sender,
            text: event.text,
            image: event.image,
            timestamp: nowTime(),
            // Computed once, at insert time, and never recomputed.
            isFirstInGroup: true,
            isDeleted: false,
          };

          if (event.sender !== "me") playTone();

          setVisibleMessages((previous) => {
            const last = previous[previous.length - 1];
            const landed: VisibleMessage = {
              ...message,
              isFirstInGroup: !last || last.sender !== message.sender,
            };
            onMessageRef.current?.(landed);
            return [...previous, landed];
          });
          continue;
        }

        await wait(event.delay);
        if (cancelled) return;
        setVisibleMessages((previous) =>
          previous.map((message) =>
            message.id === event.targetId
              ? { ...message, isDeleted: true }
              : message,
          ),
        );
      }

      if (!cancelled) {
        setFinished(true);
        onFinishedRef.current?.();
      }
    };

    void play();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [script, runId]);

  /* ----------------------------- auto-scroll ----------------------------- */
  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [visibleMessages, currentlyTyping]);

  const started = runId !== null;

  const startPlayback = () => {
    // Built on the click so the tone is preloaded and autoplay-unlocked.
    toneRef.current ??= new Audio(TONE_SRC);
    toneRef.current.load();
    setRunId((run) => (run ?? 0) + 1);
  };

  const typingIsFirstInGroup =
    !visibleMessages.length ||
    visibleMessages[visibleMessages.length - 1]?.sender !== currentlyTyping;

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col">
      {/* Header */}
      <header className="flex h-[59px] shrink-0 items-center gap-4 border-l border-[#d1d7db] bg-[#f0f2f5] px-4">
        <Avatar
          name={chat?.name ?? ""}
          color={chat?.avatarColor ?? "#7f9c93"}
          size={40}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[18px] font-semibold">{chat?.name}</div>
          {currentlyTyping ? (
            <div className="truncate text-[14px] text-[#00a884]">typing…</div>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {finished ? (
            <button
              type="button"
              onClick={startPlayback}
              className="mr-1 rounded-full border border-[#d1d7db] bg-white px-3 py-1 text-[13px] font-medium text-[#00a884] hover:bg-[#f0f2f5]"
            >
              Replay
            </button>
          ) : null}
          <IconButton label="Video call">
            <VideoIcon />
          </IconButton>
          <IconButton label="Voice call">
            <PhoneIcon />
          </IconButton>
          <IconButton label="Search">
            <SearchIcon />
          </IconButton>
          <IconButton label="Menu">
            <MenuIcon />
          </IconButton>
        </div>
      </header>

      {/* Body */}
      <div
        ref={bodyRef}
        className="min-h-0 flex-1 overflow-y-auto bg-[#efeae2] px-[6%] py-5"
        style={{ backgroundImage: DOODLE_URL, backgroundRepeat: "repeat" }}
      >
        {!started ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <button
              type="button"
              onClick={startPlayback}
              disabled={!script.length}
              className="rounded-full bg-[#00a884] px-8 py-3 text-[16px] font-semibold text-white shadow-[0_2px_8px_rgba(11,20,26,0.16)] hover:bg-[#029176] disabled:bg-[#8696a0]"
            >
              Start Chat
            </button>
            <span className="text-[13px] text-[#667781]">
              {script.length
                ? `${script.length} events queued`
                : "No script for this chat yet"}
            </span>
          </div>
        ) : null}

        <div className="flex flex-col">
          {visibleMessages.map((message) => (
            <MessageBubble
              key={message.id}
              sender={message.sender}
              text={message.text}
              image={message.image}
              timestamp={message.timestamp}
              isDeleted={message.isDeleted}
              isFirstInGroup={message.isFirstInGroup}
              senderName={chat?.isGroup ? message.sender : undefined}
              senderColor={resolveSenderColor(message.sender, senderColors)}
              status="read"
            />
          ))}

          {currentlyTyping ? (
            <TypingIndicator
              isFirstInGroup={typingIsFirstInGroup}
              senderName={chat?.isGroup ? currentlyTyping : undefined}
              senderColor={resolveSenderColor(currentlyTyping, senderColors)}
            />
          ) : null}
        </div>
      </div>

      {/* Input bar */}
      <div className="flex shrink-0 items-center gap-3 bg-[#f0f2f5] px-4 py-3">
        <IconButton label="Attach">
          <PlusIcon />
        </IconButton>
        <IconButton label="Emoji">
          <EmojiIcon />
        </IconButton>
        <div className="flex h-11 flex-1 items-center rounded-full bg-white px-4">
          <input
            type="text"
            placeholder="Type a message"
            className="h-full w-full bg-transparent text-[15px] outline-none placeholder:text-[#8696a0]"
          />
        </div>
        <IconButton label="Voice message">
          <MicIcon />
        </IconButton>
      </div>
    </section>
  );
}
