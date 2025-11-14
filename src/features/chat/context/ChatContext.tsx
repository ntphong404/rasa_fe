import { createContext, useContext, ReactNode } from "react";
import { UseChatReturn } from "@/hooks/useChat";
import { IConversation } from "@/interfaces/chat.interface";

interface ChatContextType {
  chatHook: UseChatReturn | null;
  selectedConversation: IConversation | null;
  conversationId?: string;
  isNewChat?: boolean;
  onSelectConversation: (conversation: IConversation) => void;
  onNewChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    return {
      chatHook: null,
      selectedConversation: null,
      conversationId: undefined,
      isNewChat: true,
      onSelectConversation: () => {},
      onNewChat: () => {},
    };
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
  chatHook: UseChatReturn;
  selectedConversation: IConversation | null;
  onSelectConversation: (conversation: IConversation) => void;
  onNewChat: () => void;
}

export const ChatProvider = ({
  children,
  chatHook,
  selectedConversation,
  onSelectConversation,
  onNewChat,
}: ChatProviderProps) => {
  return (
    <ChatContext.Provider
      value={{
        chatHook,
        selectedConversation,
        conversationId: selectedConversation?.conversationId,
        isNewChat: !selectedConversation,
        onSelectConversation,
        onNewChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
