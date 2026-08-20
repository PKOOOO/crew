import type { ChatEvent } from "@/types/chat";
import type {
  ChatListEvent,
  InfoRow,
  NoteListItem,
  NotesEvent,
  Scene,
  TikTokEvent,
} from "@/types/scene";

/*
 * Running order, as set from /control:
 *   1  THE CREW — BEST CLASS EVER                  convo1
 *   2  THE CREW — party planning + memes           convo2
 *   3  the classroom drawing
 *   4  TITLE — READ 11:43 PM
 *   5  the funny TikTok — likes flood in           convo4
 *   6  the page in the bin — Auntie unfolds it
 *   7  Maya types, never sends                     convo5
 *   8  TITLE — READ 11:43 PM
 *   9  THE CREW interrupts — "You're famous"       convo6
 *   10 TITLE — READ 11:43 PM
 *   11 11:43 PM — Maya scrolls the feed
 *   12 TITLE — READ 11:43 PM
 *   13 the pivotal night chat                      convo7
 *   14 Ms. Mwangi / Dad / Mom — never opened       convo8
 *   15 TITLE — READ 11:43 PM
 *   16 aftermath — RIP Maya                        convo9
 *   17 the chat sits in dead silence (flashback)   convo10
 *   18 the unsent drafts                           convo11
 *   19 THE CREW — would you notice?
 *   20 Read by — all of them
 *
 * Benched: the secret account (Notes) — see benchedScenes at the foot.
 */

/* 1 — The group lights up about the school day. Everyone has something to
 * say. Except Maya: all she manages is 😊 */
const scene1Whatsapp: ChatEvent[] = [
  // Tash shouts first, then the photo lands on its own — the class picture
  // gets the screen to itself.
  {
    type: "message",
    id: "s1-1",
    sender: "Tash",
    text: "BEST CLASS EVER!❤️❤️❤️",
    time: "1:03 PM",
    delay: 2400,
  },
  {
    type: "message",
    id: "s1-1b",
    sender: "Tash",
    // No caption — the timestamp sits on the photo, the way WhatsApp does it.
    text: "",
    image: "/group.jpeg",
    // Sized before the scene's 2.2 zoom, so this lands at ~790px on screen.
    // It is 16:9 rather than the near-square it replaces, so it can be wider
    // without the card growing past a single screen.
    imageWidth: 360,
    time: "1:03 PM",
    delay: 2600,
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
    sender: "Kevina",
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
    sender: "Kevina",
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
    imageWidth: 200,
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
    sender: "Kevina",
    text: "",
    image: "/m2.webp",
    imageWidth: 200,
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
    imageWidth: 200,
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
    imageWidth: 200,
    time: "8:07 PM",
    delay: 1200,
  },
  {
    type: "message",
    id: "s2-5",
    sender: "Kevina",
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
    imageWidth: 200,
    time: "8:08 PM",
    delay: 1300,
  },
  {
    type: "message",
    id: "s2-m6",
    sender: "Kevina",
    text: "",
    image: "/m6.webp",
    imageWidth: 200,
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
    image: "/m7.webp",
    imageWidth: 200,
    time: "8:10 PM",
    delay: 1200,
  },
  {
    type: "message",
    id: "s2-m8",
    sender: "Jay",
    text: "",
    image: "/m1.webp",
    imageWidth: 200,
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

/* 3 — She nails the take. Uploads it. Within seconds: 100… 300… 800 likes. */
const scene3Tiktok: TikTokEvent[] = [
  { type: "likes", target: 100, duration: 2000 },

  // The whole school adoring the version of her that is performing.
  {
    type: "comment",
    author: "jay_official",
    text: "You're hilarious!",
    delay: 1500,
  },
  { type: "comment", author: "aisha.w", text: "SCREAMING 😭😭", delay: 1300 },
  { type: "comment", author: "nia_x", text: "not the hairbrush 💀", delay: 1400 },
  {
    type: "comment",
    author: "daisy.mwende",
    text: "this is so me fr 😭",
    delay: 1300,
  },
  {
    type: "comment",
    author: "brian.o",
    text: "do it again do it again",
    delay: 1400,
  },

  { type: "likes", target: 300, duration: 2200 },

  {
    type: "comment",
    author: "tash.k",
    text: "I wish I had your life.",
    delay: 1500,
  },
  {
    type: "comment",
    author: "ryan_254",
    text: "how are you always this funny 😂",
    delay: 1300,
  },
  { type: "comment", author: "leo.m", text: "😂😂", delay: 1200 },
  {
    type: "comment",
    author: "shantel.a",
    text: "the way she NAILED it",
    delay: 1400,
  },
  {
    type: "comment",
    author: "mo_kim",
    text: "posting this on my story 🔥",
    delay: 1300,
  },
  {
    type: "comment",
    author: "wanjiku_",
    text: "okay but the timing 😭",
    delay: 1300,
  },
  {
    type: "comment",
    author: "val.otieno",
    text: "she's never had a bad day 😭",
    delay: 1400,
  },

  { type: "likes", target: 800, duration: 2600 },

  { type: "comment", author: "kevina_m", text: "Queen!", delay: 1500 },
  { type: "comment", author: "sam.254", text: "MAYA FOR PRESIDENT", delay: 1300 },
  {
    type: "comment",
    author: "trizah.b",
    text: "she really is the moment ✨",
    delay: 1300,
  },
  { type: "comment", author: "amani_k", text: "my comfort account 🫶", delay: 1400 },
  {
    type: "comment",
    author: "joy.wambui",
    text: "wish I was this confident",
    delay: 1300,
  },
  { type: "comment", author: "dan.mk", text: "replayed this 12 times", delay: 1400 },
  {
    type: "comment",
    author: "kev.otis",
    text: "living her best life 🔥🔥",
    delay: 1300,
  },
  {
    type: "comment",
    author: "cynthia.a",
    text: "the happiest girl in school 😭❤️",
    delay: 1500,
  },
];

/* 4 — A secret account. No profile picture. No followers. This is where
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

const scene4Notes: NotesEvent[] = [
  { type: "list", duration: 3200 },
  { type: "open", title: "Maya's Diary", date: "19 July 2026 at 11:31 PM" },
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
  // The party chat is still sitting there from earlier in the evening —
  // already on screen, nothing lands live. The scene opens on it and crawls
  // down through it before she touches the keyboard.
  {
    type: "message",
    id: "s7-1",
    sender: "Jay",
    text: "Party Saturday!",
    time: "8:02 PM",
    settled: true,
    delay: 0,
  },
  {
    type: "message",
    id: "s7-2",
    sender: "Tash",
    text: "Maya's place!!",
    time: "8:03 PM",
    settled: true,
    delay: 0,
  },
  {
    type: "message",
    id: "s7-3",
    sender: "Kevina",
    text: "Parents rich rich 😂",
    time: "8:03 PM",
    settled: true,
    delay: 0,
  },
  {
    type: "message",
    id: "s7-4",
    sender: "Aisha",
    text: "",
    image: "/m3.webp",
    imageWidth: 340,
    time: "8:06 PM",
    settled: true,
    delay: 0,
  },
  {
    type: "message",
    id: "s7-5",
    sender: "Kevina",
    text: "🔥🔥🔥🔥🔥",
    time: "8:07 PM",
    settled: true,
    delay: 0,
  },
  {
    type: "message",
    id: "s7-6",
    sender: "Tash",
    text: "",
    image: "/m5.webp",
    imageWidth: 340,
    time: "8:08 PM",
    settled: true,
    delay: 0,
  },
  {
    type: "message",
    id: "s7-7",
    sender: "Jay",
    text: "",
    image: "/m1.webp",
    imageWidth: 340,
    time: "8:10 PM",
    settled: true,
    delay: 0,
  },
  {
    type: "message",
    id: "s7-8",
    sender: "Tash",
    text: "😂😂😂😂😂😂",
    time: "8:11 PM",
    settled: true,
    delay: 0,
  },

  // Nothing but the crawl to begin with. An empty draft is the engine's way
  // of simply holding — and it is paced like every other wait, so this is
  // about 3.5 seconds on screen.
  { type: "typing", sender: "Maya", duration: 2300, draft: "" },

  // Then she writes it, and it stays in the box.
  {
    type: "typing",
    sender: "Maya",
    duration: 9000,
    draft: "Guys... can I tell you something?",
    keepDraft: true,
  },

  // She looks at it. This is where the view closes in on the 11:30 PM.
  { type: "typing", sender: "Maya", duration: 3500, draft: "" },

  // And takes it back, one letter at a time, in close-up.
  {
    type: "typing",
    sender: "Maya",
    duration: 4200,
    draft: "Guys... can I tell you something?",
    erase: true,
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
    sender: "Kevina",
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

/* 8 — 11:43 PM. The room goes dark and the only light is phone screens.
 * On the projector: Maya thumbing back through the feed. The party, the
 * class, herself laughing. Everyone looks happy.
 *
 * NOTE: the clips are placeholders — every swipe below points at /maya.mp4
 * until the real footage lands. Swap the `video` paths and nothing else
 * needs to change. */
const scene8Tiktok: TikTokEvent[] = [
  /*
   * Nothing loops: each clip plays once and the next post scrolls in as it
   * ends. Every post has its own song, and every clip but the last runs at
   * half speed — the songs are untouched by that and play at their proper
   * tempo, so the pictures drift while the music carries on as normal. The
   * holds are each clip's slowed length plus a breath.
   */
  {
    type: "swipe",
    video: "/vid1.mp4",
    audio: "/song1.mp3",
    rate: 0.5,
    username: "maya.k",
    caption: "when the teacher says pop quiz 😭😭",
    likes: 812,
    duration: 13700,
  },
  {
    type: "swipe",
    video: "/vid2.mp4",
    audio: "/song2.mp3",
    rate: 0.5,
    username: "tash.k",
    caption: "BEST CLASS EVER!! ❤️❤️",
    likes: 1240,
    duration: 13400,
  },
  {
    type: "swipe",
    video: "/vid3.mp4",
    audio: "/song3.mp3",
    rate: 0.5,
    username: "jay_official",
    caption: "party at Maya's 🎉🎉",
    likes: 2430,
    duration: 12200,
  },
  {
    type: "swipe",
    video: "/vid4.mp4",
    audio: "/song4.mp3",
    rate: 0.5,
    username: "nia_x",
    caption: "us 😂😂",
    likes: 640,
    duration: 5700,
  },
  // The last one runs at speed, and carries its own sound — no song over the
  // top of it. She stops scrolling and just watches.
  {
    type: "swipe",
    video: "/party.mp4",
    username: "maya.k",
    caption: "still my favourite ❤️",
    likes: 1890,
    duration: 12000,
  },
];

/* 9 — The pivotal night chat, 11:31 PM → 11:43 PM. */
const scene9Whatsapp: ChatEvent[] = [
  {
    type: "message",
    id: "s8-1",
    sender: "Kevina",
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

  // Maya typing… Maya typing… Maya typing… The view closes in on the box for
  // all three drafts and only pulls back out once she has finally sent
  // something — the audience watches her write, then sees where it landed.
  {
    type: "typing",
    sender: "Maya",
    duration: 5000,
    draft: "Guys...",
    zoom: true,
  },
  {
    type: "typing",
    sender: "Maya",
    duration: 6500,
    draft: "Can somebody talk to me?",
    zoom: true,
  },
  {
    type: "typing",
    sender: "Maya",
    duration: 4500,
    draft: "I'm not okay.",
    zoom: true,
  },

  // Finally… 11:43 PM
  {
    type: "message",
    id: "s8-5",
    sender: "Maya",
    text: "Guys... Can I tell you something?",
    time: "11:43 PM",
    delay: 2000,
  },

  // Silence. Three dots appear. Someone is typing. Kevina sends… a meme.
  { type: "typing", sender: "Kevina", duration: 3500 },
  {
    type: "message",
    id: "s8-6",
    sender: "Kevina",
    text: "",
    image: "/cat.gif",
    // Set before the scene's zoom so the cat lands ~440px wide instead of
    // bursting the bubble.
    imageWidth: 200,
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
    sender: "Kevina",
    text: "😂😂😂😂😂",
    time: "11:44 PM",
    delay: 1200,
  },

  // Leo is online. He types... he even sends it... then takes it back.
  { type: "typing", sender: "Leo", duration: 2500 },
  {
    type: "message",
    id: "s8-10",
    sender: "Leo",
    text: "Maya you good?",
    time: "11:44 PM",
    delay: 800,
  },
  { type: "delete", targetId: "s8-10", delay: 1800 },
];

/* 10 — Delivered. Never opened. */
const scene10ChatList: ChatListEvent[] = [
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

/* 12 — Phones come out. Some cry. Some record. Some post. */
const scene12Tiktok: TikTokEvent[] = [
  { type: "caption", text: "RIP Maya 💔" },
  { type: "caption", text: "Gone too soon." },
  { type: "caption", text: "Check on your friends." },
  { type: "likes", target: 2800, duration: 3000 },

  // The crew posting their grief in public, in the same voice they used to
  // post everything else. Only Leo's says anything true.
  {
    type: "comment",
    author: "jay_official",
    text: "Nooo 💔💔💔",
    delay: 2600,
  },
  { type: "comment", author: "tash.k", text: "RIP angel 🕊️", delay: 2400 },
  {
    type: "comment",
    author: "kevina_m",
    text: "She was always smiling 💔",
    delay: 2600,
  },
  {
    type: "comment",
    author: "aisha.w",
    text: "I can't stop crying 😭😭",
    delay: 2200,
  },
  {
    type: "comment",
    author: "daisy.mwende",
    text: "This can't be real 💔",
    delay: 2400,
  },
  { type: "comment", author: "nia_x", text: "Gone too soon 🕊️", delay: 2200 },
  {
    type: "comment",
    author: "ryan_254",
    text: "Check on your friends people 🙏",
    delay: 2600,
  },
  {
    type: "comment",
    author: "brian.o",
    text: "We love you Maya ❤️",
    delay: 2400,
  },
  {
    type: "comment",
    author: "shantel.a",
    text: "She didn't deserve this 😭",
    delay: 2200,
  },
  {
    type: "comment",
    author: "mo_kim",
    text: "Fly high queen 🕊️🕊️",
    delay: 2400,
  },
  {
    type: "comment",
    author: "val.otieno",
    text: "Rest well Maya 💔",
    delay: 2200,
  },
  {
    type: "comment",
    author: "cynthia.w",
    text: "I saw her yesterday. She looked fine 💔",
    delay: 2400,
  },
  {
    type: "comment",
    author: "tash.k",
    text: "Why didn't she say anything 😭",
    delay: 2200,
  },
  {
    type: "comment",
    author: "denno_254",
    text: "School will never be the same 🕊️",
    delay: 2400,
  },
  {
    type: "comment",
    author: "jay_official",
    text: "I keep waiting for her to text back",
    delay: 2600,
  },
  {
    type: "comment",
    author: "wanjiru.a",
    text: "Rest in peace beautiful soul 🕯️",
    delay: 2200,
  },
  {
    type: "comment",
    author: "kevina_m",
    text: "We were literally just laughing 💔",
    delay: 2600,
  },

  // The one that isn't performance.
  { type: "comment", author: "leo.m", text: "I'm sorry.", delay: 4500 },

  { type: "likes", target: 12400, duration: 6000 },
];

/* 13 — The chat sits in dead silence. */
const scene13Whatsapp: ChatEvent[] = [
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
    sender: "Kevina",
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
  // Leo typed something, sent it, took it back. All that is left of the one
  // person who noticed is the greyed-out box.
  { type: "typing", sender: "Leo", duration: 4500 },
  {
    type: "message",
    id: "s12-5",
    sender: "Leo",
    text: "Maya you good?",
    time: "11:44 PM",
    delay: 1200,
  },
  { type: "delete", targetId: "s12-5", delay: 1500 },
];


/* 14 — The same group, hours later. The last thing anyone said is still
 * sitting there and nobody has spoken since. Then Leo — the one who typed it
 * and took it back — starts typing again. This time he sends it. */
const scene14Whatsapp: ChatEvent[] = [
  // Already on screen: exactly where the conversation died.
  {
    type: "message",
    id: "s14-1",
    sender: "Tash",
    text: "Tomorrow uniform or tracksuit?",
    time: "11:44 PM",
    settled: true,
    delay: 0,
  },
  {
    type: "message",
    id: "s14-2",
    sender: "Leo",
    text: "Maya you good?",
    time: "11:44 PM",
    settled: true,
    delay: 0,
  },
  { type: "delete", targetId: "s14-2", delay: 0 },

  // Tash typing… about three seconds of it, all told: this beat plus the
  // second and a half of dots the engine always puts in front of an incoming
  // message. The delay below is 0 so the two run together as one.
  { type: "typing", sender: "Tash", duration: 1000 },
  {
    type: "message",
    id: "s14-3",
    sender: "Tash",
    text: "If your friend suddenly went silent today... Would you notice?",
    time: "7:12 AM",
    delay: 0,
  },
];

/* 15 — Hundreds of desperate, unsent drafts scroll rapidly up the screen,
 * slowing to linger on the very last entry. */
const scene15Notes: NotesEvent[] = [
  {
    type: "drafts",
    // Bigger type means more distance to travel, so the duration goes up with
    // it — otherwise the same 56s would read as a faster crawl.
    duration: 70000,
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

/**
 * The play's title, flashed on black. It recurs through the show, so it is
 * built here rather than written out five times.
 */
function titleCard(id: string, position: number): Scene {
  return {
    id,
    appType: "flash",
    label: `${position} · TITLE — READ 11:43 PM`,
    text: "READ 11:43 PM",
    // A long beat of black first, then it holds, so the house can sit in it.
    delay: 2000,
    size: 190,
    hold: 9000,
  };
}

/**
 * Every one of them opened it, and every one of them opened it at the same
 * minute. Shared by the beat inside the flashback and by the closing scene
 * that shows nothing else.
 */
const crewReadMayasMessage: InfoRow[] = [
  { name: "Tash", time: "READ 11:43 PM" },
  { name: "Jay", time: "READ 11:43 PM" },
  { name: "Kevina", time: "READ 11:43 PM" },
  { name: "Aisha", time: "READ 11:43 PM" },
  { name: "Nia", time: "READ 11:43 PM" },
  { name: "Brian", time: "READ 11:43 PM" },
  { name: "Leo", time: "READ 11:43 PM" },
];

export const scenesSample: Scene[] = [
  {
    id: "scene-1",
    statusTime: "1:05 PM",
    appType: "whatsapp",
    label: "1 · THE CREW — BEST CLASS EVER (Maya sends only 😊)",
    chatName: "THE CREW 🔥",
    // Two cards fill the screen at a time; each new one scrolls the oldest
    // off the top.
    textScale: 2.2,
    events: scene1Whatsapp,
  },
  {
    id: "scene-2",
    statusTime: "8:02 PM",
    appType: "whatsapp",
    label: "2 · THE CREW — party Saturday + memes",
    chatName: "THE CREW 🔥",
    // Same treatment as scene 1 — two cards fill the screen at a time. The
    // stickers carry their own imageWidth so the zoom doesn't blow them past
    // the bubble's max-width.
    textScale: 2.2,
    events: scene2Whatsapp,
  },
  {
    id: "scene-drawing",
    // A drawing, not a phone — no status bar, no clock.
    appType: "image",
    label: "3 · The classroom drawing — DON'T FORGET TO SMILE",
    src: "/drawing.jpeg",
    // Edge to edge — the drawing takes the whole screen rather than sitting
    // inside a black border.
    fill: true,
    delay: 2000,
    hold: 12000,
  },
  titleCard("title-1", 4),
  {
    id: "scene-3",
    statusTime: "9:15 PM",
    appType: "tiktok",
    label: "5 · TikTok — 100… 300… 800 likes",
    username: "maya.k",
    // No pops here — the video carries its own sound.
    likesSound: "",
    reactions: ["❤️", "🔥", "😍", "❤️", "🔥", "💖"],
    // One at a time, as in the aftermath: each comment holds the screen alone
    // until the next grows in and eases it away.
    maxComments: 1,
    commentScale: 1.4,
    video: "/maya.mp4",
    events: scene3Tiktok,
  },
  {
    id: "scene-5",
    appType: "flash",
    label: "6 · The page in the bin — Auntie unfolds it",
    text: "I don't know how much longer I can pretend.",
  },
  {
    id: "scene-6",
    // Matches the 11:30 PM sitting at the end of her draft.
    statusTime: "11:30 PM",
    appType: "whatsapp",
    label: "7 · Maya types it, never sends",
    chatName: "THE CREW 🔥",
    // Nothing is ever sent, so the hour has nowhere else to appear: it sits
    // at the end of what she wrote.
    composerTime: "11:30 PM",
    // No key clicks here. The room watches her write in silence.
    keySound: false,
    // First the old party chat crawls past, quickly — then the beat closes in
    // on the message box, the room watches the words appear in close-up, and
    // the view goes the rest of the way in on the 11:30, which glows. The
    // letters are then taken away inside that close-up.
    focus: {
      // Opens on Tash's meme rather than the top of the chat.
      scrollFrom: "s7-6",
      scrollDelay: 400,
      scrollMs: 2600,
      delay: 500,
      maxScale: 1.9,
      timeDelay: 1600,
      timeScale: 3.4,
    },
    events: scene6Whatsapp,
  },
  titleCard("title-2", 8),
  {
    id: "scene-7",
    statusTime: "1:12 PM",
    appType: "whatsapp",
    label: "9 · THE CREW — You're famous MAYA!",
    chatName: "THE CREW 🔥",
    // Big enough that only two cards fit the screen at once: Jay and Kevina
    // fill it, then Tash's arrival scrolls Jay off the top.
    textScale: 2.2,
    events: scene7Whatsapp,
  },
  titleCard("title-3", 10),
  {
    id: "scene-8",
    statusTime: "11:43 PM",
    appType: "tiktok",
    label: "11 · 11:43 PM — Maya scrolls the feed",
    username: "maya.k",
    // Each post brings its own song, set on the swipe events themselves.
    video: "/vid1.mp4",
    events: scene8Tiktok,
  },
  titleCard("title-4", 12),
  {
    id: "scene-9",
    statusTime: "11:31 PM",
    appType: "whatsapp",
    label: "13 · The pivotal night chat (11:31 → 11:43 PM)",
    chatName: "THE CREW 🔥",
    // Two cards at a time, so Maya's line and the meme that answers it can't
    // share the screen with anything else.
    textScale: 2.2,
    events: scene9Whatsapp,
  },
  {
    id: "scene-10",
    statusTime: "11:41 PM",
    appType: "chatlist",
    label: "14 · Ms. Mwangi, Dad, Mom — delivered, never opened",
    pinned: {
      name: "THE CREW 🔥",
      preview: "Tash: 😂😂😂😂😂😂",
      time: "8:11 PM",
    },
    events: scene10ChatList,
  },
  titleCard("title-5", 15),
  {
    id: "scene-12",
    statusTime: "4:20 PM",
    appType: "tiktok",
    label: "16 · Aftermath — RIP Maya 💔",
    username: "school.memories",
    // Their photos of her, scrolling past on a loop for as long as the scene
    // is held — the same pictures the school will keep posting.
    photos: [
      "/rip1.jpeg",
      "/rip2.jpeg",
      "/rip3.jpeg",
      "/rip4.jpeg",
      "/rip5.jpeg",
      "/rip6.jpeg",
    ],
    photoMs: 4500,
    // The counter still climbs, but silently — nothing pops over the grief.
    likesSound: "",
    // One at a time: each comment holds the screen alone until the next
    // arrives and eases it away.
    maxComments: 1,
    commentScale: 1.4,
    events: scene12Tiktok,
  },
  {
    id: "scene-13",
    statusTime: "11:44 PM",
    appType: "whatsapp",
    label: "17 · The chat sits in dead silence (flashback)",
    chatName: "THE CREW 🔥",
    instant: true,
    // Same size as the rest of the WhatsApp scenes. The read-through has more
    // ground to cover at this scale, so it is given longer below.
    textScale: 2.2,
    // The chat holds at the top, crawls past so every message is read — Leo's
    // deleted box last of all — then the view closes in on the one message
    // that mattered.
    focus: {
      messageId: "s12-1",
      // No words beside the time, and no pulse on it either — the push-in is
      // the emphasis.
      scrollDelay: 2000,
      scrollMs: 11000,
      delay: 800,
    },
    // Then the pointer walks in, holds her message and opens Message info.
    // Every one of them read it. Not one of them answered.
    inspect: {
      // Straight in behind the push-in — the pointer is the next beat, not a
      // separate one.
      delay: 350,
      // The names are big enough that only two share the screen, so the list
      // is crawled from the message down — about three seconds a name.
      scrollMs: 17000,
      readBy: crewReadMayasMessage,
    },
    events: scene13Whatsapp,
  },
  {
    id: "scene-15",
    statusTime: "11:43 PM",
    appType: "notes",
    label: "18 · Notes — the unsent drafts",
    dark: true,
    notes: mayaNotes,
    noteTitle: "Maya's Diary",
    noteDate: "19 July 2026 at 11:43 PM",
    events: scene15Notes,
  },
  {
    id: "scene-14",
    statusTime: "7:12 AM",
    appType: "whatsapp",
    label: "19 · THE CREW — would you notice?",
    chatName: "THE CREW 🔥",
    // As big as the rest of the WhatsApp scenes.
    textScale: 2.2,
    events: scene14Whatsapp,
  },
  {
    id: "scene-readby",
    statusTime: "11:43 PM",
    appType: "readby",
    label: "20 · Read by — all of them",
    text: "Guys... Can I tell you something?",
    timestamp: "11:43 PM",
    readBy: crewReadMayasMessage,
    // Down, up, down, up — the same names and the same line, twice over.
    scrollMs: 15000,
    sweeps: 4,
  },
];

/**
 * Built, but not in the running order. Kept here so the scene isn't lost —
 * splice it back into scenesSample to put it on stage.
 */
export const benchedScenes: Scene[] = [
  {
    id: "scene-4",
    statusTime: "11:31 PM",
    appType: "notes",
    label: "Notes — the secret account",
    dark: true,
    notes: mayaNotes,
    noteTitle: "private",
    noteDate: "19 July 2026 at 11:31 PM",
    events: scene4Notes,
  },
];
