Create /components/TypingIndicator.tsx:
- Same bubble shell as an incoming MessageBubble (white, tail only if isFirstInGroup)
- Contains three dots with staggered CSS bounce animation (0ms, 150ms, 300ms delays)
- Accept senderName + senderColor props for group chats, shown above like a normal incoming message