import { useState, useCallback } from "react";
import { ChevronDown, Plus, MessageSquare, Clock } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { IConversation } from "@/interfaces/chat.interface";
import { formatDistanceToNow } from "date-fns";
import { useChatContext } from "@/features/chat/context/ChatContext";

export function ChatHistorySection() {
  const userId = useCurrentUserId();
  const { conversations, loading } = useConversations(userId);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const { chatHook, onSelectConversation, onNewChat } = useChatContext();

  const handleSelect = useCallback(
    (conversation: IConversation) => {
      setSelectedId(conversation._id);
      if (chatHook?.loadConversationHistory) {
        chatHook.loadConversationHistory(conversation);
      }
      onSelectConversation?.(conversation);
    },
    [chatHook, onSelectConversation]
  );

  const getConversationTitle = (conversation: IConversation) => {
    const firstUserMessage = conversation.chat.find(
      (msg) => msg.role === "user"
    );

    if (firstUserMessage) {
      const message =
        typeof firstUserMessage.message === "string"
          ? firstUserMessage.message
          : firstUserMessage.message[0];
      return message.length > 30 ? `${message.substring(0, 30)}...` : message;
    }

    return "Cuộc trò chuyện mới";
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "";
    }
  };

  return (
    <div className="px-2">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 mb-2"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <Clock className="h-4 w-4" />
          <span>Lịch sử</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* New Chat Button */}
      <button
        onClick={() => {
          setSelectedId(null);
          onNewChat?.();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 mb-3 border border-gray-200 dark:border-gray-700"
      >
        <Plus className="h-4 w-4" />
        <span>Cuộc trò chuyện mới</span>
      </button>

      {/* Conversations List */}
      {isOpen && (
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
              Đang tải...
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
              Chưa có cuộc trò chuyện
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation._id}
                onClick={() => handleSelect(conversation)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedId === conversation._id
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title={getConversationTitle(conversation)}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <MessageSquare className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {getConversationTitle(conversation)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(conversation.updatedAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
