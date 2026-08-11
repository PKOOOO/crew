"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import type {
  ChatEvent,
  ChatListItem as ChatListItemType,
  SavedScript,
} from "@/types/chat";
import { chatListSample } from "@/lib/chatlist-sample";
import { groupScriptSample, scriptSample } from "@/lib/script-sample";
import { buildSenderColors } from "@/lib/sender-colors";
import {
  deleteScript,
  getScripts,
  getServerScripts,
  saveScript,
  subscribeToScripts,
} from "@/lib/storage";
import ChatListItem from "@/components/ChatListItem";
import ChatPanel, { type VisibleMessage } from "@/components/ChatPanel";
import ScriptEditor from "@/components/ScriptEditor";
import {
  ArchiveIcon,
  AtIcon,
  Avatar,
  ChannelsIcon,
  ChatBubbleIcon,
  CommunitiesIcon,
  FlowerIcon,
  GalleryIcon,
  IconButton,
  MenuIcon,
  PhoneIcon,
  SearchIcon,
  StatusIcon,
} from "@/components/icons";

/** Which script plays for which sidebar chat. */
const scriptsByChatId: Record<string, ChatEvent[]> = {
  sam: scriptSample,
  "the-crew": groupScriptSample,
};

/** Live sidebar preview: last message text + time per chat. */
type ChatPreview = { lastMessage: string; time: string };

type WhatsAppWebProps = {
  chats?: ChatListItemType[];
  scripts?: Record<string, ChatEvent[]>;
  /** Sender name → name-label color. Derived from the script when omitted. */
  senderColors?: Record<string, string>;
  initialActiveChatId?: string;
};

const EMPTY_SCRIPT: ChatEvent[] = [];

/** Drops one key from a record, returning a new object. */
function omit<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

export default function WhatsAppWeb({
  chats = chatListSample,
  scripts = scriptsByChatId,
  senderColors,
  initialActiveChatId,
}: WhatsAppWebProps) {
  // Saved scripts drive the app when present; sample data is the fallback.
  const saved = useSyncExternalStore(
    subscribeToScripts,
    getScripts,
    getServerScripts,
  );

  const savedById = useMemo<Record<string, SavedScript>>(
    () => Object.fromEntries(saved.map((script) => [script.id, script])),
    [saved],
  );

  const baseChats = useMemo<ChatListItemType[]>(
    () => (saved.length ? saved.map((script) => script.chatListItem) : chats),
    [saved, chats],
  );

  // Unsaved editor edits, layered over whatever the base list provides.
  const [chatEdits, setChatEdits] = useState<Record<string, ChatListItemType>>(
    {},
  );
  const [scriptEdits, setScriptEdits] = useState<Record<string, ChatEvent[]>>(
    {},
  );

  const [activeChatId, setActiveChatId] = useState<string | undefined>(
    initialActiveChatId ?? chats[1]?.id ?? chats[0]?.id,
  );
  const [previews, setPreviews] = useState<Record<string, ChatPreview>>({});
  const [editorOpen, setEditorOpen] = useState(false);
  // Bumping this remounts ChatPanel, which returns it to its idle state.
  const [playNonce, setPlayNonce] = useState(0);
  const [autoStart, setAutoStart] = useState(false);
  const [cleared, setCleared] = useState(false);

  const chatList = useMemo<ChatListItemType[]>(
    () => baseChats.map((chat) => chatEdits[chat.id] ?? chat),
    [baseChats, chatEdits],
  );

  const activeChat =
    chatList.find((chat) => chat.id === activeChatId) ?? chatList[0];
  const activeId = activeChat?.id;

  const activeScript = useMemo<ChatEvent[]>(() => {
    if (!activeId) return EMPTY_SCRIPT;
    return (
      scriptEdits[activeId] ??
      savedById[activeId]?.events ??
      scripts[activeId] ??
      EMPTY_SCRIPT
    );
  }, [scriptEdits, savedById, scripts, activeId]);

  // "Reset" clears the transcript by playing nothing until the next "Play".
  const script = cleared ? EMPTY_SCRIPT : activeScript;

  const selectChat = useCallback((id: string) => {
    setActiveChatId(id);
    setCleared(false);
    setAutoStart(false);
    setPlayNonce((nonce) => nonce + 1);
  }, []);

  const handleChatChange = useCallback((updated: ChatListItemType) => {
    setChatEdits((previous) => ({ ...previous, [updated.id]: updated }));
  }, []);

  const handleScriptChange = useCallback(
    (updated: ChatEvent[]) => {
      if (!activeId) return;
      setScriptEdits((previous) => ({ ...previous, [activeId]: updated }));
    },
    [activeId],
  );

  const handlePlay = useCallback(() => {
    setCleared(false);
    setAutoStart(true);
    setPlayNonce((nonce) => nonce + 1);
  }, []);

  const handleReset = useCallback(() => {
    setCleared(true);
    setAutoStart(false);
    setPlayNonce((nonce) => nonce + 1);
  }, []);

  // One consistent color per non-"me" sender, in order of first appearance.
  const activeSenderColors = useMemo<Record<string, string>>(
    () =>
      senderColors ??
      (activeId ? savedById[activeId]?.senderColors : undefined) ??
      buildSenderColors(
        activeScript.flatMap((event) =>
          event.type === "delete" ? [] : [event.sender],
        ),
      ),
    [senderColors, activeScript, savedById, activeId],
  );

  const handleSave = useCallback(() => {
    if (!activeChat) return;
    saveScript({
      id: activeChat.id,
      name: activeChat.name,
      chatListItem: activeChat,
      events: activeScript,
      senderColors: activeSenderColors,
    });
    // The saved copy is now the source of truth for this chat.
    setChatEdits((previous) => omit(previous, activeChat.id));
    setScriptEdits((previous) => omit(previous, activeChat.id));
  }, [activeChat, activeScript, activeSenderColors]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteScript(id);
      setChatEdits((previous) => omit(previous, id));
      setScriptEdits((previous) => omit(previous, id));
      if (id === activeChatId) setActiveChatId(undefined);
    },
    [activeChatId],
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      const source =
        savedById[id] ??
        (activeChat && activeChat.id === id
          ? {
              id,
              name: activeChat.name,
              chatListItem: activeChat,
              events: activeScript,
              senderColors: activeSenderColors,
            }
          : undefined);
      if (!source) return;

      const copyId = `${source.id}-copy-${Date.now().toString(36)}`;
      const copyName = `${source.name} (copy)`;
      saveScript({
        ...source,
        id: copyId,
        name: copyName,
        chatListItem: { ...source.chatListItem, id: copyId, name: copyName },
        events: source.events.map((event) => ({ ...event })),
        senderColors: { ...source.senderColors },
      });
      setActiveChatId(copyId);
      setCleared(false);
      setAutoStart(false);
    },
    [savedById, activeChat, activeScript, activeSenderColors],
  );

  const handleMessage = useCallback(
    (message: VisibleMessage) => {
      if (!activeChatId) return;
      setPreviews((previous) => ({
        ...previous,
        [activeChatId]: {
          lastMessage:
            message.sender === "me" ? `You: ${message.text}` : message.text,
          time: message.timestamp,
        },
      }));
    },
    [activeChatId],
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#f0f2f5] text-[#111b21]">
      <IconRail />

      {/* LEFT SIDEBAR */}
      <aside className="flex h-full w-[400px] shrink-0 flex-col border-r border-[#e9edef] bg-white">
        {/* Top bar */}
        <div className="flex h-[59px] shrink-0 items-center justify-between px-4">
          <span className="text-[22px] font-bold text-[#00a884]">WhatsApp</span>
          <div className="flex items-center gap-1">
            <IconButton label="Archived">
              <ArchiveIcon />
            </IconButton>
            <IconButton label="Menu">
              <MenuIcon />
            </IconButton>
          </div>
        </div>

        {/* Search bar */}
        <div className="shrink-0 px-3 pb-1">
          <div className="flex h-9 items-center gap-4 rounded-full bg-[#f0f2f5] px-4">
            <SearchIcon className="h-4 w-4 shrink-0 text-[#54656f]" />
            <input
              type="text"
              placeholder="Search or start a new chat"
              className="h-full w-full bg-transparent text-[14px] text-[#111b21] outline-none placeholder:text-[#8696a0]"
            />
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex shrink-0 items-center gap-2 px-3 py-2">
          <FilterPill active>All</FilterPill>
          <FilterPill>
            Unread <span className="text-[#54656f]">136</span>
          </FilterPill>
          <FilterPill>Favourites</FilterPill>
          <FilterPill>
            Groups <span className="text-[#54656f]">23</span>
          </FilterPill>
          <FilterPill aria-label="Add filter">+</FilterPill>
        </div>

        {/* Archived row */}
        <button
          type="button"
          className="flex h-[52px] shrink-0 items-center gap-6 px-5 text-left hover:bg-[#f5f6f6]"
        >
          <ArchiveIcon className="h-5 w-5 text-[#54656f]" />
          <span className="flex-1 text-[15px]">Archived</span>
          <AtIcon className="h-4 w-4 text-[#8696a0]" />
        </button>

        {/* Chat list */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {chatList.map((chat) => (
            <ChatListItem
              key={chat.id}
              name={chat.name}
              avatarColor={chat.avatarColor}
              lastMessage={previews[chat.id]?.lastMessage ?? chat.lastMessage}
              time={previews[chat.id]?.time ?? chat.time}
              unreadCount={chat.unreadCount}
              isGroup={chat.isGroup}
              active={chat.id === activeChat?.id}
              onSelect={() => selectChat(chat.id)}
            />
          ))}
        </div>
      </aside>

      {/* RIGHT CHAT PANEL */}
      <ChatPanel
        key={`${activeChatId ?? ""}:${playNonce}`}
        chat={activeChat}
        script={script}
        senderColors={activeSenderColors}
        autoStart={autoStart}
        onMessage={handleMessage}
      />

      {/* Editor: hidden by default so the WhatsApp UI stays capture-ready */}
      {!editorOpen ? (
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="fixed bottom-3 right-3 z-30 rounded-full border border-[#d1d7db] bg-white/70 px-3 py-1 text-[12px] text-[#54656f] opacity-40 hover:opacity-100"
        >
          Edit script
        </button>
      ) : null}

      <ScriptEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        chat={activeChat}
        onChatChange={handleChatChange}
        script={activeScript}
        onScriptChange={handleScriptChange}
        onPlay={handlePlay}
        onReset={handleReset}
        savedScripts={saved}
        onSave={handleSave}
        onDeleteSaved={handleDelete}
        onDuplicateSaved={handleDuplicate}
        onSelectSaved={selectChat}
      />
    </div>
  );
}

/* ---------------------------------- rail --------------------------------- */

function IconRail() {
  return (
    <nav className="flex h-full w-[58px] shrink-0 flex-col items-center border-r border-[#e9edef] bg-[#f7f5f3] py-3">
      <div className="relative mb-4">
        <RailButton label="Chats" active>
          <ChatBubbleIcon />
        </RailButton>
        <span className="absolute -right-1 -top-1 rounded-full bg-[#00a884] px-1.5 text-[10px] font-medium leading-4 text-white">
          99+
        </span>
      </div>
      <RailButton label="Calls">
        <PhoneIcon />
      </RailButton>
      <div className="relative">
        <RailButton label="Status">
          <StatusIcon />
        </RailButton>
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#00a884] ring-2 ring-[#f7f5f3]" />
      </div>
      <RailButton label="Channels">
        <ChannelsIcon />
      </RailButton>
      <RailButton label="Communities">
        <CommunitiesIcon />
      </RailButton>
      <RailButton label="Meta AI">
        <FlowerIcon />
      </RailButton>

      <div className="mt-auto flex flex-col items-center gap-3">
        <RailButton label="Settings">
          <GalleryIcon />
        </RailButton>
        <Avatar name="Me" color="#6b8e9e" size={30} />
      </div>
    </nav>
  );
}

function RailButton({
  children,
  label,
  active = false,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full text-[#54656f] hover:bg-[#e9edef] ${
        active ? "bg-[#e7f5ef] text-[#00a884]" : ""
      }`}
    >
      <span className="[&>svg]:h-6 [&>svg]:w-6">{children}</span>
    </button>
  );
}

/* -------------------------------- sidebar -------------------------------- */

function FilterPill({
  children,
  active = false,
  ...rest
}: {
  children: React.ReactNode;
  active?: boolean;
} & React.ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type="button"
      className={`h-[30px] rounded-full px-3 text-[13px] ${
        active
          ? "bg-[#d9fdd3] text-[#111b21]"
          : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}
