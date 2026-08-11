import type { ChatEvent } from "@/types/chat";

export type AppType = "whatsapp" | "tiktok" | "notes" | "lockscreen";

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

export type NotesEvent =
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
      delay: number;
    };

type SceneBase = {
  id: string;
  label: string;
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
    })
  | (SceneBase & { appType: "tiktok"; events: TikTokEvent[]; username?: string })
  | (SceneBase & { appType: "notes"; events: NotesEvent[]; dark?: boolean })
  | (SceneBase & { appType: "lockscreen"; events: LockscreenEvent[] });
