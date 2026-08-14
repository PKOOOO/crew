export type ChatEvent =
  | {
      type: "message";
      id: string;
      sender: string;
      text: string;
      delay: number;
      /** Optional image attachment (path under /public), e.g. "/meme.png". */
      image?: string;
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
  lastMessage: string;
  time: string;
  unreadCount?: number;
  isGroup?: boolean;
};
