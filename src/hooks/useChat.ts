import { useState, useCallback } from "react";
import { chatService } from "@/features/chat/api/service";
import { IChatMessage, ISendMessageRequest, IConversation, IChatHistoryMessage } from "@/interfaces/chat.interface";
import { generateConversationId } from "@/lib/uuid";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
export type UseChatReturn = {
  messages: IChatMessage[];
  loading: boolean;
  loadingHistory: boolean;
  error: string | null;
  currentConversationId: string | null;
  sendMessage: (messageData: Omit<ISendMessageRequest, 'conversationId'>) => Promise<any>;
  clearMessages: () => void;
  clearError: () => void;
  loadConversationHistory: (conversation: IConversation) => void;
  startNewConversation: () => void;
  addMessage: (message: IChatMessage) => void;
  updateLastMessage: (text: string) => void;
};

export const useChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const loadConversationHistory = useCallback((conversation: IConversation) => {
    setLoadingHistory(true);
    setMessages([]);
    setCurrentConversationId(conversation.conversationId);

    // Defer heavy parsing off the current paint frame so the spinner shows
    setTimeout(() => {
      const historyMessages: IChatMessage[] = [];

      conversation.chat.forEach((chatItem: IChatHistoryMessage) => {
        if (chatItem.role === "user") {
          const message = typeof chatItem.message === "string"
            ? chatItem.message
            : chatItem.message[0] || "";
          historyMessages.push({ recipient_id: conversation.userId._id, text: message });
        } else if (chatItem.role === "bot") {
          const msgs = Array.isArray(chatItem.message)
            ? chatItem.message
            : [chatItem.message];
          
          if (msgs.length > 0) {
            // Join history messages into a single string separated by double newline
            const combinedText = msgs.join('\n\n');
            historyMessages.push({ recipient_id: "bot", text: combinedText });
          }
        }
      });

      setMessages(historyMessages);
      setError(null);
      setLoadingHistory(false);
    }, 0);
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
      const response = await chatService.sendMessage(completeMessageData);
      
      if (response.success && response.data && response.data.length > 0) {
        // Stop loading indicator once first response is available, then render bot text progressively.
        setLoading(false);

        // Concatenate all message texts from response.data into a single string
        const combinedText = response.data
          .map((m: any) => m.text)
          .filter(Boolean)
          .join("\n\n");

        // Use the metadata from the first message, but with the combined text
        const firstMsg = response.data[0];
        const botMessageBase: IChatMessage = {
          ...firstMsg,
          recipient_id: "bot",
          text: "",
          isStreaming: true,
        };

        setMessages((prev) => [...prev, botMessageBase]);

        const fullText = combinedText || "";
        if (!fullText) {
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = { ...updated[lastIndex], isStreaming: false };
            return updated;
          });
        } else {
          // Keep per-character typing feel while making long messages reasonably fast.
          const delay = fullText.length > 600 ? 5 : fullText.length > 300 ? 8 : 14;
          let displayed = "";
          let i = 0;
          let lastTick = Date.now();

          while (i < fullText.length) {
            const now = Date.now();
            // Nếu tab ẩn, browser throttle setTimeout => (now - lastTick) sẽ lớn
            // Tính số lượng ký tự bù tốc độ để kịp tiến độ (ít nhất 1)
            const charsToPrint = Math.max(1, Math.floor((now - lastTick) / delay));
            
            displayed += fullText.substring(i, i + charsToPrint);
            i += charsToPrint;
            lastTick = now;

            setMessages((prev) => {
              if (prev.length === 0) return prev;
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              updated[lastIndex] = {
                ...updated[lastIndex],
                text: displayed,
              };
              return updated;
            });

            if (i < fullText.length) {
              await sleep(delay);
            }
          }

          // Mark streaming done so action buttons appear
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = { ...updated[lastIndex], isStreaming: false };
            return updated;
          });
        }
      }
      
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Có lỗi xảy ra khi gửi tin nhắn";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentConversationId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setCurrentConversationId(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const addMessage = useCallback((message: IChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateLastMessage = useCallback((text: string) => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        text
      };
      return updated;
    });
  }, []);

  return {
    messages,
    loading,
    loadingHistory,
    error,
    currentConversationId,
    sendMessage,
    clearMessages,
    clearError,
    loadConversationHistory,
    startNewConversation,
    addMessage,
    updateLastMessage,
  };
};