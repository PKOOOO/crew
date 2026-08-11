import type { ChatEvent } from "@/types/chat";
import type {
  LockscreenEvent,
  NotesEvent,
  Scene,
  TikTokEvent,
} from "@/types/scene";

/*
 * NOTE ON ORDERING: this array follows the scene numbering as drafted, but the
 * photographed script pages are not necessarily in performance order (some are
 * alternate drafts of the same beat). Lock the final sequence against the full
 * printed script before the show — reordering here is all it takes.
 */

/** Scene 1 — WhatsApp: party hype, then the meme montage. */
const scene1Whatsapp: ChatEvent[] = [
  {
    type: "message",
    id: "s1-1",
    sender: "Jay",
    text: "Party Saturday!",
    delay: 1200,
  },
  {
    type: "message",
    id: "s1-2",
    sender: "Tash",
    text: "Maya's place!!",
    delay: 2000,
  },
  {
    type: "message",
    id: "s1-3",
    sender: "Kevin",
    text: "Parents rich rich 😂",
    delay: 2200,
  },

  // montage beat — hundreds of memes, voice notes, laughing emojis
  {
    type: "message",
    id: "s1-m1",
    sender: "Jay",
    text: "",
    image: "/m1.gif",
    delay: 1800,
  },
  {
    type: "message",
    id: "s1-m2",
    sender: "Kevin",
    text: "",
    image: "/m2.webp",
    delay: 1400,
  },
  {
    type: "message",
    id: "s1-4",
    sender: "Tash",
    text: "😂😂😂😂",
    delay: 1200,
  },
  {
    type: "message",
    id: "s1-m3",
    sender: "Aisha",
    text: "",
    image: "/m3.webp",
    delay: 1400,
  },
  {
    type: "message",
    id: "s1-m4",
    sender: "Jay",
    text: "",
    image: "/m4.gif",
    delay: 1300,
  },
  {
    type: "message",
    id: "s1-5",
    sender: "Kevin",
    text: "🔥🔥🔥🔥🔥",
    delay: 1200,
  },
  {
    type: "message",
    id: "s1-m5",
    sender: "Tash",
    text: "",
    image: "/m5.webp",
    delay: 1400,
  },
  {
    type: "message",
    id: "s1-m6",
    sender: "Kevin",
    text: "",
    image: "/m6.webp",
    delay: 1300,
  },
  {
    type: "message",
    id: "s1-6",
    sender: "Aisha",
    text: "🎤 voice note incoming",
    delay: 1400,
  },
  {
    type: "message",
    id: "s1-m7",
    sender: "Aisha",
    text: "",
    image: "/m7.gif",
    delay: 1400,
  },
  {
    type: "message",
    id: "s1-m8",
    sender: "Jay",
    text: "",
    image: "/m8.gif",
    delay: 1300,
  },
  {
    type: "message",
    id: "s1-7",
    sender: "Tash",
    text: "😂😂😂😂😂😂",
    delay: 1200,
  },
];

/** Scene 2 — TikTok: the party post. Maya hesitates, then posts only an emoji. */
const scene2Tiktok: TikTokEvent[] = [
  { type: "caption", text: "📸 BEST CLASS EVER!! ❤️❤️❤️❤️❤️" },
  { type: "comment", author: "jay_official", text: "You're hilarious!", delay: 1800 },
  { type: "comment", author: "tash.k", text: "I wish I had your life.", delay: 2200 },
  { type: "comment", author: "kevin_m", text: "Queen!", delay: 2000 },
  { type: "likes", target: 800, duration: 5000 },
  { type: "comment", author: "maya", text: "😊", delay: 4000 },
];

/** Scene 3 — WhatsApp: the pivotal night chat. */
const scene3Whatsapp: ChatEvent[] = [
  {
    type: "message",
    id: "s3-1",
    sender: "Kevin",
    text: "😂😂 Today's party was mad.",
    delay: 1500,
  },
  {
    type: "message",
    id: "s3-2",
    sender: "Jay",
    text: "Maya upload the videos!!",
    delay: 2000,
  },
  {
    type: "message",
    id: "s3-3",
    sender: "Aisha",
    text: "Send me the mirror selfies.",
    delay: 2200,
  },
  {
    type: "message",
    id: "s3-4",
    sender: "Tash",
    text: "Next weekend again!!",
    delay: 2600,
  },

  // Maya's repeated typing/deleting — bait typing events, no message
  { type: "typing", sender: "Maya", duration: 3500 },
  { type: "typing", sender: "Maya", duration: 3000 },
  { type: "typing", sender: "Maya", duration: 2500 },
  { type: "typing", sender: "Maya", duration: 5000 },

  // finally sends — 11:43 PM
  {
    type: "message",
    id: "s3-5",
    sender: "Maya",
    text: "Guys... Can I tell you something?",
    delay: 2000,
  },

  // Silence. Three dots appear. Kevin sends... a meme. Everyone reacts.
  { type: "typing", sender: "Kevin", duration: 3000 },
  {
    type: "message",
    id: "s3-6",
    sender: "Kevin",
    text: "",
    image: "/meme.png",
    delay: 1200,
  },
  {
    type: "message",
    id: "s3-7",
    sender: "Jay",
    text: "Bro look at this cat. 😂😂😂",
    delay: 1800,
  },
  {
    type: "message",
    id: "s3-8",
    sender: "Aisha",
    text: "😂😂😂",
    delay: 1500,
  },
  {
    type: "message",
    id: "s3-9",
    sender: "Kevin",
    text: "😂😂😂😂😂",
    delay: 1300,
  },

  // group moves on to unrelated topics
  {
    type: "message",
    id: "s3-10",
    sender: "Jay",
    text: "Who's bringing soda?",
    delay: 2000,
  },
  {
    type: "message",
    id: "s3-11",
    sender: "Tash",
    text: "Tomorrow uniform or tracksuit?",
    delay: 2200,
  },

  // Leo is online. He types... stops. Deletes.
  { type: "typing", sender: "Leo", duration: 3500 },
];

/** Scene 4 — Lockscreen: the silence after. */
const scene4Lockscreen: LockscreenEvent[] = [
  {
    type: "notification",
    app: "message",
    from: "Maya",
    preview: "Last seen yesterday at 11:43 PM",
    delay: 3000,
  },
];

/** Scene 5 — TikTok: the aftermath posts. */
const scene5Tiktok: TikTokEvent[] = [
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
    delay: 2200,
  },
  { type: "likes", target: 4200, duration: 5000 },
];

/*
 * Mr. Mwangi's message is deliberately NOT a WhatsApp scene: Maya never opens
 * it. It appears only as a lockscreen notification (delivered, never read).
 */

/** Scene 6 — Lockscreen: unread notifications piling up. */
const scene6Lockscreen: LockscreenEvent[] = [
  {
    type: "notification",
    id: "s6-1",
    app: "message",
    from: "Mr. Mwangi",
    preview: "Remember my door is always open.",
    delay: 1000,
  },
  {
    type: "status",
    targetNotificationId: "s6-1",
    status: "delivered",
    delay: 1500,
  },
  {
    type: "notification",
    app: "call",
    from: "Dad",
    preview: "Missed call",
    delay: 2000,
  },
  {
    type: "notification",
    id: "mom-msg",
    app: "message",
    from: "Mom",
    preview: "Proud of you ❤️",
    delay: 2500,
  },
  {
    type: "status",
    targetNotificationId: "mom-msg",
    status: "delivered",
    delay: 1000,
  },
];

/** Scene 7 — Notes: the secret account. No followers. This is where she writes. */
const scene7Notes: NotesEvent[] = [
  {
    type: "type",
    text: "Does anybody ever feel invisible in a room full of people?",
    charDelayMs: 90,
  },
  { type: "pause", duration: 2200 },
  { type: "delete", duration: 1000 },
  { type: "type", text: "I'm tired.", charDelayMs: 110 },
  { type: "pause", duration: 2000 },
  { type: "delete", duration: 600 },
  { type: "type", text: "If I disappeared...", charDelayMs: 110 },
  { type: "pause", duration: 2200 },
  { type: "delete", duration: 800 },
];

/** Scene 8 — WhatsApp: the near-miss. She types her draft; the others burst in. */
const scene8Whatsapp: ChatEvent[] = [
  // "Guys... can I tell you something?" — typed, never sent
  { type: "typing", sender: "Maya", duration: 5000 },
  {
    type: "message",
    id: "s8-1",
    sender: "Jay",
    text: "😂😂😂 You're famous MAYA!",
    delay: 1500,
  },
  {
    type: "message",
    id: "s8-2",
    sender: "Kevin",
    text: "Legendary style!",
    delay: 2000,
  },
  {
    type: "message",
    id: "s8-3",
    sender: "Tash",
    text: "We're at the cafeteria. Come!",
    delay: 2200,
  },
];

export const scenesSample: Scene[] = [
  {
    id: "scene-1",
    appType: "whatsapp",
    label: "1 · Group chat — party hype",
    chatName: "THE CREW",
    events: scene1Whatsapp,
  },
  {
    id: "scene-2",
    appType: "tiktok",
    label: "2 · TikTok — the party post",
    username: "maya.k",
    events: scene2Tiktok,
  },
  {
    id: "scene-3",
    appType: "whatsapp",
    label: "3 · Group chat — the pivotal night",
    chatName: "THE CREW",
    events: scene3Whatsapp,
  },
  {
    id: "scene-4",
    appType: "lockscreen",
    label: "4 · Lockscreen — the silence after",
    events: scene4Lockscreen,
  },
  {
    id: "scene-5",
    appType: "tiktok",
    label: "5 · TikTok — aftermath",
    username: "school.memories",
    events: scene5Tiktok,
  },
  {
    id: "scene-6",
    appType: "lockscreen",
    label: "6 · Lockscreen — Mwangi, Dad, Mom (all unread)",
    events: scene6Lockscreen,
  },
  {
    id: "scene-7",
    appType: "notes",
    label: "7 · Notes — the secret account",
    dark: true,
    events: scene7Notes,
  },
  {
    id: "scene-8",
    appType: "whatsapp",
    label: "8 · Group chat — the near-miss",
    chatName: "THE CREW",
    events: scene8Whatsapp,
  },
];
