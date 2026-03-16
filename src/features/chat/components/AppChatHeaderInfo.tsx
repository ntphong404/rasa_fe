import { ConversationExport } from '@/features/chat/components/ConversationExport';
import { useChatHeaderStore } from '@/store/chat-header';

export function AppChatHeaderInfo() {
  const isVisible = useChatHeaderStore((state) => state.isVisible);
  const messages = useChatHeaderStore((state) => state.messages);
  const conversationTitle = useChatHeaderStore((state) => state.conversationTitle);

  if (!isVisible || messages.length === 0) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200/70 bg-background/80 px-3 py-1.5 dark:border-white/15">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">Cuộc trò chuyện</p>
        <p className="text-xs text-muted-foreground">{messages.length} tin nhắn</p>
      </div>
      <ConversationExport messages={messages} conversationTitle={conversationTitle} />
    </div>
  );
}
