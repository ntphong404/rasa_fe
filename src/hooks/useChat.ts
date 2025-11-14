import { useState, useCallback } from "react";
import { chatService } from "@/features/chat/api/service";
import { IChatMessage, ISendMessageRequest, IConversation, IChatHistoryMessage } from "@/interfaces/chat.interface";
import { generateConversationId } from "@/lib/uuid";

export type UseChatReturn = {
  messages: IChatMessage[];
  loading: boolean;
  error: string | null;
  currentConversationId: string | null;
  sendMessage: (messageData: Omit<ISendMessageRequest, 'conversationId'>) => Promise<any>;
  clearMessages: () => void;
  clearError: () => void;
  loadConversationHistory: (conversation: IConversation) => void;
  startNewConversation: () => void;
};

export const useChat = (chatbotId: string): UseChatReturn => {
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const loadConversationHistory = useCallback((conversation: IConversation) => {
    setCurrentConversationId(conversation.conversationId);
    
    // Convert conversation history to chat messages format
    const historyMessages: IChatMessage[] = [];
    
    conversation.chat.forEach((chatItem: IChatHistoryMessage) => {
      if (chatItem.role === "user") {
        const message = typeof chatItem.message === "string" 
          ? chatItem.message 
          : chatItem.message[0] || "";
        
        historyMessages.push({
          recipient_id: conversation.userId._id,
          text: message
        });
      } else if (chatItem.role === "bot") {
        const messages = Array.isArray(chatItem.message) 
          ? chatItem.message 
          : [chatItem.message];
        
        messages.forEach(msg => {
          historyMessages.push({
            recipient_id: "bot",
            text: msg
          });
        });
      }
    });
    
    setMessages(historyMessages);
    setError(null);
  }, []);

  const startNewConversation = useCallback(() => {
    const newConversationId = generateConversationId();
    setCurrentConversationId(newConversationId);
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(async (messageData: Omit<ISendMessageRequest, 'conversationId'>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Nếu chưa có conversationId thì tạo mới
      let conversationId = currentConversationId;
      if (!conversationId) {
        conversationId = generateConversationId();
        setCurrentConversationId(conversationId);
      }

      // Tạo messageData hoàn chỉnh với conversationId
      const completeMessageData: ISendMessageRequest = {
        ...messageData,
        conversationId
      };

      // Thêm tin nhắn của user vào danh sách
      const userMessage: IChatMessage = {
        recipient_id: messageData.userId,
        text: messageData.message
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Gửi tin nhắn đến API
      const response = await chatService.sendMessage(chatbotId, completeMessageData);
      
      if (response.success && response.data) {
        // Thêm tin nhắn phản hồi từ bot - sửa recipient_id để phân biệt với user
        const botMessages = response.data.map(msg => ({
          ...msg,
          recipient_id: "bot" // Đảm bảo bot message có recipient_id = "bot"
        }));
        
        setMessages(prev => [...prev, ...botMessages]);
      }
      
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Có lỗi xảy ra khi gửi tin nhắn";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [chatbotId, currentConversationId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setCurrentConversationId(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    currentConversationId,
    sendMessage,
    clearMessages,
    clearError,
    loadConversationHistory,
    startNewConversation,
  };
};