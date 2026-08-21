"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { ChatEvent, ChatListItem } from "@/types/chat";
import type { FocusBeat, InspectBeat } from "@/types/scene";
import {
  MENU_HEIGHT,
  MENU_PAD_Y,
  MENU_ROW_HEIGHT,
  MENU_WIDTH,
  MessageInfoScreen,
  MessageMenu,
  Pointer,
} from "@/components/MessageInspect";
import MessageBubble from "@/components/MessageBubble";
import TypingIndicator from "@/components/TypingIndicator";
import { resolveSenderColor } from "@/lib/sender-colors";
import {
  createKeyClick,
  type KeyClick,
  type KeyClickVariant,
} from "@/lib/key-click";
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
/** Send-woosh for the phone owner's own outgoing messages. */
const SENT_TONE_SRC = "/sent.mp3";

/**
 * The panel's own transition duration, in ms. Keep in sync with the
 * `duration-[2600ms]` class on the section — the engine waits this long for
 * a push-in to settle before letting anything else happen.
 */
const PANEL_EASE_MS = 2600;

/*
 * The inspect beat: how long the pointer takes to walk to the message, to the
 * menu row, and how long it rests either side of a press.
 */
const POINTER_TO_MESSAGE_MS = 600;
const POINTER_TO_ROW_MS = 360;
const POINTER_SETTLE_MS = 110;
const PRESS_MS = 110;
/**
 * The first press is a *hold*, not a click — that is how the menu is opened
 * on a real phone, and a hold makes no sound. Only choosing a row from the
 * menu clicks, so the beat lands one click rather than two in quick
 * succession, which the ear hears as a double.
 */
const HOLD_MS = 460;
/** Beat between the menu opening and the pointer setting off for its row. */
const MENU_OPEN_MS = 150;
/**
 * The message column's own transition. Keep in sync with the
 * `duration-[1600ms]` class on the column wrapper — nothing can be measured
 * against the bubble until the push-in has stopped moving it.
 */
const COLUMN_EASE_MS = 1600;

/** How far in the view moves on a `zoom` draft, and the gap left at its left. */
const DRAFT_ZOOM_SCALE = 1.9;
const DRAFT_ZOOM_MARGIN = 110;

/** Breath between a voice note finishing and the next message starting. */
const VOICE_TAIL_MS = 700;
/** Assumed length when a voice note's metadata never arrives. */
const VOICE_FALLBACK_MS = 5000;

/**
 * How long a voice note runs, read from the file's own metadata so the script
 * never has to hardcode a duration. Falls back to a fixed guess rather than
 * hanging or returning zero — a show must not stall on a slow byte.
 */
function voiceLengthMs(src: string): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(VOICE_FALLBACK_MS);
      return;
    }

    const probe = new Audio(src);
    probe.preload = "metadata";

    let settled = false;
    const finish = (ms: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(guard);
      resolve(ms);
    };
    const guard = setTimeout(() => finish(VOICE_FALLBACK_MS), 4000);

    probe.addEventListener(
      "loadedmetadata",
      () =>
        finish(
          Number.isFinite(probe.duration)
            ? probe.duration * 1000
            : VOICE_FALLBACK_MS,
        ),
      { once: true },
    );
    probe.addEventListener("error", () => finish(VOICE_FALLBACK_MS), {
      once: true,
    });
  });
}

/**
 * Intrinsic width ÷ height of an attachment, cached per src.
 *
 * Without this the bubble has no idea how tall a picture will be until the
 * bytes arrive: it lands flat, the chat auto-scrolls against that wrong
 * height, and the image looks cut off until the next message shoves the view
 * back down. Probing up front both reserves the right box and warms the
 * browser cache, so the picture is there the moment the bubble is.
 */
const aspectCache = new Map<string, Promise<number>>();

function imageAspect(src: string): Promise<number> {
  const cached = aspectCache.get(src);
  if (cached) return cached;

  const probe = new Promise<number>((resolve) => {
    if (typeof window === "undefined") {
      resolve(0);
      return;
    }

    const picture = new window.Image();
    let settled = false;
    const finish = (ratio: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(guard);
      resolve(ratio);
    };
    // Falling back to 0 means "size it however it loads" — the old behaviour,
    // never a wrong box.
    const guard = setTimeout(() => finish(0), 4000);

    picture.onload = () =>
      finish(
        picture.naturalHeight > 0
          ? picture.naturalWidth / picture.naturalHeight
          : 0,
      );
    picture.onerror = () => finish(0);
    picture.src = src;
  });

  aspectCache.set(src, probe);
  return probe;
}

export type VisibleMessage = {
  id: string;
  sender: string;
  text: string;
  image?: string;
  imageWidth?: number;
  /** Fill the chat area: full width, no bubble padding. */
  imageFull?: boolean;
  /** Intrinsic aspect ratio, so the bubble reserves the right height. */
  imageAspect?: number;
  audio?: string;
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
  /**
   * Flashback: render the entire conversation the moment the scene opens.
   * Delays, typing indicators and tones are all skipped.
   */
  instant?: boolean;
  /** Line under the chat name in the header, e.g. a member's last-seen. */
  headerStatus?: string;
  /**
   * Halt playback where it stands. Unlike autoStart this is read continuously,
   * so the curtain closing stops a chat that is already running.
   */
  paused?: boolean;
  /**
   * Scales the message column — bubbles, text, padding and all — as one. 1 is
   * the standard size.
   */
  textScale?: number;
  /**
   * A timestamp shown at the end of the draft in the message box, e.g.
   * "11:43 PM". Nothing is sent in these scenes, so this is the only place
   * the hour can appear — and a focus beat closes in on it.
   */
  composerTime?: string;
  /** Key clicks as the owner types. On unless a scene turns them off. */
  keySound?: boolean;
  /** Push in on one message once the scene has settled. */
  focus?: FocusBeat;
  /**
   * After that push-in, an oversized pointer walks to the message, holds it,
   * and opens Message info.
   */
  inspect?: InspectBeat;
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

/**
 * Folds a whole script down to the conversation it ends up as: every message
 * landed, deletions applied, typing thrown away. What a flashback shows.
 */
function settleScript(script: ChatEvent[]): VisibleMessage[] {
  const settled: VisibleMessage[] = [];

  for (const event of script) {
    if (event.type === "typing") continue;

    if (event.type === "message") {
      const last = settled[settled.length - 1];
      settled.push({
        id: event.id,
        sender: event.sender,
        text: event.text,
        image: event.image,
        imageWidth: event.imageWidth,
        imageFull: event.imageFull,
        audio: event.audio,
        timestamp: event.time ?? nowTime(),
        isFirstInGroup: !last || last.sender !== event.sender,
        isDeleted: false,
      });
      continue;
    }

    const target = settled.find((message) => message.id === event.targetId);
    if (target) target.isDeleted = true;
  }

  return settled;
}

export default function ChatPanel({
  chat,
  script,
  senderColors = {},
  autoStart = false,
  selfName,
  instant = false,
  headerStatus,
  paused = false,
  textScale = 1,
  composerTime,
  keySound = true,
  focus,
  inspect,
  onMessage,
  onFinished,
}: ChatPanelProps) {
  const [visibleMessages, setVisibleMessages] = useState<VisibleMessage[]>([]);
  const [currentlyTyping, setCurrentlyTyping] = useState<string | null>(null);
  /** The indicator on screen is a held mic, not typing dots. */
  const [typingIsVoice, setTypingIsVoice] = useState(false);
  /** What the phone's owner currently has typed in the input box. */
  const [draft, setDraft] = useState("");
  /**
   * She has written the whole thing and stopped. Not the same as the script
   * being over — what happens after she stops is the point of these scenes.
   */
  const [draftComplete, setDraftComplete] = useState(false);
  /**
   * How tall the chat area is, in the column's own units. A full-bleed photo
   * is sized against this: at full width it is taller than the screen, and
   * the auto-scroll to the bottom would take the top off it.
   */
  const [chatHeight, setChatHeight] = useState(0);
  /** null = not started; a number identifies the current playback run. */
  const [runId, setRunId] = useState<number | null>(autoStart ? 1 : null);
  const [finished, setFinished] = useState(false);
  /** The focus beat's transform, fitting one bubble to the screen. */
  const [focusTransform, setFocusTransform] = useState<string | null>(null);
  /**
   * A push-in on the message box. Moves the whole panel, not just the column,
   * and the playback engine drives it too — so it lives up here with the rest
   * of the run's state.
   */
  const [panelTransform, setPanelTransform] = useState<string | null>(null);
  /** The composer's timestamp is the subject of the beat: make it glow. */
  const [composerTimeLit, setComposerTimeLit] = useState(false);
  /** Where the oversized pointer is, and what it is doing. */
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [pointerTravelMs, setPointerTravelMs] = useState(POINTER_TO_MESSAGE_MS);
  const [pressing, setPressing] = useState(false);
  const [menuAt, setMenuAt] = useState<{ x: number; y: number } | null>(null);
  const [menuLit, setMenuLit] = useState(false);
  const [infoShown, setInfoShown] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const inputBarRef = useRef<HTMLDivElement>(null);
  const inputFieldRef = useRef<HTMLDivElement>(null);
  const composerTimeRef = useRef<HTMLSpanElement>(null);
  const onMessageRef = useRef(onMessage);
  const onFinishedRef = useRef(onFinished);
  const toneRef = useRef<HTMLAudioElement | null>(null);
  const sentToneRef = useRef<HTMLAudioElement | null>(null);
  const keyClickRef = useRef<KeyClick | null>(null);

  /**
   * The transform that closes the view in on the message box. The whole panel
   * moves, so it reads as a camera pushing in on the phone rather than one
   * element growing. Anchors on where the text starts, not the middle of a
   * full-width bar — centring that would push the words off the left edge.
   * Only valid to call while the panel is untransformed.
   */
  const composerPushIn = useCallback((scale: number, margin: number) => {
    const panel = panelRef.current;
    const bar = inputBarRef.current;
    const field = inputFieldRef.current;
    if (!panel || !bar || !field) return null;

    const view = panel.getBoundingClientRect();
    const barBox = bar.getBoundingClientRect();
    const fieldBox = field.getBoundingClientRect();

    const startX = fieldBox.left - view.left;
    const middleY = barBox.top + barBox.height / 2 - view.top;

    return `translate(${margin - scale * startX}px, ${
      view.height / 2 - scale * middleY
    }px) scale(${scale})`;
  }, []);

  /**
   * The transform that puts one element in the middle of the panel at the
   * given scale.
   *
   * Measured from layout offsets rather than getBoundingClientRect, because
   * this move is applied while the panel is already pushed in: a screen rect
   * would be reading the panel's own transform back and compounding it.
   * Offsets ignore transforms entirely, so the answer is the same whether the
   * view has moved yet or not.
   */
  const centreOn = useCallback((target: HTMLElement | null, scale: number) => {
    const panel = panelRef.current;
    if (!panel || !target) return null;
    if (!target.offsetWidth || !target.offsetHeight) return null;

    const walk = (node: HTMLElement | null) => {
      let x = 0;
      let y = 0;
      while (node) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      return { x, y };
    };

    const here = walk(target);
    const root = walk(panel);
    const centreX = here.x - root.x + target.offsetWidth / 2;
    const centreY = here.y - root.y + target.offsetHeight / 2;

    return `translate(${panel.offsetWidth / 2 - scale * centreX}px, ${
      panel.offsetHeight / 2 - scale * centreY
    }px) scale(${scale})`;
  }, []);

  /** Plays a tone from the given ref/src pair, restarting it if still playing. */
  const playFrom = useCallback(
    (ref: RefObject<HTMLAudioElement | null>, src: string) => {
      if (typeof window === "undefined") return null;
      const tone = (ref.current ??= new Audio(src));
      tone.currentTime = 0;
      // Rejects when the browser blocks autoplay — nothing to do about it.
      void tone.play().catch(() => {});
      // Handed back so a caller can stop exactly the sound it started.
      return tone;
    },
    [],
  );

  /** Incoming-message tone. */
  const playTone = useCallback(
    () => playFrom(toneRef, TONE_SRC),
    [playFrom],
  );
  /** Outgoing-message woosh, for the phone owner's own sent messages. */
  const playSentTone = useCallback(
    () => playFrom(sentToneRef, SENT_TONE_SRC),
    [playFrom],
  );

  /** One keystroke, synthesized fresh so a fast run never sounds looped. */
  const playKeyTick = useCallback((variant?: KeyClickVariant) => {
    if (typeof window === "undefined") return;
    (keyClickRef.current ??= createKeyClick())(variant);
  }, []);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onFinishedRef.current = onFinished;
  }, [onMessage, onFinished]);

  /* --------------------------- playback engine --------------------------- */
  useEffect(() => {
    // Playback is explicit: nothing runs until "Start chat" / "Replay".
    if (runId === null) return;

    // A flashback is already on screen — there is nothing to play out.
    if (instant) return;

    // Stopped dead by the curtain. The cleanup below has already cancelled
    // whatever was in flight when this flipped.
    if (paused) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Scripted beats stretch with the global pace; real-time waits (a voice
    // note actually playing) must not.
    const wait = (ms: number, paced = true) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, paced ? ms * PLAYBACK_PACE : ms);
      });

    const isSelf = (sender: string) =>
      sender === "me" || (!!selfName && sender === selfName);

    /** Types text into the input box one character at a time, key by key. */
    const typeDraft = async (text: string, perCharacter: number) => {
      let typed = "";
      for (const character of text) {
        await wait(perCharacter);
        if (cancelled) return false;
        typed += character;
        setDraft(typed);
        if (keySound) playKeyTick();
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

    // Measure and cache every attachment before a word is said, so no bubble
    // ever lands at the wrong height.
    for (const event of script) {
      if (event.type === "message" && event.image) void imageAspect(event.image);
    }

    const play = async () => {
      // Every run starts from a clean slate at event index 0.
      setVisibleMessages([]);
      setCurrentlyTyping(null);
      setTypingIsVoice(false);
      setDraft("");
      setDraftComplete(false);
      setFinished(false);
      setPanelTransform(null);
      setComposerTimeLit(false);
      setPointer(null);
      setPressing(false);
      setMenuAt(null);
      setMenuLit(false);
      setInfoShown(false);

      // True while the view is held in on the message box by a `zoom` draft.
      let pushedIn = false;
      /** Eases the view back out and waits for the move to land. */
      const pullOut = async () => {
        if (!pushedIn) return true;
        pushedIn = false;
        setPanelTransform(null);
        await wait(PANEL_EASE_MS, false);
        return !cancelled;
      };

      for (const event of script) {
        if (cancelled) return;

        if (event.type === "typing") {
          // Close in before a word is written, and let the move settle so the
          // room isn't reading a target that is still moving. A run of zoomed
          // drafts shares the one push-in; anything else lets the view go.
          if (event.zoom && isSelf(event.sender)) {
            if (!pushedIn) {
              pushedIn = true;
              setPanelTransform(
                composerPushIn(DRAFT_ZOOM_SCALE, DRAFT_ZOOM_MARGIN),
              );
              await wait(PANEL_EASE_MS, false);
              if (cancelled) return;
            }
          } else if (!(await pullOut())) {
            return;
          }

          // The phone's owner types into the input box, not a bubble.
          if (isSelf(event.sender)) {
            const text = event.draft ?? "";

            // Taking it back: nothing is typed, what is there just goes — and
            // the view lets go with her. The pull-out starts on the first
            // letter to disappear, so the room is drawn back out of the
            // close-up as the message unwrites itself.
            if (event.erase) {
              setPanelTransform(null);
              setComposerTimeLit(false);
              if (
                text &&
                !(await eraseDraft(text, event.duration / text.length))
              )
                return;
              continue;
            }

            if (!text) {
              await wait(event.duration);
              continue;
            }
            // 55% typing, 20% hesitating, 25% erasing.
            if (!(await typeDraft(text, (event.duration * 0.55) / text.length)))
              return;
            setDraftComplete(true);
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

          // Typing dots, or a pulsing mic when they are holding to record.
          setCurrentlyTyping(event.sender);
          setTypingIsVoice(event.voice === true);
          await wait(event.duration);
          if (cancelled) return;
          setCurrentlyTyping(null);
          setTypingIsVoice(false);
          continue;
        }

        if (event.type === "message") {
          // Carried over from an earlier scene: it is simply already there.
          const settled = event.settled === true;

          if (!settled) {
            await wait(event.delay);
            if (cancelled) return;
          }

          if (settled) {
            // nothing to act out
          } else if (isSelf(event.sender)) {
            // Type it out in the input box, pause, then "send" it.
            if (event.text) {
              if (!(await typeDraft(event.text, SELF_TYPE_MS_PER_CHAR)))
                return;
              await wait(SELF_SEND_PAUSE_MS);
              if (cancelled) return;
            }
            setDraft("");
          } else if (!event.audio) {
            // A voice note has already had its own recording indicator — it
            // doesn't get typing dots on top.
            setCurrentlyTyping(event.sender);
            await wait(PRE_MESSAGE_TYPING_MS);
            if (cancelled) return;
            setCurrentlyTyping(null);
          }

          // Resolves from the cache warmed above, so this doesn't stall.
          const aspect = event.image ? await imageAspect(event.image) : 0;
          if (cancelled) return;

          const message: VisibleMessage = {
            id: event.id,
            sender: event.sender,
            text: event.text,
            image: event.image,
            imageWidth: event.imageWidth,
            imageFull: event.imageFull,
            imageAspect: aspect || undefined,
            audio: event.audio,
            timestamp: event.time ?? nowTime(),
            // Computed once, at insert time, and never recomputed.
            isFirstInGroup: true,
            isDeleted: false,
          };

          // A voice note announces itself by playing — no tone over the top,
          // and a message that was already there never made a sound now.
          if (!event.audio && !settled) {
            if (isSelf(event.sender)) playSentTone();
            else playTone();
          }

          setVisibleMessages((previous) => {
            const last = previous[previous.length - 1];
            const landed: VisibleMessage = {
              ...message,
              isFirstInGroup: !last || last.sender !== message.sender,
            };
            onMessageRef.current?.(landed);
            return [...previous, landed];
          });

          // She has sent it. Ease back out, so the pull-out is what reveals
          // where the words landed.
          if (!(await pullOut())) return;

          // A voice note plays as it lands: hold the script until it has
          // finished, so nobody starts typing over the top of it.
          if (event.audio) {
            const length = await voiceLengthMs(event.audio);
            if (cancelled) return;
            await wait(length + VOICE_TAIL_MS, false);
            if (cancelled) return;
          }
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
      // Stopping the chat stops its tones mid-ring too.
      toneRef.current?.pause();
      sentToneRef.current?.pause();
    };
  }, [
    script,
    runId,
    selfName,
    instant,
    paused,
    playTone,
    playSentTone,
    playKeyTick,
    keySound,
    composerPushIn,
  ]);

  /* ------------------------------ flashback ------------------------------ */
  // Derived, not played: the settled conversation is what a flashback renders.
  const flashback = useMemo(
    () => (instant ? settleScript(script) : null),
    [instant, script],
  );
  const shownMessages = flashback ?? visibleMessages;

  // It is on screen the moment the scene opens, so it is immediately done.
  useEffect(() => {
    if (!flashback || runId === null) return;
    for (const message of flashback) onMessageRef.current?.(message);
    onFinishedRef.current?.();
  }, [flashback, runId]);

  /* ------------------------------ focus beat ----------------------------- */
  // Read-through: crawl the conversation from the top at a constant rate, so
  // the room gets to every message before the view closes in on one of them.
  useEffect(() => {
    const readMs = focus?.scrollMs;
    if (!readMs || runId === null || paused) return;

    const body = bodyRef.current;
    if (!body) return;

    body.scrollTop = 0;
    let frame = 0;
    let begin: ReturnType<typeof setTimeout> | undefined;

    const crawlFrom = (openAt: number) => {
      // Sit there first, so the room settles into the scene before anything
      // starts moving.
      body.scrollTop = openAt;

      begin = setTimeout(() => {
        const startedAt = performance.now();

        const step = (now: number) => {
          const distance = body.scrollHeight - body.clientHeight;
          const progress = Math.min(1, (now - startedAt) / readMs);
          body.scrollTop = openAt + Math.max(0, distance - openAt) * progress;
          if (progress < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      }, focus.scrollDelay ?? 0);
    };

    // A named message may not be on screen yet: in a scene whose history is
    // laid down by the playback engine, nothing is in the DOM at mount. So
    // wait for it rather than measuring an empty chat and starting at the
    // top — which is exactly what a single measurement here would do.
    if (!focus.scrollFrom) {
      crawlFrom(0);
    } else {
      const deadline = performance.now() + 4000;
      const place = () => {
        const from = body.querySelector<HTMLElement>(
          `[data-message-id="${focus.scrollFrom}"]`,
        );
        if (from) {
          crawlFrom(Math.max(0, from.offsetTop - body.offsetTop));
        } else if (performance.now() < deadline) {
          frame = requestAnimationFrame(place);
        } else {
          // Never turned up — a wrong id shouldn't cost the scene its crawl.
          crawlFrom(0);
        }
      };
      frame = requestAnimationFrame(place);
    }

    return () => {
      if (begin) clearTimeout(begin);
      cancelAnimationFrame(frame);
    };
  }, [focus, runId, paused]);

  useEffect(() => {
    if (!focus || runId === null || paused) return;

    const startAt =
      (focus.scrollDelay ?? 0) + (focus.scrollMs ?? 0) + (focus.delay ?? 2500);

    const timer = setTimeout(() => {
      // No message named: push in on the box she is typing into. The move on
      // to the timestamp is a separate beat — it cannot be measured until she
      // has stopped typing and the time has settled at the end of the line.
      if (!focus.messageId) {
        setPanelTransform(
          composerPushIn(
            focus.maxScale ?? DRAFT_ZOOM_SCALE,
            focus.margin ?? DRAFT_ZOOM_MARGIN,
          ),
        );
        return;
      }

      const body = bodyRef.current;
      const column = columnRef.current;
      const row = column?.querySelector<HTMLElement>(
        `[data-message-id="${focus.messageId}"]`,
      );
      if (!body || !column || !row) return;

      // Measure the bubble, not the full-width row it is aligned within —
      // the row spans the whole chat and would fit at barely any zoom.
      const bubble = (row.firstElementChild as HTMLElement | null) ?? row;
      const box = bubble.getBoundingClientRect();
      const view = body.getBoundingClientRect();
      const col = column.getBoundingClientRect();
      if (!box.width || !box.height) return;

      // Scale so the bubble just fits, then centre it: with origin at 0 0 a
      // point p maps to col + t + scale * p, so solve t for the view centre.
      const margin = focus.margin ?? 90;
      const fit = Math.min(
        (view.width - margin * 2) / box.width,
        (view.height - margin * 2) / box.height,
      );
      const scale = Math.max(1, Math.min(fit, focus.maxScale ?? 3));

      const centreX = box.left + box.width / 2 - col.left;
      const centreY = box.top + box.height / 2 - col.top;
      const x = view.left + view.width / 2 - col.left - scale * centreX;
      const y = view.top + view.height / 2 - col.top - scale * centreY;

      setFocusTransform(`translate(${x}px, ${y}px) scale(${scale})`);
    }, startAt);

    return () => clearTimeout(timer);
  }, [focus, runId, paused, composerPushIn]);

  /*
   * The second half of a composer beat: once she has stopped typing and the
   * timestamp has landed at the end of her last word, close the rest of the
   * way in on it and let it glow.
   */
  useEffect(() => {
    if (!draftComplete || paused || runId === null) return;
    if (!focus || focus.messageId) return;

    const timer = setTimeout(() => {
      const onTime = centreOn(composerTimeRef.current, focus.timeScale ?? 3.4);
      if (!onTime) return;
      setPanelTransform(onTime);
      setComposerTimeLit(true);
    }, focus.timeDelay ?? 2000);

    return () => clearTimeout(timer);
  }, [draftComplete, paused, runId, focus, centreOn]);

  /*
   * The inspect beat. Once the push-in has landed, an oversized pointer walks
   * to the message, holds it, and opens Message info — the audience watching
   * somebody else operate the phone.
   */
  useEffect(() => {
    if (!inspect || focusTransform === null || paused || runId === null) return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, run: () => void) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) run();
        }, ms),
      );
    };

    // The bubble is still travelling under its own transition, so nothing is
    // measured until that has finished.
    const start = COLUMN_EASE_MS + (inspect.delay ?? 1400);

    at(start, () => {
      const panel = panelRef.current;
      const row = columnRef.current?.querySelector<HTMLElement>(
        `[data-message-id="${focus?.messageId}"]`,
      );
      if (!panel || !row) return;

      const view = panel.getBoundingClientRect();
      const bubble = (row.firstElementChild as HTMLElement | null) ?? row;
      const box = bubble.getBoundingClientRect();

      // Land a little in from the bubble's left edge, on its middle line —
      // where a thumb would actually come down.
      const target = {
        x: box.left - view.left + box.width * 0.28,
        y: box.top - view.top + box.height / 2,
      };

      // Enter from off the bottom-right corner. Painted there first, then
      // sent to the target on a later frame, so the walk is a transition and
      // not a jump.
      setPointerTravelMs(0);
      setPointer({ x: view.width + 160, y: view.height + 160 });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) return;
          setPointerTravelMs(POINTER_TO_MESSAGE_MS);
          setPointer(target);
        });
      });

      // Everything below is scheduled from here, which is already `start` ms
      // into the beat — so these offsets are relative to this moment, never
      // absolute, or each step would be pushed a further `start` down the line.
      const held = POINTER_TO_MESSAGE_MS + POINTER_SETTLE_MS;

      // Hold the message down. Silent: a long press has nothing to click.
      at(held, () => setPressing(true));
      at(held + HOLD_MS, () => setPressing(false));

      // The menu opens from the point that was pressed, kept inside the frame.
      const menuX = Math.min(target.x, view.width - MENU_WIDTH - 40);
      const menuY = Math.min(
        Math.max(40, target.y - MENU_HEIGHT * 0.35),
        view.height - MENU_HEIGHT - 40,
      );
      at(held + HOLD_MS, () => setMenuAt({ x: menuX, y: menuY }));

      // Then across to the first row — Message info. This one is a click.
      const toRow = held + HOLD_MS + MENU_OPEN_MS;
      at(toRow, () => {
        setPointerTravelMs(POINTER_TO_ROW_MS);
        setPointer({
          x: menuX + MENU_WIDTH * 0.42,
          y: menuY + MENU_PAD_Y + MENU_ROW_HEIGHT / 2,
        });
        setMenuLit(true);
      });

      const pressRow = toRow + POINTER_TO_ROW_MS + POINTER_SETTLE_MS;
      // Silent. The arrow dipping and the ring going out carry the press on
      // their own — a sound here was landing as a double against the hold.
      at(pressRow, () => setPressing(true));
      at(pressRow + PRESS_MS, () => {
        setPressing(false);
        setMenuAt(null);
        setInfoShown(true);
      });
    });

    return () => {
      cancelled = true;
      for (const timer of timers) clearTimeout(timer);
    };
  }, [inspect, focusTransform, paused, runId, focus]);

  /* The chat area's height, watched — the projector's shape is not known in
   * advance, and a full-bleed photo has to be cut to fit whatever it is. */
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    const measure = () => setChatHeight(body.clientHeight);
    const observer = new ResizeObserver(measure);
    observer.observe(body);

    return () => observer.disconnect();
  }, []);

  /* ----------------------------- auto-scroll ----------------------------- */
  useEffect(() => {
    // A read-through drives scrollTop itself; snapping to the bottom here
    // would fight it.
    if (focus?.scrollMs) return;
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [shownMessages, currentlyTyping, focus]);

  /** The message the beat is about — its text is echoed on the info screen. */
  const focusedMessage = focus?.messageId
    ? shownMessages.find((message) => message.id === focus.messageId)
    : undefined;

  const isSelfSender = (sender: string) =>
    sender === "me" || (!!selfName && sender === selfName);

  const started = runId !== null;

  const startPlayback = () => {
    // Built on the click so every tone is preloaded and autoplay-unlocked.
    toneRef.current ??= new Audio(TONE_SRC);
    toneRef.current.load();
    sentToneRef.current ??= new Audio(SENT_TONE_SRC);
    sentToneRef.current.load();
    setRunId((run) => (run ?? 0) + 1);
  };

  const typingIsFirstInGroup =
    !shownMessages.length ||
    shownMessages[shownMessages.length - 1]?.sender !== currentlyTyping;

  return (
    <section
      ref={panelRef}
      className="relative flex h-full min-w-0 flex-1 flex-col transition-transform duration-[2600ms] ease-in-out"
      style={{
        transformOrigin: "0 0",
        transform: panelTransform ?? "translate(0px, 0px) scale(1)",
      }}
    >
      {/* Header */}
      <header className="flex h-[100px] shrink-0 items-center gap-5 border-l border-[#d1d7db] bg-[#f0f2f5] px-6">
        <Avatar
          name={chat?.name ?? ""}
          color={chat?.avatarColor ?? "#7f9c93"}
          image={chat?.avatarImage}
          size={70}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[36px] font-bold">{chat?.name}</div>
          {currentlyTyping ? (
            // In a group WhatsApp names whoever is typing, so the room can
            // see who is about to speak before a word of it lands.
            <div className="truncate text-[24px] font-semibold text-[#00a884]">
              {chat?.isGroup ? `${currentlyTyping} ` : ""}
              {typingIsVoice ? "recording audio…" : "typing…"}
            </div>
          ) : headerStatus ? (
            <div className="truncate text-[24px] font-medium text-[#667781]">
              {headerStatus}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {finished && !instant ? (
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

        {/* Two nested elements on purpose. The inner one carries the zoom,
            which scales bubbles, text and padding together and keeps the 72%
            max-width proportional. The outer one carries the focus beat's
            push-in — because a translate written in px *inside* a zoomed box
            is itself multiplied by that zoom, so a move measured in screen
            pixels would overshoot by exactly textScale. Kept apart, the
            measurement and the move agree at any scale. */}
        <div
          className="transition-transform duration-[1600ms] ease-in-out"
          style={{
            transformOrigin: "0 0",
            transform: focusTransform ?? "translate(0px, 0px) scale(1)",
          }}
        >
          <div
            ref={columnRef}
            className="flex flex-col"
            style={textScale === 1 ? undefined : { zoom: textScale }}
          >
            {shownMessages.map((message) => (
              <MessageBubble
                key={message.id}
                sender={isSelfSender(message.sender) ? "me" : message.sender}
                text={message.text}
                image={message.image}
                imageWidth={message.imageWidth}
                imageFull={message.imageFull}
                // Room for the sender's name and the gaps around the card,
                // in the same units the column is laid out in.
                imageMaxHeight={
                  chatHeight ? chatHeight / textScale - 60 : undefined
                }
                imageAspect={message.imageAspect}
                audio={message.audio}
                // A flashback's notes are already old news — they don't
                // replay.
                audioAutoPlay={!instant}
                paused={paused}
                domId={message.id}
                metaPrefix={
                  focus?.messageId === message.id ? focus.label : undefined
                }
                // Only the focused message glows — everything else keeps its
                // ordinary grey timestamp.
                metaPrefixShown={
                  focus?.messageId === message.id && focusTransform !== null
                }
                metaGlow={focus?.glow === true}
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
                voice={typingIsVoice}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div
        ref={inputBarRef}
        className="flex shrink-0 items-center gap-3 bg-[#f0f2f5] px-4 py-3"
      >
        <IconButton label="Attach">
          <PlusIcon />
        </IconButton>
        <IconButton label="Emoji">
          <EmojiIcon />
        </IconButton>
        <div
          ref={inputFieldRef}
          className="flex min-h-20 flex-1 items-center rounded-full bg-white px-7 py-4"
        >
          {draft ? (
            <span className="whitespace-pre-wrap break-words text-[36px] font-semibold leading-[48px] text-[#111b21]">
              {draft}
              <span
                aria-hidden
                className="ml-[3px] inline-block h-[38px] w-[4px] translate-y-[7px] bg-[#00a884]"
                style={{ animation: "wa-caret-blink 1.1s step-end infinite" }}
              />
              {composerTime ? (
                // Sits immediately after the last word she typed. It glows
                // once the beat closes in on it.
                <span
                  ref={composerTimeRef}
                  className="ml-5 whitespace-nowrap text-[30px] font-semibold text-[#667781]"
                  style={
                    composerTimeLit
                      ? { animation: "wa-meta-glow 2.6s ease-in-out infinite" }
                      : undefined
                  }
                >
                  {composerTime}
                </span>
              ) : null}
            </span>
          ) : (
            <span className="flex items-center">
              <span
                aria-hidden
                className="mr-[3px] inline-block h-[38px] w-[4px] shrink-0 bg-[#00a884]"
                style={{ animation: "wa-caret-blink 1.1s step-end infinite" }}
              />
              <span className="text-[36px] text-[#8696a0]">Type a message</span>
            </span>
          )}
        </div>
        <IconButton label={draft ? "Send" : "Voice message"}>
          {draft ? <SendIcon /> : <MicIcon />}
        </IconButton>
      </div>

      {/* The inspect beat sits above the whole chat: menu, info screen, and
          the pointer on top of both. */}
      {menuAt ? (
        <MessageMenu x={menuAt.x} y={menuAt.y} highlight={menuLit} />
      ) : null}

      {infoShown && inspect && focusedMessage ? (
        <MessageInfoScreen
          text={focusedMessage.text}
          timestamp={focusedMessage.timestamp}
          readBy={inspect.readBy}
          deliveredTo={inspect.deliveredTo}
          senderColors={senderColors}
          scrollMs={inspect.scrollMs}
          paused={paused}
        />
      ) : null}

      {pointer ? (
        <Pointer
          x={pointer.x}
          y={pointer.y}
          travelMs={pointerTravelMs}
          clicking={pressing}
          visible
        />
      ) : null}
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
