import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IChatbot } from '@/interfaces/chatbot.interface';

interface ChatbotState {
  selectedBotId: string | null;
  chatbots: IChatbot[];
  isLoading: boolean;
  error: string | null;
  refreshTrigger: number;
  
  // Actions
  setSelectedBotId: (botId: string) => void;
  setChatbots: (chatbots: IChatbot[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useChatbotStore = create<ChatbotState>()(
  persist(
    (set) => ({
      selectedBotId: null,
      chatbots: [],
      isLoading: false,
      error: null,
      refreshTrigger: 0,

      setSelectedBotId: (botId: string) => {
        set((state) => ({ selectedBotId: botId, refreshTrigger: state.refreshTrigger + 1 }));
      },

      setChatbots: (chatbots: IChatbot[]) => {
        set({ chatbots });
      },

      setIsLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      reset: () => {
        set({
          selectedBotId: null,
          chatbots: [],
          isLoading: false,
          error: null,
          refreshTrigger: 0,
        });
      },
    }),
    {
      name: 'chatbot-storage',
      partialize: (state) => ({
        selectedBotId: state.selectedBotId,
        chatbots: state.chatbots,
      }),
    }
  )
);
