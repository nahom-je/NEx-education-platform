import { CheckCheck, Reply } from 'lucide-react'
import Avatar from './Avatar'

// ChatBubble – renders a single message in a chat room.
// Props:
//   message  – { id, text, media, createdAt, senderId, senderName, senderAvatar, replyTo, status }
//   isSent   – boolean (true = right-aligned teal, false = left-aligned gray)
//   showAvatar – show sender avatar (useful for group chats)
//   onReply  – fn called when reply icon clicked
export default function ChatBubble({ message, isSent, showAvatar = false, onReply }) {
  const { text, media, createdAt, senderName, replyTo, status } = message

  const time = createdAt
    ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className={`flex items-end gap-2 w-full ${isSent ? 'flex-row-reverse msg-sent' : 'flex-row msg-received'}`}>
      {/* Avatar (group chats or received) */}
      {showAvatar && !isSent && (
        <Avatar
          user={{ name: senderName, avatar: message.senderAvatar }}
          size="xs"
          className="mb-1 shrink-0"
        />
      )}

      <div className={`flex flex-col gap-1 max-w-[75%] ${isSent ? 'items-end' : 'items-start'}`}>
        {/* Sender name for group chats */}
        {showAvatar && !isSent && senderName && (
          <span className="text-[11px] font-semibold text-[#0D9488] ml-1">{senderName}</span>
        )}

        {/* Reply preview */}
        {replyTo && (
          <div className={`text-xs px-3 py-1.5 rounded-lg border-l-2 border-[#0D9488] bg-[#F1F5F9] text-[#6B7280] max-w-full ${isSent ? 'self-end' : 'self-start'}`}>
            <Reply size={10} className="inline mr-1 text-[#0D9488]" />
            {replyTo.text?.slice(0, 60)}{replyTo.text?.length > 60 ? '…' : ''}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative group inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
            ${isSent
              ? 'bg-[#0D9488] text-white rounded-br-sm'
              : 'bg-[#F1F5F9] text-[#1F2937] rounded-bl-sm'
            }`}
        >
          {/* Media preview */}
          {media && (
            <div className="mb-2">
              {media.type === 'image' ? (
                <img
                  src={media.url}
                  alt="Shared image"
                  className="max-w-full rounded-xl max-h-56 object-cover"
                />
              ) : (
                <a
                  href={media.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-2 text-xs underline ${isSent ? 'text-white/80' : 'text-[#0D9488]'}`}
                >
                  📎 {media.name || 'Attachment'}
                </a>
              )}
            </div>
          )}

          {text}

          {/* Reply button (hover reveal) */}
          {onReply && (
            <button
              onClick={() => onReply(message)}
              aria-label="Reply"
              className={`absolute ${isSent ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} top-1/2 -translate-y-1/2
                opacity-0 group-hover:opacity-100 transition-opacity px-2`}
            >
              <Reply size={14} className="text-[#9CA3AF] hover:text-[#0D9488]" />
            </button>
          )}
        </div>

        {/* Timestamp + read receipt */}
        <div className={`flex items-center gap-1 text-[10px] text-[#9CA3AF] ${isSent ? 'flex-row-reverse' : ''}`}>
          <span>{time}</span>
          {isSent && status === 'read' && (
            <CheckCheck size={12} className="text-[#0D9488]" />
          )}
        </div>
      </div>
    </div>
  )
}
