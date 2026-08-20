"use client";

import { useMemo } from "react";
import type { ChatEvent, ChatListItem } from "@/types/chat";
import type { FocusBeat, InspectBeat } from "@/types/scene";
import ChatPanel from "@/components/ChatPanel";
import { buildSenderColors, GROUP_AVATAR } from "@/lib/sender-colors";

export type WhatsAppScreenProps = {
  events: ChatEvent[];
  chatName: string;
  /** Whose phone this is — their messages render outgoing. */
  selfName?: string;
  /** Flashback: show the whole conversation at once, nothing plays out. */
  instant?: boolean;
  /** Line under the chat name, e.g. a member's last-seen. */
  headerStatus?: string;
  /** Halt playback where it stands — the curtain is shut. */
  paused?: boolean;
  /** Scales the message column — text and bubbles together. */
  textScale?: number;
  /** Timestamp shown at the end of the draft in the message box. */
  composerTime?: string;
  /** Key clicks as she types. On unless the scene turns them off. */
  keySound?: boolean;
  /** Push in on one message once the scene has settled. */
  focus?: FocusBeat;
  /** Pointer walks in, holds the message and opens Message info. */
  inspect?: InspectBeat;
  autoStart?: boolean;
  /** Called once when the script has played to the end. */
  onFinished?: () => void;
};

/**
 * The existing WhatsApp chat panel, driven by a scene's events. Behavior is
 * identical to the standalone simulator — this is just the panel with a chat
 * derived from the scene instead of the sidebar selection.
 */
export default function WhatsAppScreen({
  events,
  chatName,
  selfName = "Maya",
  instant = false,
  headerStatus,
  paused = false,
  textScale,
  composerTime,
  keySound,
  focus,
  inspect,
  autoStart = false,
  onFinished,
}: WhatsAppScreenProps) {
  const senders = useMemo(
    () =>
      events.flatMap((event) => (event.type === "delete" ? [] : [event.sender])),
    [events],
  );

  // Two or more distinct senders other than the phone's owner = group chat.
  const isGroup = useMemo(
    () =>
      new Set(
        senders.filter((sender) => sender !== "me" && sender !== selfName),
      ).size > 1,
    [senders, selfName],
  );

  const chat = useMemo<ChatListItem>(
    () => ({
      id: chatName,
      name: chatName,
      avatarColor: "#5f7f8c",
      avatarImage: isGroup ? GROUP_AVATAR : undefined,
      lastMessage: "",
      time: "",
      isGroup,
    }),
    [chatName, isGroup],
  );

  const senderColors = useMemo(() => buildSenderColors(senders), [senders]);

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden text-[#111b21]">
      <ChatPanel
        chat={chat}
        script={events}
        senderColors={senderColors}
        autoStart={autoStart}
        selfName={selfName}
        instant={instant}
        headerStatus={headerStatus}
        paused={paused}
        textScale={textScale}
        composerTime={composerTime}
        keySound={keySound}
        focus={focus}
        inspect={inspect}
        onFinished={onFinished}
      />
    </div>
  );
}
