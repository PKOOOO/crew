import type { ChatEvent } from "@/types/chat";

export type AppType =
  | "whatsapp"
  | "chatlist"
  | "groupinfo"
  | "tiktok"
  | "notes"
  | "lockscreen";

export type TikTokEvent =
  | {
      /** Animates the like counter from its current value up to target. */
      type: "likes";
      target: number;
      duration: number;
    }
  | {
      /** Appends to the comment list, one at a time. */
      type: "comment";
      author: string;
      text: string;
      delay: number;
    }
  | {
      /** Static caption shown once (a later caption replaces it). */
      type: "caption";
      text: string;
    };

export type ChatListEvent = {
  /** One chat row in the list, revealed after delay. */
  type: "chat";
  name: string;
  preview: string;
  time: string;
  /** A missed call row shows the red missed-call arrow instead of ticks. */
  kind?: "message" | "missed-call";
  /** Ticks on the row's preview: grey = delivered but never opened. */
  ticks?: "none" | "sent" | "delivered" | "read";
  unreadCount?: number;
  /** Sound + emphasis as the row lands. */
  highlight?: boolean;
  delay: number;
};

export type GroupInfoEvent = {
  /** One member row, revealed after delay. */
  type: "member";
  name: string;
  /** "Online", "last seen today at 21:31", … */
  status: string;
  isAdmin?: boolean;
  /** Renders as "You" with the member-tag line. */
  isYou?: boolean;
  /** Draws attention (sound + emphasis) — used for the last-seen reveal. */
  highlight?: boolean;
  delay: number;
};

/** One row in the notes index — the "all notes" screen. */
export type NoteListItem = {
  /** Bold first line of the row. */
  title: string;
  /** Grey date under the title, e.g. "19/07/2026". */
  date: string;
  /** Grey text after the date — the note's first body line. */
  preview?: string;
  /** Section this note files under, e.g. "Previous 30 Days" or "June". */
  group: string;
};

export type NotesEvent =
  | {
      /** Holds on the notes index (all notes) for duration. */
      type: "list";
      duration: number;
    }
  | {
      /** Leaves the index and opens a single note. */
      type: "open";
      title?: string;
      date?: string;
    }
  | {
      /** Reveals text character-by-character at charDelayMs per character. */
      type: "type";
      text: string;
      charDelayMs: number;
    }
  | {
      /** Cursor just blinks, no change. */
      type: "pause";
      duration: number;
    }
  | {
      /** Erases the current text character-by-character over duration. */
      type: "delete";
      duration: number;
    }
  | {
      /**
       * A pile of past entries that scrolls rapidly up the screen, slowing to
       * linger on the last one.
       */
      type: "drafts";
      items: string[];
      duration: number;
    };

export type LockscreenEvent =
  | {
      type: "notification";
      /** Needed when a later "status" event targets this notification. */
      id?: string;
      app: "call" | "message";
      from: string;
      preview: string;
      delay: number;
    }
  | {
      type: "status";
      targetNotificationId: string;
      status: "delivered" | "read" | "missed";
      /** Overrides the default status wording, e.g. "Read 11:43 PM". */
      label?: string;
      delay: number;
    };

type SceneBase = {
  id: string;
  label: string;
  /**
   * Clock the phone shows for this scene, 24-hour ("23:43"). Keeps the status
   * bar honest against the timestamps inside the scene. Omitted = live clock.
   */
  statusTime?: string;
  /** Date under the lockscreen clock, e.g. "Sunday 19 July". */
  statusDate?: string;
};

/**
 * Discriminated on appType so the events array narrows to the right union —
 * PhoneFrame can hand each screen its own event type without casts.
 */
export type Scene =
  | (SceneBase & {
      appType: "whatsapp";
      events: ChatEvent[];
      /** Chat header name; falls back to the scene label. */
      chatName?: string;
      /** Whose phone this is; defaults to "Maya". */
      selfName?: string;
    })
  | (SceneBase & {
      appType: "chatlist";
      events: ChatListEvent[];
      /** Counts shown in the filter pills. */
      unreadTotal?: number;
      groupTotal?: number;
    })
  | (SceneBase & {
      appType: "groupinfo";
      events: GroupInfoEvent[];
      groupName?: string;
      /** Total shown in the "Group · N members" line; defaults to row count. */
      memberCount?: number;
    })
  | (SceneBase & { appType: "tiktok"; events: TikTokEvent[]; username?: string })
  | (SceneBase & {
      appType: "notes";
      events: NotesEvent[];
      dark?: boolean;
      /** Rows for the index screen; a "list" event needs these. */
      notes?: NoteListItem[];
      /** Yellow heading on the open note. */
      noteTitle?: string;
      /** Centered timestamp on the open note. */
      noteDate?: string;
    })
  | (SceneBase & { appType: "lockscreen"; events: LockscreenEvent[] });
