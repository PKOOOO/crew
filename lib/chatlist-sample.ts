import type { ChatListItem } from "@/types/chat";

/**
 * Fictional placeholder data only — names and messages come from the show's
 * script ("THE CREW" cast) plus generic UI-testing contacts. Never seed this
 * file from real conversations or screenshots.
 */
export const chatListSample: ChatListItem[] = [
  {
    id: "the-crew",
    name: "THE CREW",
    avatarColor: "#5f7f8c",
    lastMessage: "Jay: Party Saturday!",
    time: "22:05",
    unreadCount: 12,
    isGroup: true,
  },
  {
    id: "sam",
    name: "Sam",
    avatarColor: "#6b8e9e",
    lastMessage: "see you tomorrow",
    time: "21:46",
  },
  {
    id: "maya",
    name: "Maya",
    avatarColor: "#a1806f",
    lastMessage: "Guys... Can I tell you something?",
    time: "21:31",
    unreadCount: 1,
  },
  {
    id: "mr-mwangi",
    name: "Ms. Mwangi",
    avatarColor: "#5f8c7d",
    lastMessage: "Remember my door is always open.",
    time: "19:27",
  },
  {
    id: "jay",
    name: "Jay",
    avatarColor: "#8a7f6b",
    lastMessage: "🔥🔥🔥🔥🔥",
    time: "17:49",
    unreadCount: 3,
  },
  {
    id: "tash",
    name: "Tash",
    avatarColor: "#9b7ea1",
    lastMessage: "Next weekend again!!",
    time: "17:37",
  },
  {
    id: "kevin",
    name: "Kevin",
    avatarColor: "#8c6f5f",
    lastMessage: "Legendary style!",
    time: "16:20",
    unreadCount: 2,
  },
  {
    id: "aisha",
    name: "Aisha",
    avatarColor: "#6f7f8c",
    lastMessage: "Send me the mirror selfies.",
    time: "14:03",
  },
  {
    id: "leo",
    name: "Leo",
    avatarColor: "#8c8c6f",
    lastMessage: "…",
    time: "12:59",
  },
  {
    id: "mom",
    name: "Mom",
    avatarColor: "#a1707f",
    lastMessage: "Proud of you ❤️",
    time: "11:07",
  },
  {
    id: "study-group",
    name: "Study Group",
    avatarColor: "#7d8c5f",
    lastMessage: "Alex: notes for Friday?",
    time: "09:48",
    isGroup: true,
  },
];
