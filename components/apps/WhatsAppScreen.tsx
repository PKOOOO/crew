"use client";

import { useMemo } from "react";
import type { ChatEvent, ChatListItem } from "@/types/chat";
import ChatPanel from "@/components/ChatPanel";
import { buildSenderColors } from "@/lib/sender-colors";

export type WhatsAppScreenProps = {
  events: ChatEvent[];
  chatName: string;
  /** Whose phone this is — their messages render outgoing. */
  selfName?: string;
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
      lastMessage: "",
      time: "",
      isGroup,
    }),
    [chatName, isGroup],
  );

  const senderColors = useMemo(() => buildSenderColors(senders), [senders]);

  return (
    <div className="flex h-full min-h-0 w-full text-[#111b21]">
      <ChatPanel
        chat={chat}
        script={events}
        senderColors={senderColors}
        autoStart={autoStart}
        selfName={selfName}
        onFinished={onFinished}
      />
    </div>
  );
}
