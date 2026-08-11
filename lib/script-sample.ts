import type { ChatEvent } from "@/types/chat";

/**
 * Fictional placeholder scripts only — content is drawn from the show's
 * "THE CREW" script or invented for UI testing. Never seed this file from
 * real conversations or screenshots.
 */

/** 4-person group: several distinct non-"me" senders typing and messaging. */
export const groupScriptSample: ChatEvent[] = [
  {
    type: "message",
    id: "g1",
    sender: "Jay",
    text: "Party Saturday!",
    delay: 800,
  },
  { type: "typing", sender: "Tash", duration: 1400 },
  {
    type: "message",
    id: "g2",
    sender: "Tash",
    text: "Maya's place!!",
    delay: 900,
  },
  {
    type: "message",
    id: "g3",
    sender: "Kevin",
    text: "Parents rich rich 😂",
    delay: 1200,
  },
  {
    type: "message",
    id: "g4",
    sender: "Jay",
    text: "🔥🔥🔥🔥🔥",
    delay: 1000,
  },
  {
    type: "message",
    id: "g5",
    sender: "me",
    text: "count me in 😄",
    delay: 1300,
  },
  { type: "typing", sender: "Aisha", duration: 1600 },
  {
    type: "message",
    id: "g6",
    sender: "Aisha",
    text: "🎤 voice note incoming",
    delay: 700,
  },
  {
    type: "message",
    id: "g7",
    sender: "Kevin",
    text: "bring the speaker like last time 😂",
    delay: 1100,
  },
  { type: "delete", targetId: "g7", delay: 2000 },
  {
    type: "message",
    id: "g8",
    sender: "Jay",
    text: "ok it's settled, Saturday it is",
    delay: 1200,
  },
];

/** 1-on-1 chat with a single fictional contact. */
export const scriptSample: ChatEvent[] = [
  { type: "typing", sender: "Sam", duration: 1200 },
  {
    type: "message",
    id: "m1",
    sender: "Sam",
    text: "Hey, you around?",
    delay: 600,
  },
  {
    type: "message",
    id: "m2",
    sender: "me",
    text: "yeah just got home",
    delay: 900,
  },
  {
    type: "message",
    id: "m3",
    sender: "me",
    text: "long day, don't even ask 😂",
    delay: 1100,
  },
  {
    type: "message",
    id: "m4",
    sender: "me",
    text: "want to grab lunch tomorrow?",
    delay: 1400,
  },
  { type: "typing", sender: "Sam", duration: 1500 },
  {
    type: "message",
    id: "m5",
    sender: "Sam",
    text: "Sure, midday works",
    delay: 700,
  },
  {
    type: "message",
    id: "m6",
    sender: "me",
    text: "cool",
    delay: 1000,
  },
  {
    type: "message",
    id: "m7",
    sender: "me",
    text: "heading out now, meeting Alex first",
    delay: 1200,
  },
  { type: "delete", targetId: "m3", delay: 1800 },
  { type: "typing", sender: "Sam", duration: 1300 },
  {
    type: "message",
    id: "m8",
    sender: "Sam",
    text: "Ok",
    delay: 800,
  },
  {
    type: "message",
    id: "m9",
    sender: "Sam",
    text: "Bring the notes tomorrow please",
    delay: 1100,
  },
  {
    type: "message",
    id: "m10",
    sender: "me",
    text: "see you tomorrow",
    delay: 1500,
  },
];
