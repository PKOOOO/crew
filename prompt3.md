Create /components/ChatListItem.tsx:
- Props matching the ChatListItem type: name, avatarColor, lastMessage, time, unreadCount?, isGroup?
- Layout: circular avatar (colored circle with initials, e.g. "PO" white text) left, name + last message preview stacked right, time + unread badge (green circle, white bold number) top-right aligned
- Selected/active chat row gets a light grey background (#f0f2f5), others transparent, hover state light grey
- Last message text truncates with ellipsis if too long, greyed out color (#667781)
- If unreadCount is present, name and time render bold/green-tinted to indicate unread (match WhatsApp: unread rows show green time text)
Render the full chat list in the sidebar from chatlist-sample.ts, with one item highlighted as "active" (controls which script loads in the chat panel — pass an onSelect callback prop).