In WhatsAppWeb.tsx (or a new /components/ChatPanel.tsx if you want to split it out), implement the script playback engine:
- State: visibleMessages (array), currentlyTyping (sender name or null)
- Accept the active ChatEvent[] script as a prop (driven by which sidebar chat is selected)
- Process events sequentially with awaited delays:
  - "typing": set currentlyTyping, wait duration, clear WITHOUT adding a message (bait/deleted-while-typing case)
  - "message": wait delay, set currentlyTyping briefly (~1s), clear it, push message to visibleMessages with computed isFirstInGroup (true if previous message had a different sender or doesn't exist)
  - "delete": wait delay, find message by id in visibleMessages, set isDeleted: true on it (keep isFirstInGroup as originally computed)
- Auto-scroll chat body to bottom on every visibleMessages/currentlyTyping change (useRef + scrollIntoView or scrollTop = scrollHeight)
- When sidebar chat selection changes, reset visibleMessages/currentlyTyping and restart playback with the new script
- Also update that chat's ChatListItem lastMessage/time in the sidebar as new messages land (optional but matches real WhatsApp — sidebar preview updates live)