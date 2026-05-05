import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IChatbot } from '@/interfaces/chatbot.interface';

interface ChatbotState {
  selectedManagementBotId: string | null;
  selectedManagementBotObjectId: string | null; // MongoDB _id for management operations
  selectedChatBotId: string | null;
  selectedChatbotObjectId: string | null; // MongoDB _id for chat operations
  selectedBotId: string | null;
  chatbots: IChatbot[];
  isLoading: boolean;
  error: string | null;
  refreshTrigger: number;
  
  // Actions
  setSelectedManagementBotId: (botId: string | null, objectId?: string | null) => void;
  setSelectedManagementBotObjectId: (objectId: string | null) => void;
  setSelectedChatBotId: (botId: string, objectId?: string | null) => void;
  setSelectedChatbotObjectId: (objectId: string | null) => void;
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
      selectedManagementBotObjectId: null,
      selectedChatBotId: null,
      selectedChatbotObjectId: null,
      selectedBotId: null,
      chatbots: [],
      isLoading: false,
      error: null,
      refreshTrigger: 0,

      setSelectedManagementBotId: (botId: string | null, objectId?: string | null) => {
        set((state) => ({
          selectedManagementBotId: botId,
          selectedManagementBotObjectId: objectId || null,
          selectedBotId: botId,
          refreshTrigger: state.refreshTrigger + 1,
        }));
      },

      setSelectedManagementBotObjectId: (objectId: string | null) => {
        set({ selectedManagementBotObjectId: objectId });
      },

      setSelectedChatBotId: (botId: string, objectId?: string | null) => {
        set({ selectedChatBotId: botId, selectedChatbotObjectId: objectId || null });
      },

      setSelectedChatbotObjectId: (objectId: string | null) => {
        set({ selectedChatbotObjectId: objectId });
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
          selectedManagementBotObjectId: null,
          selectedChatBotId: null,
          selectedChatbotObjectId: null,
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
        selectedManagementBotObjectId: state.selectedManagementBotObjectId,
        selectedChatBotId: state.selectedChatBotId,
        selectedChatbotObjectId: state.selectedChatbotObjectId,
        selectedBotId: state.selectedBotId,
        chatbots: state.chatbots,
      }),
    }
  )
);
