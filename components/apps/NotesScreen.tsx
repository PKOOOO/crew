"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ListTodo,
  Mic,
  MoreHorizontal,
  Paperclip,
  PenTool,
  Search,
  Share,
  Shrink,
  SquarePen,
} from "lucide-react";
import type { NoteListItem, NotesEvent } from "@/types/scene";
import { createKeyClick, type KeyClick } from "@/lib/key-click";

export type NotesScreenProps = {
  events: NotesEvent[];
  /** Initial background; the "..." button in the corner flips it live. */
  dark?: boolean;
  /** Rows for the index screen — needed by "list" events. */
  notes?: NoteListItem[];
  /** Yellow heading on the open note. */
  noteTitle?: string;
  /** Centered timestamp on the open note. */
  noteDate?: string;
  autoStart?: boolean;
  /** Called once when all events have played. */
  onFinished?: () => void;
};

/** Accent yellow used for note headings, matching the iOS Notes accent. */
const ACCENT = "#ffc400";

export default function NotesScreen({
  events,
  dark: darkInitial = false,
  notes = [],
  noteTitle,
  noteDate,
  autoStart = false,
  onFinished,
}: NotesScreenProps) {
  const [text, setText] = useState("");
  /** Past entries for the "drafts scroll" beat. */
  const [entries, setEntries] = useState<string[]>([]);
  /** Index screen vs. the open note. Scenes without a "list" event open cold. */
  const [view, setView] = useState<"list" | "note">(() =>
    events[0]?.type === "list" ? "list" : "note",
  );
  const [openTitle, setOpenTitle] = useState<string | undefined>(noteTitle);
  const [openDate, setOpenDate] = useState<string | undefined>(noteDate);
  /** Blank space above the drafts so they start below the screen edge. */
  const [leadIn, setLeadIn] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const [dark, setDark] = useState(darkInitial);
  const onFinishedRef = useRef(onFinished);
  const clickRef = useRef<KeyClick | null>(null);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  /* --------------------------- playback engine --------------------------- */
  // Same sequential-await pattern as the WhatsApp engine: one effect, a
  // cancelled flag, awaited setTimeout waits, cleanup clears the timer.
  useEffect(() => {
    if (!autoStart) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    const play = async () => {
      let current = "";
      setText(current);
      setEntries([]);
      setLeadIn(0);
      setView(events[0]?.type === "list" ? "list" : "note");
      setOpenTitle(noteTitle);
      setOpenDate(noteDate);

      for (const event of events) {
        if (cancelled) return;

        if (event.type === "list") {
          setView("list");
          await wait(event.duration);
          continue;
        }

        if (event.type === "open") {
          setView("note");
          if (event.title !== undefined) setOpenTitle(event.title);
          if (event.date !== undefined) setOpenDate(event.date);
          continue;
        }

        if (event.type === "type") {
          for (const character of event.text) {
            await wait(event.charDelayMs);
            if (cancelled) return;
            current += character;
            setText(current);
            (clickRef.current ??= createKeyClick())();
          }
          continue;
        }

        if (event.type === "pause") {
          await wait(event.duration);
          continue;
        }

        if (event.type === "drafts") {
          // Hundreds of unsent drafts climb up from below the screen.
          setEntries(event.items);
          setText("");
          await wait(80);
          if (cancelled) return;

          // A screen's worth of blank space above the first line, so the
          // list starts entirely below the fold and rises into view.
          const listBox = listRef.current;
          if (listBox) setLeadIn(listBox.clientHeight);
          await wait(60);
          if (cancelled) return;

          await new Promise<void>((resolve) => {
            const list = listRef.current;
            if (!list) {
              resolve();
              return;
            }
            const startedAt = performance.now();
            const step = (now: number) => {
              if (cancelled) {
                resolve();
                return;
              }
              // Re-measured every frame, not captured up front: web fonts and
              // image layout can still be settling when the scroll starts, and
              // a distance measured too early stops short of the last line.
              const distance = list.scrollHeight - list.clientHeight;
              const progress = Math.min(1, (now - startedAt) / event.duration);
              // Constant speed. Any ease-out spends its first seconds moving
              // fastest, which is exactly when the room is starting to read —
              // every line has to pass at the same pace to be readable, with
              // just a short glide out of rest at the very top.
              const eased =
                progress < 0.06
                  ? (progress * progress) / 0.12
                  : progress - 0.03;
              list.scrollTop = distance * eased;
              if (progress < 1) requestAnimationFrame(step);
              else resolve();
            };
            requestAnimationFrame(step);
          });
          continue;
        }

        // delete: erase character-by-character over the given duration.
        const startLength = current.length;
        if (!startLength) {
          await wait(event.duration);
          continue;
        }
        const perCharacter = Math.max(16, event.duration / startLength);
        while (current.length) {
          await wait(perCharacter);
          if (cancelled) return;
          current = current.slice(0, -1);
          setText(current);
          (clickRef.current ??= createKeyClick())("soft");
        }
      }

      if (!cancelled) onFinishedRef.current?.();
    };

    void play();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [events, autoStart, noteTitle, noteDate]);

  /** Chrome buttons: circular on their own, grouped inside a pill. */
  const chip = dark ? "bg-[#1c1c1e] text-white" : "bg-black/5 text-[#1c1c1e]";
  const muted = "text-[#8e8e93]";
  const toggleBackground = () => setDark((value) => !value);

  return (
    <div
      className={`relative flex h-full w-full flex-col transition-colors ${
        dark ? "bg-black text-white" : "bg-white text-[#1c1c1e]"
      }`}
    >
      {view === "list" ? (
        <NotesIndex
          notes={notes}
          chip={chip}
          muted={muted}
          dark={dark}
          onToggleBackground={toggleBackground}
        />
      ) : (
        <div className="flex h-full w-full flex-col px-10 pb-7 pt-6">
          {/* Top chrome: collapse left, date centered, share + more right */}
          <div className="flex shrink-0 items-start justify-between gap-6">
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-full ${chip}`}
            >
              <Shrink className="h-8 w-8" strokeWidth={2.4} />
            </span>

            <span
              className={`pt-4 text-center text-[24px] font-medium ${muted}`}
            >
              {openDate}
            </span>

            <span
              className={`flex h-16 items-center gap-8 rounded-full px-8 ${chip}`}
            >
              <Share className="h-8 w-8" strokeWidth={2.2} />
              <button
                type="button"
                aria-label="Toggle background"
                onClick={toggleBackground}
                className="cursor-pointer"
              >
                <MoreHorizontal className="h-8 w-8" strokeWidth={2.6} />
              </button>
            </span>
          </div>

          {/* The note body — titled first line, then the note itself */}
          {openTitle ? (
            <h1
              className="mt-2 inline-block shrink-0 self-start break-words border-b-[5px] text-[64px] font-extrabold leading-tight"
              style={{ color: ACCENT, borderColor: ACCENT }}
            >
              {openTitle}
            </h1>
          ) : null}

          {entries.length ? (
            <div ref={listRef} className="min-h-0 flex-1 overflow-hidden pt-6">
              {/* Lead-in holds the lines below the fold until the scroll
                  lifts them. Deep bottom padding so a 104px descender has
                  room and the last line ends clear of the edge. */}
              <ul
                className="flex flex-col gap-14 pb-24"
                style={{ paddingTop: leadIn }}
              >
                {entries.map((entry, index) => {
                  const isLast = index === entries.length - 1;
                  return (
                    <li
                      key={index}
                      className={`break-words pb-2 ${
                        isLast
                          ? "text-[132px] font-bold leading-[1.3]"
                          : "text-[96px] font-semibold leading-[1.3] opacity-75"
                      }`}
                      style={isLast ? { color: ACCENT } : undefined}
                    >
                      {entry}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-hidden pt-4">
              <p className="whitespace-pre-wrap break-words text-[150px] font-semibold leading-[1.45]">
                {text}
                <span
                  aria-hidden
                  className="ml-0.5 inline-block h-[1.15em] w-[2px] translate-y-[0.2em] bg-current"
                  style={{ animation: "wa-caret-blink 1.1s step-end infinite" }}
                />
              </p>
            </div>
          )}

          {/* Bottom chrome: format tools left, compose right */}
          <div className="flex shrink-0 items-center justify-between pt-4">
            <span
              className={`flex h-16 items-center gap-9 rounded-full px-8 ${chip}`}
            >
              <ListTodo className="h-8 w-8" strokeWidth={2.2} />
              <Paperclip className="h-8 w-8" strokeWidth={2.2} />
              <PenTool className="h-8 w-8" strokeWidth={2.2} />
            </span>
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-full ${chip}`}
            >
              <SquarePen className="h-8 w-8" strokeWidth={2.2} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------- the "all notes" index ------------------------- */

/**
 * The index screen, laid out for the landscape frame: the portrait design's
 * single column of sections becomes two columns so the width is used.
 */
function NotesIndex({
  notes,
  chip,
  muted,
  dark,
  onToggleBackground,
}: {
  notes: NoteListItem[];
  chip: string;
  muted: string;
  dark: boolean;
  onToggleBackground: () => void;
}) {
  // Group rows in first-seen order, the way the app files them by recency.
  const groups: { name: string; items: NoteListItem[] }[] = [];
  for (const note of notes) {
    const existing = groups.find((group) => group.name === note.group);
    if (existing) existing.items.push(note);
    else groups.push({ name: note.group, items: [note] });
  }

  const card = dark ? "bg-[#1c1c1e]" : "bg-[#f2f2f7]";
  const divider = dark ? "border-white/10" : "border-black/10";

  return (
    <div className="flex h-full w-full flex-col px-10 pb-7 pt-6">
      {/* Header: back, title + count, more */}
      <div className="flex shrink-0 items-center justify-between gap-6">
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-full ${chip}`}
        >
          <ChevronLeft className="h-9 w-9" strokeWidth={2.6} />
        </span>
        <span className="flex flex-col items-center">
          <span className="text-[34px] font-bold leading-tight">Notes</span>
          <span className={`text-[24px] font-medium ${muted}`}>
            {notes.length} {notes.length === 1 ? "Note" : "Notes"}
          </span>
        </span>
        <button
          type="button"
          aria-label="Toggle background"
          onClick={onToggleBackground}
          className={`flex h-16 w-16 cursor-pointer items-center justify-center rounded-full ${chip}`}
        >
          <MoreHorizontal className="h-8 w-8" strokeWidth={2.6} />
        </button>
      </div>

      {/* Sections */}
      <div className="min-h-0 flex-1 overflow-hidden pt-8">
        <div className="grid grid-cols-2 gap-x-10 gap-y-8">
          {groups.map((group) => (
            <section key={group.name} className="flex flex-col gap-4">
              <h2 className="text-[32px] font-bold">{group.name}</h2>
              <div className={`overflow-hidden rounded-[28px] ${card}`}>
                {group.items.map((note, index) => (
                  <div
                    key={`${note.title}-${index}`}
                    className={`px-8 py-5 ${
                      index > 0 ? `border-t ${divider}` : ""
                    }`}
                  >
                    <div className="truncate text-[30px] font-bold leading-tight">
                      {note.title}
                    </div>
                    <div
                      className={`mt-1 flex gap-4 text-[26px] font-medium ${muted}`}
                    >
                      <span className="shrink-0">{note.date}</span>
                      {note.preview ? (
                        <span className="truncate">{note.preview}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Search bar + compose */}
      <div className="flex shrink-0 items-center gap-6 pt-4">
        <span
          className={`flex h-16 flex-1 items-center gap-4 rounded-full px-7 ${chip}`}
        >
          <Search className={`h-7 w-7 ${muted}`} strokeWidth={2.6} />
          <span className={`flex-1 text-[26px] font-medium ${muted}`}>
            Search
          </span>
          <Mic className={`h-7 w-7 ${muted}`} strokeWidth={2.2} />
        </span>
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-full ${chip}`}
        >
          <SquarePen className="h-8 w-8" strokeWidth={2.2} />
        </span>
      </div>
    </div>
  );
}
