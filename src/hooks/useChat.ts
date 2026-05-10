import { useState, useCallback } from "react";
import { chatService } from "@/features/chat/api/service";
import { IChatMessage, ISendMessageRequest, IConversation, IChatHistoryMessage } from "@/interfaces/chat.interface";
import { generateConversationId } from "@/lib/uuid";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const STREAM_ANIMATION_THRESHOLD = 20;
export type UseChatReturn = {
  messages: IChatMessage[];
  loading: boolean;
  streamStarted: boolean;
  loadingHistory: boolean;
  error: string | null;
  currentConversationId: string | null;
  sendMessage: (messageData: Omit<ISendMessageRequest, 'conversationId'>) => Promise<any>;
  sendMessageStream: (messageData: Omit<ISendMessageRequest, 'conversationId'>) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
  loadConversationHistory: (conversation: IConversation) => void;
  startNewConversation: () => void;
  addMessage: (message: IChatMessage) => void;
  updateLastMessage: (text: string) => void;
};

const stripThinkTags = (raw: string) => {
  const normalized = raw || "";
  const tagPattern = /<\/?think>/gi;
  let visibleContent = "";
  let cursor = 0;
  let inThink = false;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(normalized)) !== null) {
    if (!inThink) {
      visibleContent += normalized.slice(cursor, match.index);
    }
    inThink = match[0].toLowerCase() === "<think>";
    cursor = tagPattern.lastIndex;
  }

  if (!inThink) {
    visibleContent += normalized.slice(cursor);
  }

  return visibleContent.trim();
};

export const useChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamStarted, setStreamStarted] = useState(false);
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
          historyMessages.push({ 
            ...(chatItem as any),
            recipient_id: conversation.userId._id, 
            text: message,
            messageId: (chatItem as any)._id || (chatItem as any).messageId || (chatItem as any).id
          });
        } else if (chatItem.role === "bot") {
          const msgs = Array.isArray(chatItem.message)
            ? chatItem.message
            : [chatItem.message];
          
          if (msgs.length > 0) {
            // Join history messages into a single string separated by double newline
            const combinedText = msgs.join('\n\n');
            historyMessages.push({ 
              ...(chatItem as any),
              recipient_id: "bot", 
              text: combinedText,
              messageId: (chatItem as any)._id || (chatItem as any).messageId || (chatItem as any).id
            });
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
    setStreamStarted(true);
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
      setStreamStarted(false);
    }
  }, [currentConversationId]);

  const sendMessageStream = useCallback(async (messageData: Omit<ISendMessageRequest, 'conversationId'>) => {
    setLoading(true);
    setStreamStarted(false);
    setError(null);

    try {
      let conversationId = currentConversationId;
      if (!conversationId) {
        conversationId = generateConversationId();
        setCurrentConversationId(conversationId);
      }

      const completeMessageData: ISendMessageRequest = {
        ...messageData,
        conversationId,
      };

      const userMessage: IChatMessage = {
        recipient_id: messageData.userId,
        text: messageData.message,
      };

      setMessages(prev => [...prev, userMessage]);

      let botMessageCreated = false;
      let rawBotText = "";
      let eventMessageId: string | undefined = undefined;
      let currentIntent: string | undefined = undefined;
      let currentConfidence: number | undefined = undefined;
      let botButtons: IChatMessage["buttons"] = undefined;
      let sourceType: IChatMessage["sourceType"] = "unknown";

      const updateBotMessage = (text: string, mId?: string) => {
        setMessages(prev => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = {
            ...updated[lastIndex],
            text,
            sourceType,
            buttons: botButtons,
            intent: currentIntent,
            confidence: currentConfidence,
            messageId: mId || eventMessageId || updated[lastIndex].messageId
          };
          return updated;
        });
      };

      const appendSegmentWithAnimation = async (segment: string) => {
        if (!segment) return;

        ensureBotMessage();

        if (segment.length <= STREAM_ANIMATION_THRESHOLD) {
          rawBotText += segment;
          updateBotMessage(stripThinkTags(rawBotText));
          return;
        }

        const delay = segment.length > 120 ? 4 : segment.length > 60 ? 6 : 10;
        let localIndex = 0;

        while (localIndex < segment.length) {
          const nextCharCount = Math.max(1, Math.floor((Date.now() % 7) / 3) + 1);
          rawBotText += segment.slice(localIndex, localIndex + nextCharCount);
          localIndex += nextCharCount;
          updateBotMessage(stripThinkTags(rawBotText));

          if (localIndex < segment.length) {
            await sleep(delay);
          }
        }
      };

      const ensureBotMessage = () => {
        if (botMessageCreated) return;
        botMessageCreated = true;
        setMessages(prev => [
          ...prev,
          {
            recipient_id: "bot",
            text: "",
            buttons: botButtons,
            sourceType,
            isStreaming: true,
          },
        ]);
      };

      await chatService.sendMessageStream(completeMessageData, async (event: any) => {
        if (event.type === "start") {
          setStreamStarted(true);
          return;
        }

        const eventId = event.messageId || event.id || event.message_id;
        if (eventId) {
          console.log("[useChat] Received messageId from stream:", eventId);
          eventMessageId = eventId;
        }

        if (event.type === "meta") {
          sourceType = event.streaming ? "rag" : "rasa";
          if (event.intent) currentIntent = event.intent;
          if (event.confidence) currentConfidence = event.confidence;
          return;
        }

        if (event.type === "message" && typeof event.text === "string") {
          setLoading(false);
          if (rawBotText.length > 0) {
            await appendSegmentWithAnimation("\n\n");
          }
          await appendSegmentWithAnimation(event.text);
          return;
        }

        if (event.type === "token" && typeof event.text === "string") {
          setLoading(false);
          await appendSegmentWithAnimation(event.text);
          return;
        }

        if (event.type === "buttons" && Array.isArray(event.buttons)) {
          botButtons = event.buttons;
          ensureBotMessage();
          setMessages(prev => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              ...updated[lastIndex],
              buttons: botButtons,
              sourceType,
            };
            return updated;
          });
          return;
        }

        // Hide reference/token lists sent by the RAG backend to avoid showing
        // internal token/reference metadata in the chat UI.
        if (event.type === "references" && Array.isArray(event.items) && event.items.length > 0) {
          // Intentionally ignore reference items
          return;
        }

        if (event.type === "done") {
          setLoading(false);
          setStreamStarted(false);
          setMessages(prev => {
            if (prev.length === 0 || !botMessageCreated) return prev;
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              ...updated[lastIndex],
              text: stripThinkTags(rawBotText),
              sourceType,
              buttons: botButtons,
              intent: currentIntent,
              confidence: currentConfidence,
              isStreaming: false,
              messageId: eventMessageId || updated[lastIndex].messageId
            };
            return updated;
          });
          return;
        }

        if (event.type === "error") {
          throw new Error(event.message || "Có lỗi xảy ra khi stream tin nhắn");
        }
      });

      setMessages(prev => {
        if (prev.length === 0 || !botMessageCreated) return prev;
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          ...updated[lastIndex],
          text: stripThinkTags(rawBotText),
          sourceType,
          buttons: botButtons,
          intent: currentIntent,
          confidence: currentConfidence,
          isStreaming: false,
          messageId: eventMessageId || updated[lastIndex].messageId
        };
        return updated;
      });
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra khi gửi tin nhắn";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setStreamStarted(false);
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
    streamStarted,
    loadingHistory,
    error,
    currentConversationId,
    sendMessage,
    sendMessageStream,
    clearMessages,
    clearError,
    loadConversationHistory,
    startNewConversation,
    addMessage,
    updateLastMessage,
  };
};
