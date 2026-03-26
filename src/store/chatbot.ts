import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IChatbot } from '@/interfaces/chatbot.interface';

interface ChatbotState {
  selectedManagementBotId: string | null;
  selectedChatBotId: string | null;
  selectedBotId: string | null;
  chatbots: IChatbot[];
  isLoading: boolean;
  error: string | null;
  refreshTrigger: number;
  
  // Actions
  setSelectedManagementBotId: (botId: string | null) => void;
  setSelectedChatBotId: (botId: string) => void;
  setSelectedBotId: (botId: string | null) => void;
  setChatbots: (chatbots: IChatbot[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useChatbotStore = create<ChatbotState>()(
  persist(
    (set) => ({
      selectedManagementBotId: null,
      selectedChatBotId: null,
      selectedBotId: null,
      chatbots: [],
      isLoading: false,
      error: null,
      refreshTrigger: 0,

      setSelectedManagementBotId: (botId: string | null) => {
        set((state) => ({
          selectedManagementBotId: botId,
          selectedBotId: botId,
          refreshTrigger: state.refreshTrigger + 1,
        }));
      },

      setSelectedChatBotId: (botId: string) => {
        set({ selectedChatBotId: botId });
      },

      setSelectedBotId: (botId: string | null) => {
        set((state) => ({
          selectedManagementBotId: botId,
          selectedBotId: botId,
          refreshTrigger: state.refreshTrigger + 1,
        }));
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
          selectedManagementBotId: null,
          selectedChatBotId: null,
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
        selectedManagementBotId: state.selectedManagementBotId,
        selectedChatBotId: state.selectedChatBotId,
        selectedBotId: state.selectedBotId,
        chatbots: state.chatbots,
      }),
    }
  )
);
