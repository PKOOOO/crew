import type { ChatEvent } from "@/types/chat";
import type {
  ChatListEvent,
  LockscreenEvent,
  NoteListItem,
  NotesEvent,
  Scene,
  TikTokEvent,
} from "@/types/scene";

/*
 * Scene order follows the printed script, convo1 → convo11:
 *   1  THE CREW — BEST CLASS EVER                  convo1
 *   2  THE CREW — party planning + memes          convo2
 *   3  Act One close — "READ 11:43 PM"            convo3
 *   4  the funny TikTok — likes flood in          convo4
 *   5  the secret account (Notes)                 convo4
 *   6  Maya types, never sends                    convo5
 *   7  THE CREW interrupts — "You're famous"      convo6
 *   8  the pivotal night chat                     convo7
 *   9  Ms. Mwangi / Dad / Mom — never opened       convo8
 *   10 the final vibrate — "READ 11:43 PM"        convo8
 *   11 aftermath — RIP Maya                       convo9
 *   12 the chat sits in dead silence (flashback)   convo10
 *   13 the unsent drafts                          convo11
 */

/* 1 — The group lights up about the school day. Everyone has something to
 * say. Except Maya: all she manages is 😊 */
const scene1Whatsapp: ChatEvent[] = [
  {
    type: "message",
    id: "s1-1",
    sender: "Tash",
    text: "BEST CLASS EVER!❤️❤️❤️",
    image: "/scene1.jpeg",
    imageWidth: 560,
    time: "1:03 PM",
    delay: 2400,
  },
  {
    type: "message",
    id: "s1-2",
    sender: "Jay",
    text: "Best day everrr 😂",
    time: "1:03 PM",
    delay: 3200,
  },
  {
    type: "message",
    id: "s1-3",
    sender: "Tash",
    text: "We ate 🔥🔥",
    time: "1:04 PM",
    delay: 2800,
  },
  {
    type: "message",
    id: "s1-4",
    sender: "Kevin",
    text: "Legends only",
    time: "1:04 PM",
    delay: 2800,
  },
  {
    type: "message",
    id: "s1-5",
    sender: "Aisha",
    text: "❤️❤️❤️❤️❤️",
    time: "1:05 PM",
    delay: 2600,
  },
  // Everyone has something to say. Maya manages a smiley.
  {
    type: "message",
    id: "s1-6",
    sender: "Maya",
    text: "😊",
    time: "1:05 PM",
    delay: 4000,
  },
];

/* 2 — GROUP CHAT PROJECTION: the party gets planned, then the memes. */
const scene2Whatsapp: ChatEvent[] = [
  {
    type: "message",
    id: "s2-1",
    sender: "Jay",
    text: "Party Saturday!",
    time: "8:02 PM",
    delay: 1200,
  },
  {
    type: "message",
    id: "s2-2",
    sender: "Tash",
    text: "Maya's place!!",
    time: "8:03 PM",
    delay: 2000,
  },
  {
    type: "message",
    id: "s2-3",
    sender: "Kevin",
    text: "Parents rich rich 😂",
    time: "8:03 PM",
    delay: 2200,
  },

  // Hundreds of memes. Voice notes. Laughing emojis. Each voice note plays
  // out in full before the next person starts — sticker, voice, sticker.
  {
    type: "message",
    id: "s2-m1",
    sender: "Jay",
    text: "",
    image: "/m1.gif",
    time: "8:04 PM",
    delay: 1600,
  },
  { type: "typing", sender: "Brian", duration: 2000, voice: true },
  {
    type: "message",
    id: "s2-v1",
    sender: "Brian",
    text: "",
    audio: "/Brian.mp3",
    time: "8:04 PM",
    delay: 400,
  },
  {
    type: "message",
    id: "s2-m2",
    sender: "Kevin",
    text: "",
    image: "/m2.webp",
    time: "8:05 PM",
    delay: 1300,
  },
  {
    type: "message",
    id: "s2-4",
    sender: "Tash",
    text: "😂😂😂😂",
    time: "8:05 PM",
    delay: 1200,
  },
  {
    type: "message",
    id: "s2-m3",
    sender: "Aisha",
    text: "",
    image: "/m3.webp",
    time: "8:06 PM",
    delay: 1300,
  },
  // Aisha holds the mic — three seconds of pulsing — then it lands and plays.
  { type: "typing", sender: "Aisha", duration: 2000, voice: true },
  {
    type: "message",
    id: "s2-6",
    sender: "Aisha",
    text: "",
    audio: "/Aisha.ogg",
    time: "8:06 PM",
    delay: 400,
  },
  {
    type: "message",
    id: "s2-m4",
    sender: "Jay",
    text: "",
    image: "/m4.gif",
    time: "8:07 PM",
    delay: 1200,
  },
  {
    type: "message",
    id: "s2-5",
    sender: "Kevin",
    text: "🔥🔥🔥🔥🔥",
    time: "8:07 PM",
    delay: 1200,
  },
  { type: "typing", sender: "Leo", duration: 2000, voice: true },
  {
    type: "message",
    id: "s2-v2",
    sender: "Leo",
    text: "",
    audio: "/Leo.mp3",
    time: "8:08 PM",
    delay: 400,
  },
  {
    type: "message",
    id: "s2-m5",
    sender: "Tash",
    text: "",
    image: "/m5.webp",
    time: "8:08 PM",
    delay: 1300,
  },
  {
    type: "message",
    id: "s2-m6",
    sender: "Kevin",
    text: "",
    image: "/m6.webp",
    time: "8:09 PM",
    delay: 1300,
  },
  { type: "typing", sender: "Nia", duration: 2000, voice: true },
  {
    type: "message",
    id: "s2-v3",
    sender: "Nia",
    text: "",
    audio: "/Nia.mp3",
    time: "8:09 PM",
    delay: 400,
  },
  {
    type: "message",
    id: "s2-m7",
    sender: "Aisha",
    text: "",
    image: "/m7.gif",
    time: "8:10 PM",
    delay: 1200,
  },
  {
    type: "message",
    id: "s2-m8",
    sender: "Jay",
    text: "",
    image: "/m8.gif",
    time: "8:10 PM",
    delay: 1200,
  },
  {
    type: "message",
    id: "s2-7",
    sender: "Tash",
    text: "😂😂😂😂😂😂",
    time: "8:11 PM",
    delay: 1200,
  },
];

/* 3 — Act One close: the notification that flashes before the blackout. */
const scene3Lockscreen: LockscreenEvent[] = [
  {
    type: "notification",
    id: "act1",
    app: "message",
    from: "THE CREW 🔥",
    preview: "Guys... Can I tell you something?",
    icon: "/apple.png",
    delay: 2500,
  },
  {
    type: "status",
    targetNotificationId: "act1",
    status: "read",
    delay: 2500,
  },
];

/* 4 — She nails the take. Uploads it. Within seconds: 100… 300… 800 likes. */
const scene4Tiktok: TikTokEvent[] = [
  { type: "likes", target: 100, duration: 2000 },
  {
    type: "comment",
    author: "jay_official",
    text: "You're hilarious!",
    delay: 1600,
  },
  { type: "likes", target: 300, duration: 2200 },
  {
    type: "comment",
    author: "tash.k",
    text: "I wish I had your life.",
    delay: 1800,
  },
  { type: "likes", target: 800, duration: 2600 },
  { type: "comment", author: "kevin_m", text: "Queen!", delay: 1600 },
];

/* 5 — A secret account. No profile picture. No followers. This is where
 * she writes. The index opens first, then the one note nobody has read. */
const mayaNotes: NoteListItem[] = [
  {
    group: "Previous 30 Days",
    title: "private",
    date: "19/07/2026",
    preview: "—",
  },
  {
    group: "Previous 30 Days",
    title: "party list",
    date: "16/07/2026",
    preview: "snacks, speaker, ice",
  },
  {
    group: "June",
    title: "bio revision",
    date: "07/06/2026",
    preview: "photosynthesis",
  },
  {
    group: "May",
    title: "song ideas",
    date: "16/05/2026",
    preview: "chorus, bridge",
  },
];

const scene5Notes: NotesEvent[] = [
  { type: "list", duration: 3200 },
  { type: "open", title: "private", date: "19 July 2026 at 23:31" },
  {
    type: "type",
    text: "Does anybody ever feel invisible in a room full of people?",
    charDelayMs: 90,
  },
  { type: "pause", duration: 2400 },
  { type: "delete", duration: 1200 },
  { type: "type", text: "I'm tired.", charDelayMs: 120 },
  { type: "pause", duration: 2200 },
  { type: "delete", duration: 800 },
  { type: "type", text: "If I disappeared...", charDelayMs: 120 },
  { type: "pause", duration: 2600 },
  { type: "delete", duration: 1000 },
];

/* 6 — She opens the group chat and types it. Before she can send, the
 * others burst into the room. The draft just sits there. */
const scene6Whatsapp: ChatEvent[] = [
  {
    type: "typing",
    sender: "Maya",
    duration: 9000,
    draft: "Guys... can I tell you something?",
    keepDraft: true,
  },
];

/* 7 — Her phone lights up. THE CREW. */
const scene7Whatsapp: ChatEvent[] = [
  {
    type: "message",
    id: "s7-1",
    sender: "Jay",
    text: "😂😂😂 You're famous MAYA!",
    time: "1:12 PM",
    delay: 1500,
  },
  {
    type: "message",
    id: "s7-2",
    sender: "Kevin",
    text: "Legendary style!",
    time: "1:13 PM",
    delay: 2000,
  },
  {
    type: "message",
    id: "s7-3",
    sender: "Tash",
    text: "We're at the cafeteria. Come!",
    time: "1:13 PM",
    delay: 2200,
  },
];

/* 8 — The pivotal night chat, 11:31 PM → 11:43 PM. */
const scene8Whatsapp: ChatEvent[] = [
  {
    type: "message",
    id: "s8-1",
    sender: "Kevin",
    text: "😂😂 Today's party was mad.",
    time: "11:31 PM",
    delay: 1500,
  },
  {
    type: "message",
    id: "s8-2",
    sender: "Jay",
    text: "Maya upload the videos!!",
    time: "11:33 PM",
    delay: 2000,
  },
  {
    type: "message",
    id: "s8-3",
    sender: "Aisha",
    text: "Send me the mirror selfies.",
    time: "11:35 PM",
    delay: 2200,
  },
  {
    type: "message",
    id: "s8-4",
    sender: "Tash",
    text: "Next weekend again!!",
    time: "11:39 PM",
    delay: 2600,
  },

  // Maya typing… Maya typing… Maya typing… The audience watches her type.
  { type: "typing", sender: "Maya", duration: 5000, draft: "Guys..." },
  {
    type: "typing",
    sender: "Maya",
    duration: 6500,
    draft: "Can somebody talk to me?",
  },
  { type: "typing", sender: "Maya", duration: 4500, draft: "I'm not okay." },

  // Finally… 11:43 PM
  {
    type: "message",
    id: "s8-5",
    sender: "Maya",
    text: "Guys... Can I tell you something?",
    time: "11:43 PM",
    delay: 2000,
  },

  // Silence. Three dots appear. Someone is typing. Kevin sends… a meme.
  { type: "typing", sender: "Kevin", duration: 3500 },
  {
    type: "message",
    id: "s8-6",
    sender: "Kevin",
    text: "",
    image: "/meme.png",
    time: "11:43 PM",
    delay: 1200,
  },

  // Everyone reacts.
  {
    type: "message",
    id: "s8-7",
    sender: "Jay",
    text: "Bro look at this cat. 😂😂😂",
    time: "11:43 PM",
    delay: 1600,
  },
  {
    type: "message",
    id: "s8-8",
    sender: "Aisha",
    text: "😂😂😂",
    time: "11:44 PM",
    delay: 1400,
  },
  {
    type: "message",
    id: "s8-9",
    sender: "Kevin",
    text: "😂😂😂😂😂",
    time: "11:44 PM",
    delay: 1200,
  },

  // Leo is online. He types... Stops. Deletes.
  { type: "typing", sender: "Leo", duration: 4000 },
];

/* 9 — Delivered. Never opened. */
const scene9ChatList: ChatListEvent[] = [
  {
    type: "chat",
    name: "Ms. Mwangi",
    preview: "Remember my door is always open.",
    time: "11:38 PM",
    ticks: "delivered",
    highlight: true,
    delay: 1600,
  },
  // Dad rings for seven seconds. Nobody picks up.
  {
    type: "call",
    name: "Dad",
    time: "11:40 PM",
    duration: 7000,
    delay: 2400,
  },
  {
    type: "chat",
    name: "Mom",
    preview: "Proud of you ❤️",
    time: "11:41 PM",
    ticks: "delivered",
    highlight: true,
    delay: 2600,
  },
];

/* 10 — Then... her phone vibrates one final time. */
const scene10Lockscreen: LockscreenEvent[] = [
  {
    type: "notification",
    id: "final",
    app: "message",
    from: "THE CREW 🔥",
    preview: "Guys... Can I tell you something?",
    icon: "/apple.png",
    delay: 3000,
  },
  {
    type: "status",
    targetNotificationId: "final",
    status: "read",
    delay: 3000,
  },
];

/* 11 — Phones come out. Some cry. Some record. Some post. */
const scene11Tiktok: TikTokEvent[] = [
  { type: "caption", text: "RIP Maya 💔" },
  { type: "caption", text: "Gone too soon." },
  { type: "caption", text: "Check on your friends." },
  {
    type: "comment",
    author: "classmate1",
    text: "Still can't believe this.",
    delay: 2000,
  },
  {
    type: "comment",
    author: "classmate2",
    text: "We miss you every day.",
    delay: 2000,
  },
  {
    type: "comment",
    author: "classmate3",
    text: "She was always smiling 💔",
    delay: 2000,
  },
  { type: "likes", target: 12400, duration: 6000 },
];

/* 12 — The chat sits in dead silence. */
const scene12Whatsapp: ChatEvent[] = [
  {
    type: "message",
    id: "s12-1",
    sender: "Maya",
    text: "Guys... Can I tell you something?",
    time: "11:43 PM",
    delay: 1500,
  },
  {
    type: "message",
    id: "s12-2",
    sender: "Kevin",
    text: "😂😂😂",
    time: "11:43 PM",
    delay: 2200,
  },
  {
    type: "message",
    id: "s12-3",
    sender: "Jay",
    text: "Who's bringing soda?",
    time: "11:43 PM",
    delay: 2000,
  },
  {
    type: "message",
    id: "s12-4",
    sender: "Tash",
    text: "Tomorrow uniform or tracksuit?",
    time: "11:44 PM",
    delay: 2200,
  },
  // Leo types... Deleted.
  { type: "typing", sender: "Leo", duration: 4500 },
];


/* 13 — Hundreds of desperate, unsent drafts scroll rapidly up the screen,
 * slowing to linger on the very last entry. */
const scene13Notes: NotesEvent[] = [
  {
    type: "drafts",
    duration: 56000,
    items: [
      "I keep smiling so nobody asks.",
      "Everyone thinks I'm the fun one.",
      "I deleted it again.",
      "Nobody replied.",
      "Maybe I'm too much.",
      "Maybe I'm not enough.",
      "I typed it four times tonight.",
      "They were laughing at a cat.",
      "I'm scared.",
      "I'm tired.",
      "I don't know who I am anymore.",
      "I don't want to disappoint anyone.",
      "I wish somebody would notice that I'm pretending.",
      "If you're reading this...",
      "it means I finally stopped pretending.",
    ],
  },
  { type: "pause", duration: 6000 },
];

export const scenesSample: Scene[] = [
  {
    id: "scene-1",
    statusTime: "13:05",
    appType: "whatsapp",
    label: "1 · THE CREW — BEST CLASS EVER (Maya sends only 😊)",
    chatName: "THE CREW 🔥",
    events: scene1Whatsapp,
  },
  {
    id: "scene-2",
    statusTime: "20:02",
    appType: "whatsapp",
    label: "2 · THE CREW — party Saturday + memes",
    chatName: "THE CREW 🔥",
    events: scene2Whatsapp,
  },
  {
    id: "scene-3",
    statusTime: "23:43",
    statusDate: "Sun 19",
    appType: "lockscreen",
    label: "3 · Act One close — READ 11:43 PM",
    events: scene3Lockscreen,
  },
  {
    id: "scene-4",
    statusTime: "21:15",
    appType: "tiktok",
    label: "4 · TikTok — 100… 300… 800 likes",
    username: "maya.k",
    video: "/maya.mp4",
    events: scene4Tiktok,
  },
  {
    id: "scene-5",
    statusTime: "23:31",
    appType: "notes",
    label: "5 · Notes — the secret account",
    dark: true,
    notes: mayaNotes,
    noteTitle: "private",
    noteDate: "19 July 2026 at 23:31",
    events: scene5Notes,
  },
  {
    id: "scene-6",
    statusTime: "23:35",
    appType: "whatsapp",
    label: "6 · Maya types it, never sends",
    chatName: "THE CREW 🔥",
    events: scene6Whatsapp,
  },
  {
    id: "scene-7",
    statusTime: "13:12",
    appType: "whatsapp",
    label: "7 · THE CREW — You're famous MAYA!",
    chatName: "THE CREW 🔥",
    textScale: 1.3,
    events: scene7Whatsapp,
  },
  {
    id: "scene-8",
    statusTime: "23:31",
    appType: "whatsapp",
    label: "8 · The pivotal night chat (11:31 → 11:43 PM)",
    chatName: "THE CREW 🔥",
    events: scene8Whatsapp,
  },
  {
    id: "scene-9",
    statusTime: "23:41",
    appType: "chatlist",
    label: "9 · Ms. Mwangi, Dad, Mom — delivered, never opened",
    pinned: {
      name: "THE CREW 🔥",
      preview: "Tash: 😂😂😂😂😂😂",
      time: "8:11 PM",
    },
    events: scene9ChatList,
  },
  {
    id: "scene-10",
    statusTime: "23:43",
    statusDate: "Sun 19",
    appType: "lockscreen",
    label: "10 · One final vibrate — READ 11:43 PM",
    events: scene10Lockscreen,
  },
  {
    id: "scene-11",
    statusTime: "16:20",
    appType: "tiktok",
    label: "11 · Aftermath — RIP Maya 💔",
    username: "school.memories",
    events: scene11Tiktok,
  },
  {
    id: "scene-12",
    statusTime: "23:44",
    appType: "whatsapp",
    label: "12 · The chat sits in dead silence (flashback)",
    chatName: "THE CREW 🔥",
    instant: true,
    // The room reads the whole chat, then the view closes in on the one
    // message that mattered and names when she was last seen.
    focus: {
      messageId: "s12-1",
      label: "Last seen yesterday",
      delay: 3000,
    },
    events: scene12Whatsapp,
  },
  {
    id: "scene-13",
    statusTime: "23:43",
    appType: "notes",
    label: "13 · Notes — the unsent drafts",
    dark: true,
    notes: mayaNotes,
    noteTitle: "drafts",
    noteDate: "19 July 2026 at 23:43",
    events: scene13Notes,
  },
];
