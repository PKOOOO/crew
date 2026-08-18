export type ChatEvent =
  | {
      type: "message";
      id: string;
      sender: string;
      text: string;
      delay: number;
      /** Optional image attachment (path under /public), e.g. "/meme.png". */
      image?: string;
      /** Rendered width of the image card in px. Defaults to 420. */
      imageWidth?: number;
      /**
       * Voice note audio (path under /public), e.g. "/Aisha.ogg". Renders a
       * voice-note bubble instead of text, and plays as it lands.
       */
      audio?: string;
      /**
       * Already on screen when the scene opens — carried over from an earlier
       * scene rather than landing now. No delay, no typing, no tone.
       */
      settled?: boolean;
      /** Overrides the live clock, e.g. "11:43 PM". */
      time?: string;
    }
  | {
      type: "typing";
      sender: string;
      duration: number;
      /**
       * For the phone's owner: the draft typed into the input box, then
       * erased. Others just show the three-dot bubble.
       */
      draft?: string;
      /** Leave the draft sitting in the input instead of erasing it. */
      keepDraft?: boolean;
      /**
       * Push the view in on the message box before this draft is typed, and
       * hold it there. The view eases back out once the owner finally sends
       * something — so the room watches her write, and only then sees where
       * it landed. Consecutive zoomed drafts stay inside the one push-in.
       */
      zoom?: boolean;
      /**
       * Holding the mic rather than typing — the bubble shows a pulsing mic
       * and the header reads "recording audio…".
       */
      voice?: boolean;
    }
  | {
      type: "delete";
      targetId: string;
      delay: number;
    };

export type SavedScript = {
  id: string;
  name: string;
  chatListItem: ChatListItem;
  events: ChatEvent[];
  senderColors: Record<string, string>;
};

export type ChatListItem = {
  id: string;
  name: string;
  avatarColor: string;
  /** Photo shown instead of initials — groups use the class picture. */
  avatarImage?: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  isGroup?: boolean;
};
