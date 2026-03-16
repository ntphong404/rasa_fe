import { create } from 'zustand';
import { IChatMessage } from '@/interfaces/chat.interface';

interface ChatHeaderState {
  isVisible: boolean;
  conversationTitle: string;
  messages: IChatMessage[];
  showChatHeader: (payload: { conversationTitle?: string; messages: IChatMessage[] }) => void;
  hideChatHeader: () => void;
}

export const useChatHeaderStore = create<ChatHeaderState>()((set) => ({
  isVisible: false,
  conversationTitle: 'Cuộc trò chuyện với Bot AI',
  messages: [],
  showChatHeader: ({ conversationTitle, messages }) =>
    set({
      isVisible: true,
      conversationTitle: conversationTitle || 'Cuộc trò chuyện với Bot AI',
      messages,
    }),
  hideChatHeader: () =>
    set({
      isVisible: false,
      messages: [],
    }),
}));
