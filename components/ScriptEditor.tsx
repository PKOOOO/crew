"use client";

import type { ChatEvent, ChatListItem, SavedScript } from "@/types/chat";

export type ScriptEditorProps = {
  open: boolean;
  onClose: () => void;
  chat: ChatListItem | undefined;
  onChatChange: (chat: ChatListItem) => void;
  script: ChatEvent[];
  onScriptChange: (script: ChatEvent[]) => void;
  onPlay: () => void;
  onReset: () => void;
  savedScripts: SavedScript[];
  onSave: () => void;
  onDeleteSaved: (id: string) => void;
  onDuplicateSaved: (id: string) => void;
  onSelectSaved: (id: string) => void;
};

type EventType = ChatEvent["type"];

const FIELD =
  "w-full rounded border border-[#d1d7db] bg-white px-2 py-1 text-[13px] text-[#111b21] outline-none focus:border-[#00a884]";

function nextMessageId(script: ChatEvent[]): string {
  const used = new Set(
    script.flatMap((event) => (event.type === "message" ? [event.id] : [])),
  );
  let index = 1;
  while (used.has(`m${index}`)) index += 1;
  return `m${index}`;
}

/** Rebuilds an event as a different type, carrying over what still applies. */
function convertEvent(
  event: ChatEvent,
  type: EventType,
  script: ChatEvent[],
): ChatEvent {
  if (event.type === type) return event;

  const sender = event.type === "delete" ? "me" : event.sender;
  const delay = event.type === "typing" ? event.duration : event.delay;

  if (type === "message") {
    return {
      type: "message",
      id: nextMessageId(script),
      sender,
      text: "",
      delay,
    };
  }
  if (type === "typing") {
    return { type: "typing", sender, duration: delay };
  }
  const firstMessage = script.find((item) => item.type === "message");
  return {
    type: "delete",
    targetId: firstMessage?.type === "message" ? firstMessage.id : "",
    delay,
  };
}

export default function ScriptEditor({
  open,
  onClose,
  chat,
  onChatChange,
  script,
  onScriptChange,
  onPlay,
  onReset,
  savedScripts,
  onSave,
  onDeleteSaved,
  onDuplicateSaved,
  onSelectSaved,
}: ScriptEditorProps) {
  const senders = Array.from(
    new Set([
      "me",
      ...(chat ? [chat.name] : []),
      ...script.flatMap((event) =>
        event.type === "delete" ? [] : [event.sender],
      ),
    ]),
  );

  const messageIds = script.flatMap((event) =>
    event.type === "message" ? [event.id] : [],
  );

  const replaceAt = (index: number, event: ChatEvent) => {
    onScriptChange(script.map((item, i) => (i === index ? event : item)));
  };

  const removeAt = (index: number) => {
    onScriptChange(script.filter((_, i) => i !== index));
  };

  const moveBy = (index: number, offset: number) => {
    const target = index + offset;
    if (target < 0 || target >= script.length) return;
    const next = [...script];
    const [moved] = next.splice(index, 1);
    if (moved) next.splice(target, 0, moved);
    onScriptChange(next);
  };

  const addRow = () => {
    onScriptChange([
      ...script,
      {
        type: "message",
        id: nextMessageId(script),
        sender: chat?.name ?? "me",
        text: "",
        delay: 1000,
      },
    ]);
  };

  return (
    <aside
      aria-hidden={!open}
      className={`fixed right-0 top-0 z-40 flex h-full w-[420px] flex-col border-l border-[#d1d7db] bg-[#fbfbfa] shadow-[-8px_0_24px_rgba(11,20,26,0.12)] transition-transform duration-200 ${
        open ? "translate-x-0" : "pointer-events-none translate-x-full"
      }`}
    >
      {/* Drawer header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#e9edef] px-4 py-3">
        <div>
          <div className="text-[15px] font-semibold text-[#111b21]">
            Script editor
          </div>
          <div className="text-[12px] text-[#667781]">
            {chat?.name ?? "No chat selected"}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded px-2 py-1 text-[13px] text-[#54656f] hover:bg-[#e9edef]"
        >
          Close
        </button>
      </div>

      {/* Playback controls */}
      <div className="flex shrink-0 gap-2 border-b border-[#e9edef] px-4 py-3">
        <button
          type="button"
          onClick={onPlay}
          className="rounded bg-[#00a884] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#029176]"
        >
          Play
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-[#d1d7db] bg-white px-4 py-1.5 text-[13px] text-[#111b21] hover:bg-[#f0f2f5]"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!chat}
          className="ml-auto rounded border border-[#00a884] bg-white px-4 py-1.5 text-[13px] font-medium text-[#00a884] hover:bg-[#e7f5ef] disabled:opacity-40"
        >
          Save Script
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {/* Saved scripts */}
        <section className="mb-5">
          <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#667781]">
            Saved scripts ({savedScripts.length})
          </h3>
          {savedScripts.length ? (
            <div className="flex flex-col gap-1">
              {savedScripts.map((saved) => (
                <div
                  key={saved.id}
                  className={`flex items-center gap-2 rounded border px-2 py-1.5 ${
                    saved.id === chat?.id
                      ? "border-[#00a884] bg-[#e7f5ef]"
                      : "border-[#e9edef] bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectSaved(saved.id)}
                    className="min-w-0 flex-1 truncate text-left text-[13px] text-[#111b21]"
                  >
                    {saved.name}
                    <span className="ml-2 text-[11px] text-[#8696a0]">
                      {saved.events.length} events
                      {saved.chatListItem.isGroup ? " · group" : ""}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateSaved(saved.id)}
                    className="rounded border border-[#d1d7db] bg-white px-2 py-0.5 text-[12px] text-[#54656f] hover:bg-[#f0f2f5]"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSaved(saved.id)}
                    className="rounded border border-[#d1d7db] bg-white px-2 py-0.5 text-[12px] text-[#c4532d] hover:bg-[#fdeeea]"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded border border-dashed border-[#d1d7db] px-3 py-2 text-[12px] text-[#667781]">
              Nothing saved yet — the sidebar is showing sample data. Hit “Save
              Script” to persist this chat to localStorage.
            </p>
          )}
        </section>

        {/* Chat details */}
        {chat ? (
          <section className="mb-5">
            <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#667781]">
              Chat details
            </h3>
            <div className="flex flex-col gap-2 rounded border border-[#e9edef] bg-white p-3">
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-[#667781]">Name</span>
                <input
                  className={FIELD}
                  value={chat.name}
                  onChange={(event) =>
                    onChatChange({ ...chat, name: event.target.value })
                  }
                />
              </label>

              <div className="flex gap-2">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[12px] text-[#667781]">
                    Avatar color
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="h-7 w-9 shrink-0 rounded border border-[#d1d7db] bg-white"
                      value={chat.avatarColor}
                      onChange={(event) =>
                        onChatChange({
                          ...chat,
                          avatarColor: event.target.value,
                        })
                      }
                    />
                    <input
                      className={FIELD}
                      value={chat.avatarColor}
                      onChange={(event) =>
                        onChatChange({
                          ...chat,
                          avatarColor: event.target.value,
                        })
                      }
                    />
                  </div>
                </label>

                <label className="flex w-[120px] flex-col gap-1">
                  <span className="text-[12px] text-[#667781]">Type</span>
                  <select
                    className={FIELD}
                    value={chat.isGroup ? "group" : "contact"}
                    onChange={(event) =>
                      onChatChange({
                        ...chat,
                        isGroup: event.target.value === "group",
                      })
                    }
                  >
                    <option value="contact">Contact</option>
                    <option value="group">Group</option>
                  </select>
                </label>
              </div>
            </div>
          </section>
        ) : null}

        {/* Script rows */}
        <section>
          <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#667781]">
            Events ({script.length})
          </h3>

          <div className="flex flex-col gap-2">
            {script.map((event, index) => (
              <div
                key={index}
                className="rounded border border-[#e9edef] bg-white p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="w-5 shrink-0 text-[12px] text-[#8696a0]">
                    {index + 1}
                  </span>

                  <select
                    className={`${FIELD} w-[110px]`}
                    value={event.type}
                    onChange={(change) =>
                      replaceAt(
                        index,
                        convertEvent(
                          event,
                          change.target.value as EventType,
                          script,
                        ),
                      )
                    }
                  >
                    <option value="message">message</option>
                    <option value="typing">typing</option>
                    <option value="delete">delete</option>
                  </select>

                  <div className="ml-auto flex items-center gap-1">
                    <RowButton
                      label="Move up"
                      disabled={index === 0}
                      onClick={() => moveBy(index, -1)}
                    >
                      ↑
                    </RowButton>
                    <RowButton
                      label="Move down"
                      disabled={index === script.length - 1}
                      onClick={() => moveBy(index, 1)}
                    >
                      ↓
                    </RowButton>
                    <RowButton label="Remove" onClick={() => removeAt(index)}>
                      ✕
                    </RowButton>
                  </div>
                </div>

                {event.type === "delete" ? (
                  <div className="flex gap-2">
                    <label className="flex flex-1 flex-col gap-1">
                      <span className="text-[12px] text-[#667781]">
                        Target message
                      </span>
                      <select
                        className={FIELD}
                        value={event.targetId}
                        onChange={(change) =>
                          replaceAt(index, {
                            ...event,
                            targetId: change.target.value,
                          })
                        }
                      >
                        <option value="">—</option>
                        {messageIds.map((id) => (
                          <option key={id} value={id}>
                            {id}
                          </option>
                        ))}
                      </select>
                    </label>
                    <DelayField
                      label="Delay (ms)"
                      value={event.delay}
                      onChange={(delay) => replaceAt(index, { ...event, delay })}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <label className="flex flex-1 flex-col gap-1">
                        <span className="text-[12px] text-[#667781]">
                          Sender
                        </span>
                        <select
                          className={FIELD}
                          value={event.sender}
                          onChange={(change) =>
                            replaceAt(index, {
                              ...event,
                              sender: change.target.value,
                            })
                          }
                        >
                          {senders.map((sender) => (
                            <option key={sender} value={sender}>
                              {sender === "me" ? "me (outgoing)" : sender}
                            </option>
                          ))}
                        </select>
                      </label>

                      <DelayField
                        label={
                          event.type === "typing" ? "Duration (ms)" : "Delay (ms)"
                        }
                        value={
                          event.type === "typing" ? event.duration : event.delay
                        }
                        onChange={(value) =>
                          replaceAt(
                            index,
                            event.type === "typing"
                              ? { ...event, duration: value }
                              : { ...event, delay: value },
                          )
                        }
                      />
                    </div>

                    {event.type === "message" ? (
                      <label className="flex flex-col gap-1">
                        <span className="text-[12px] text-[#667781]">
                          Text ({event.id})
                        </span>
                        <input
                          className={FIELD}
                          value={event.text}
                          onChange={(change) =>
                            replaceAt(index, {
                              ...event,
                              text: change.target.value,
                            })
                          }
                        />
                      </label>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-3 w-full rounded border border-dashed border-[#d1d7db] py-2 text-[13px] text-[#54656f] hover:bg-[#f0f2f5]"
          >
            + Add event
          </button>
        </section>
      </div>
    </aside>
  );
}

function DelayField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex w-[120px] flex-col gap-1">
      <span className="text-[12px] text-[#667781]">{label}</span>
      <input
        type="number"
        min={0}
        step={100}
        className={FIELD}
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
      />
    </label>
  );
}

function RowButton({
  children,
  label,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="h-6 w-6 rounded border border-[#d1d7db] bg-white text-[12px] text-[#54656f] hover:bg-[#f0f2f5] disabled:opacity-30"
    >
      {children}
    </button>
  );
}
