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

/**
 * Global pace for chat playback. Every wait in the engine — scripted delays,
 * typing indicators, per-character typing — is multiplied by this, so the
 * whole conversation slows down without editing any scene. 1 = as scripted,
 * higher = slower.
 */
const PLAYBACK_PACE = 1.5;

/** How long the typing bubble shows right before a message lands. */
const PRE_MESSAGE_TYPING_MS = 1000;

/** Owner's own messages are typed into the input before being sent. */
const SELF_TYPE_MS_PER_CHAR = 55;
const SELF_SEND_PAUSE_MS = 500;

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
  /**
   * Whose phone this is. Messages from "me" or this name render outgoing
   * (right side), and their typing appears in the input box as a draft.
   */
  selfName?: string;
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
  selfName,
  onMessage,
  onFinished,
}: ChatPanelProps) {
  const [visibleMessages, setVisibleMessages] = useState<VisibleMessage[]>([]);
  const [currentlyTyping, setCurrentlyTyping] = useState<string | null>(null);
  /** What the phone's owner currently has typed in the input box. */
  const [draft, setDraft] = useState("");
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
        timer = setTimeout(resolve, ms * PLAYBACK_PACE);
      });

    const isSelf = (sender: string) =>
      sender === "me" || (!!selfName && sender === selfName);

    /** Types text into the input box one character at a time. */
    const typeDraft = async (text: string, perCharacter: number) => {
      let typed = "";
      for (const character of text) {
        await wait(perCharacter);
        if (cancelled) return false;
        typed += character;
        setDraft(typed);
      }
      return true;
    };

    /** Erases whatever is in the input box, one character at a time. */
    const eraseDraft = async (text: string, perCharacter: number) => {
      let typed = text;
      while (typed.length) {
        await wait(perCharacter);
        if (cancelled) return false;
        typed = typed.slice(0, -1);
        setDraft(typed);
      }
      return true;
    };

    const play = async () => {
      // Every run starts from a clean slate at event index 0.
      setVisibleMessages([]);
      setCurrentlyTyping(null);
      setDraft("");
      setFinished(false);

      for (const event of script) {
        if (cancelled) return;

        if (event.type === "typing") {
          // The phone's owner types into the input box, not a bubble.
          if (isSelf(event.sender)) {
            const text = event.draft ?? "";
            if (!text) {
              await wait(event.duration);
              continue;
            }
            // 55% typing, 20% hesitating, 25% erasing.
            if (!(await typeDraft(text, (event.duration * 0.55) / text.length)))
              return;
            await wait(event.duration * 0.2);
            if (cancelled) return;
            if (!event.keepDraft) {
              if (
                !(await eraseDraft(text, (event.duration * 0.25) / text.length))
              )
                return;
            }
            continue;
          }

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

          if (isSelf(event.sender)) {
            // Type it out in the input box, pause, then "send" it.
            if (event.text) {
              if (!(await typeDraft(event.text, SELF_TYPE_MS_PER_CHAR)))
                return;
              await wait(SELF_SEND_PAUSE_MS);
              if (cancelled) return;
            }
            setDraft("");
          } else {
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
            timestamp: event.time ?? nowTime(),
            // Computed once, at insert time, and never recomputed.
            isFirstInGroup: true,
            isDeleted: false,
          };

          if (!isSelf(event.sender)) playTone();

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
  }, [script, runId, selfName]);

  /* ----------------------------- auto-scroll ----------------------------- */
  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [visibleMessages, currentlyTyping]);

  const isSelfSender = (sender: string) =>
    sender === "me" || (!!selfName && sender === selfName);

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
      <header className="flex h-[100px] shrink-0 items-center gap-5 border-l border-[#d1d7db] bg-[#f0f2f5] px-6">
        <Avatar
          name={chat?.name ?? ""}
          color={chat?.avatarColor ?? "#7f9c93"}
          size={70}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[36px] font-bold">{chat?.name}</div>
          {currentlyTyping ? (
            <div className="truncate text-[24px] font-semibold text-[#00a884]">typing…</div>
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
              sender={isSelfSender(message.sender) ? "me" : message.sender}
              text={message.text}
              image={message.image}
              timestamp={message.timestamp}
              isDeleted={message.isDeleted}
              isFirstInGroup={message.isFirstInGroup}
              senderName={
                chat?.isGroup && !isSelfSender(message.sender)
                  ? message.sender
                  : undefined
              }
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
        <div className="flex min-h-20 flex-1 items-center rounded-full bg-white px-7 py-4">
          {draft ? (
            <span className="whitespace-pre-wrap break-words text-[36px] font-semibold leading-[48px] text-[#111b21]">
              {draft}
              <span
                aria-hidden
                className="ml-[3px] inline-block h-[38px] w-[4px] translate-y-[7px] bg-[#00a884]"
                style={{ animation: "wa-caret-blink 1.1s step-end infinite" }}
              />
            </span>
          ) : (
            <span className="text-[36px] text-[#8696a0]">Type a message</span>
          )}
        </div>
        <IconButton label={draft ? "Send" : "Voice message"}>
          {draft ? <SendIcon /> : <MicIcon />}
        </IconButton>
      </div>
    </section>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="text-[#00a884]">
      <path d="M2.5 20.5l19-8.5-19-8.5v6.6l13 1.9-13 1.9z" />
    </svg>
  );
}
