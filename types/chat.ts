export type ChatEvent =
  | {
      type: "message";
      id: string;
      sender: string;
      text: string;
      delay: number;
      /** Optional image attachment (path under /public), e.g. "/meme.png". */
      image?: string;
    }
  | {
      type: "typing";
      sender: string;
      duration: number;
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
