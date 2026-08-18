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
      /**
       * Swipes up to the next post in the feed: the screen slides, and the
       * clip, caption, author and like count are all replaced.
       */
      type: "swipe";
      /** Clip under /public. Omitted keeps whatever was playing. */
      video?: string;
      caption?: string;
      username?: string;
      /** Likes already on the post — it is somebody else's, not landing live. */
      likes?: number;
      /** How long to sit on it before the next event. */
      duration: number;
    }
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

export type ChatListEvent =
  | {
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
    }
  | {
      /**
       * An incoming voice call: the accept/decline banner drops in and the
       * row sits on "Ringing" for duration, then goes missed when nobody
       * picks up.
       */
      type: "call";
      name: string;
      time: string;
      /** How long it rings before it gives up, ms. */
      duration: number;
      delay: number;
    };

/**
 * A slow push-in on one message once the scene has settled. The bubble is
 * measured and fitted to the screen — nothing else stays in frame.
 */
export type FocusBeat = {
  /** id of the message to move in on. */
  messageId: string;
  /** Fades in to the left of that message's timestamp. */
  label?: string;
  /**
   * Crawl the whole conversation top to bottom over this many ms first, so
   * every message is read before the push-in. A chat that already fits the
   * screen simply holds for the same length of time.
   */
  scrollMs?: number;
  /** Hold after the read-through, before the move starts, ms. Default 2500. */
  delay?: number;
  /** Ceiling on the fitted scale, so a short bubble can't fill the wall. */
  maxScale?: number;
  /** Breathing room left around the bubble, px. Defaults to 90. */
  margin?: number;
};

/** A chat held at the top of the list, above anything that lands. */
export type PinnedChat = {
  name: string;
  preview: string;
  time: string;
  unreadCount?: number;
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
      /** App icon image under /public; falls back to a generic app tile. */
      icon?: string;
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
      /**
       * Flashback: the whole conversation is already on screen when the scene
       * opens — no delays, no typing indicators, nothing lands live.
       */
      instant?: boolean;
      /** Line under the chat name, e.g. a member's last-seen. */
      headerStatus?: string;
      /**
       * Scales the whole message column — text and bubbles together. 1 is the
       * standard size; 1.25 makes a sparse scene read from the back of a room.
       */
      textScale?: number;
      /**
       * After the scene settles, push in on one message and let a line of
       * text fade in beside its timestamp.
       */
      focus?: FocusBeat;
    })
  | (SceneBase & {
      appType: "chatlist";
      events: ChatListEvent[];
      /** Counts shown in the filter pills. */
      unreadTotal?: number;
      groupTotal?: number;
      /** Group kept at the top of the list. */
      pinned?: PinnedChat;
    })
  | (SceneBase & {
      appType: "groupinfo";
      events: GroupInfoEvent[];
      groupName?: string;
      /** Total shown in the "Group · N members" line; defaults to row count. */
      memberCount?: number;
    })
  | (SceneBase & {
      appType: "tiktok";
      events: TikTokEvent[];
      username?: string;
      /** Clip playing behind the UI (path under /public), e.g. "/maya.mp4". */
      video?: string;
      /** Pop heard while the like counter climbs. Defaults to "/likes.mp3". */
      likesSound?: string;
    })
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
  | (SceneBase & { appType: "lockscreen"; events: LockscreenEvent[] })
  | (SceneBase & {
      /** One line on a black screen — no app, no chrome. */
      appType: "flash";
      text: string;
      /** Beat of black before the line appears, ms. */
      delay?: number;
    });
