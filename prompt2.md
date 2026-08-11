In WhatsAppWeb.tsx, build the two-column WhatsApp Web layout using Tailwind, matching WhatsApp Web's actual desktop UI:
- Full-height flex container, no page scroll
- LEFT SIDEBAR (fixed width ~400px):
  - Top bar: "WhatsApp" wordmark (green, bold) left, icon buttons right (archive box icon, three-dot menu)
  - Search bar below: rounded pill input with search icon, placeholder "Search or start a new chat"
  - Filter pills row: "All" (active, green background), "Unread", "Favourites", "Groups", "+"
  - "Archived" row with icon
  - Scrollable chat list below (render from ChatListItem[] prop — see Prompt 3)
  - Far-left icon rail: chat bubble, phone, status/circle icon, groups icon, colorful flower/menu icon at bottom, small user avatar at very bottom
- RIGHT CHAT PANEL (flex-1):
  - Header bar: circular avatar/initials, contact name, video icon, phone icon, search icon, three-dot menu — all right-aligned icons
  - Chat body: scrollable, WhatsApp's cream background with subtle repeating doodle pattern (svg or css background-image)
  - Bottom input bar: + icon, emoji icon, rounded "Type a message" input, mic icon on far right
Use WhatsApp's real color palette: sidebar white/#fff, header light grey #f0f2f5, outgoing bubble #d9fdd3, incoming bubble #fff, panel background #efeae2, accent green #00a884.
No chat logic yet — static layout only, use the sample data for placeholder rendering.