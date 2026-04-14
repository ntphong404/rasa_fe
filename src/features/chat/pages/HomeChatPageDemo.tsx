import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Mic,
  MicOff,
  SendHorizonal,
  Pencil,
  Copy,
  RotateCcw,
  ArrowDown,
  ThumbsDown,
  ThumbsUp,
  Loader2,
} from "lucide-react";
import { Fragment, useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { useAuthStore } from "@/store/auth";
import { useChatbotStore } from "@/store/chatbot";
import { useChatHeaderStore } from "@/store/chat-header";
import { useChatContext } from "@/features/chat/context/ChatContext";
import { IngestedDocument } from "@/interfaces/rag.interface";
import { ragService } from "@/features/chat/api/ragService";
import { chatService } from "@/features/chat/api/service";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { MarkdownMessage } from "@/features/chat/components/MarkdownMessage";
import { stripMarkdown } from "@/features/chat/utils/markdown";
import ENDPOINTS from "@/api/endpoints";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const FEEDBACK_DELAY_MS = 3 * 60 * 1000;
const FEEDBACK_QUEUE_KEY = "chat_message_feedback_queue_v2";

type MessageFeedback = "like" | "dislike";
type PendingFeedbackAction = "upsert" | "remove";

interface PendingFeedbackItem {
  action: PendingFeedbackAction;
  messageId: string;
  chatbotId: string;
  userId: string;
  sourceType: 0 | 1;
  questionText: string;
  answerText: string;
  vote: MessageFeedback;
  queuedAt: number;
}

const DEFAULT_QUICK_SUGGESTIONS = [
  "Vai trò của Kỹ thuật Điện tử Viễn thông trong thời đại công nghệ 4.0 là gì?",
  "Điều kiện về điểm quá trình để học viên, sinh viên được dự thi kết thúc học phần là gì?",
  "Ngành Công nghệ thông tin bao gồm những gì?",
  "Cho hỏi học phí hệ chính quy của học viện kỹ thuật mật mã là bao nhiêu?",
  "Thời gian ký quyết định ban hành logo mới của Học viện là khi nào?",
  "Người không phải sinh viên có được vào trường không?",
  "Chuẩn tiếng Anh đầu ra của Học viện là bao nhiêu?",
  "Sau khi có giấy báo trúng tuyển bản mềm, thí sinh cần chuẩn bị những gì?",
  "Tên đầy đủ của Học viện Kỹ thuật Mật mã là gì?",
  "An toàn thông tin bao gồm những hoạt động gì?",
  "Đơn vị nào quản lý các biên bản thẩm định và nghiệm thu ngân hàng câu hỏi thi?",
  "Học viện kỹ thuật mật mã có bao nhiêu phương thức tuyển sinh?"
];

const pickRandomSuggestions = (pool: string[], count: number) => {
  if (pool.length <= count) return pool;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const secondsToCs = (seconds: number) => Math.round(seconds * 100);

const WAITING_STATUS_STEPS = [
  { atCs: secondsToCs(0), text: "Đang suy nghĩ..." },
  { atCs: secondsToCs(2), text: "Đang tìm kiếm tài liệu..." },
  { atCs: secondsToCs(5), text: "Đang tổng hợp thông tin..." },
  { atCs: secondsToCs(8), text: "Đang kiểm tra độ chính xác..." },
  { atCs: secondsToCs(12), text: "Đang hoàn thiện câu trả lời..." },
  { atCs: secondsToCs(16), text: "Vui lòng chờ thêm chút nhé..." },
];

const getWaitingStatusText = (elapsedCs: number): string => {
  let result = WAITING_STATUS_STEPS[0].text;
  for (const step of WAITING_STATUS_STEPS) {
    if (elapsedCs >= step.atCs) result = step.text;
    else break;
  }
  return result;
};

// Format: S,cs — ví dụ "3,07" (giây + centiseconds 2 chữ số)
const formatElapsedTime = (cs: number): string => {
  const seconds = Math.floor(cs / 100);
  const centis = cs % 100;
  return `${seconds},${centis.toString().padStart(2, "0")}`;
};

export function HomeChatDemo() {
  const { t } = useTranslation();
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  // How many messages to show from the END (progressive load upward)
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Visible pending messages shown as dimmed bubbles while bot is responding
  const [pendingQueue, setPendingQueue] = useState<string[]>([]);
  const [loadingElapsedCs, setLoadingElapsedCs] = useState(0); // centiseconds (1/100s)
  // Thời gian bị đóng băng khi streaming bắt đầu (bỏ tính), dạng "S,XX"
  const [frozenElapsedLabel, setFrozenElapsedLabel] = useState<string | null>(null);
  const [allSuggestions, setAllSuggestions] = useState<string[]>(DEFAULT_QUICK_SUGGESTIONS);
  const [visibleSuggestions, setVisibleSuggestions] = useState<string[]>(() => DEFAULT_QUICK_SUGGESTIONS.slice(0, 4));
  const [messageFeedback, setMessageFeedback] = useState<Record<string, MessageFeedback | undefined>>({});
  const feedbackFlushTimerRef = useRef<number | null>(null);
  const pendingFeedbackRef = useRef<Record<string, PendingFeedbackItem>>({});
  const syncedFeedbackRef = useRef<Record<string, MessageFeedback>>({});
  // State-based sending lock (reactive, triggers re-render correctly)
  const [isSending, setIsSending] = useState(false);
  // Ref-based guard only for synchronous double-submit (click race before rerender)
  const submitGuardRef = useRef(false);
  // Avoid triggering "load older" logic while we are programmatically scrolling to bottom
  const isProgrammaticScrollRef = useRef(false);
  // Track previous conversationIdFromUrl to detect when it goes null (user navigates to fresh chat)
  const prevConversationIdRef = useRef<string | null>(null);
  const userId = useCurrentUserId();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { selectedChatBotId, chatbots } = useChatbotStore();

  // Chat conversation always uses the global system chatbot selection.
  const chatScopeBotId = selectedChatBotId;
  const selectedChatbot = chatbots.find((bot) => bot.botId === chatScopeBotId);
  const chatbotId = selectedChatbot?._id || chatScopeBotId || "";

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationIdFromUrl = searchParams.get("conversationId");

  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<IngestedDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  // Speech-to-text
  const {
    isListening,
    transcript,
    error: speechError,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText('vi-VN');
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Get chatHook from context or create default one
  const contextChat = useChatContext();
  const fallbackChatHook = useChat();

  const chatHook = contextChat.chatHook || fallbackChatHook;
  const {
    messages,
    loading,
    streamStarted,
    loadingHistory,
    error,
    sendMessageStream,
    clearError,
    currentConversationId,
    startNewConversation,
    loadConversationHistory,
    addMessage,
    updateLastMessage,
  } = chatHook;
  const showChatHeader = useChatHeaderStore((state) => state.showChatHeader);
  const hideChatHeader = useChatHeaderStore((state) => state.hideChatHeader);
  const waitingStatusText = getWaitingStatusText(loadingElapsedCs);

  // Reset visible window and auto-scroll whenever the active conversation changes
  useEffect(() => { setVisibleCount(PAGE_SIZE); setShouldAutoScroll(true); }, [currentConversationId]);

  // Fetch uploaded documents on mount
  useEffect(() => {
    fetchUploadedDocuments();
  }, []);

  const voteToNumber = (vote: MessageFeedback): 0 | 1 => (vote === "like" ? 1 : 0);

  const persistFeedbackQueue = () => {
    const queue = Object.values(pendingFeedbackRef.current);
    localStorage.setItem(FEEDBACK_QUEUE_KEY, JSON.stringify(queue));
  };

  const sendFeedbackWithBeacon = (item: PendingFeedbackItem) => {
    if (!navigator.sendBeacon) {
      return false;
    }

    const url = `${window.location.origin}${ENDPOINTS.CHATBOT_ENDPOINTS.MESSAGE_FEEDBACK(item.chatbotId)}`;
    const body = JSON.stringify({
      messageId: item.messageId,
      userId: item.userId,
      sourceType: item.sourceType,
      questionText: item.questionText,
      answerText: item.answerText,
      vote: voteToNumber(item.vote),
    });

    return navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
  };

  const flushPendingFeedback = async (useBeacon = false) => {
    const queue = Object.values(pendingFeedbackRef.current);
    if (queue.length === 0) {
      return;
    }

    pendingFeedbackRef.current = {};
    persistFeedbackQueue();

    for (const item of queue) {
      try {
        if (useBeacon && sendFeedbackWithBeacon(item)) {
          if (item.action === "upsert") {
            syncedFeedbackRef.current[item.messageId] = item.vote;
          } else {
            delete syncedFeedbackRef.current[item.messageId];
          }
          continue;
        }

        await chatService.submitMessageFeedback(item.chatbotId, {
          messageId: item.messageId,
          userId: item.userId,
          sourceType: item.sourceType,
          questionText: item.questionText,
          answerText: item.answerText,
          vote: voteToNumber(item.vote),
        });

        if (item.action === "upsert") {
          syncedFeedbackRef.current[item.messageId] = item.vote;
        } else {
          delete syncedFeedbackRef.current[item.messageId];
        }
      } catch {
        pendingFeedbackRef.current[item.messageId] = item;
      }
    }

    persistFeedbackQueue();
  };

  const scheduleFeedbackFlush = () => {
    if (feedbackFlushTimerRef.current) {
      window.clearTimeout(feedbackFlushTimerRef.current);
    }

    feedbackFlushTimerRef.current = window.setTimeout(() => {
      void flushPendingFeedback(false);
    }, FEEDBACK_DELAY_MS);
  };

  useEffect(() => {
    const rawQueue = localStorage.getItem(FEEDBACK_QUEUE_KEY);
    if (rawQueue) {
      try {
        const parsed = JSON.parse(rawQueue) as PendingFeedbackItem[];
        parsed.forEach((item) => {
          pendingFeedbackRef.current[item.messageId] = item;
        });
        if (parsed.length > 0) {
          scheduleFeedbackFlush();
        }
      } catch {
        localStorage.removeItem(FEEDBACK_QUEUE_KEY);
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        void flushPendingFeedback(true);
      }
    };

    const handlePageHide = () => {
      void flushPendingFeedback(true);
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      if (feedbackFlushTimerRef.current) {
        window.clearTimeout(feedbackFlushTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto scroll to bottom khi có tin nhắn mới, nhưng không ép khi user đang xem tin nhắn cũ.
  useEffect(() => {
    if (!shouldAutoScroll) return;
    scrollToBottom("smooth");
  }, [messages, shouldAutoScroll]);

  // After history finishes loading, always scroll to the latest message
  useEffect(() => {
    if (!loadingHistory && messages.length > 0) {
      setShouldAutoScroll(true);
      const timer = setTimeout(() => scrollToBottom("auto"), 100);
      return () => clearTimeout(timer);
    }
  }, [loadingHistory]);

  // When URL loses conversationId (user navigates to fresh chat while a conversation is shown),
  // reset to a new conversation so the old messages are cleared
  useEffect(() => {
    const prev = prevConversationIdRef.current;
    prevConversationIdRef.current = conversationIdFromUrl;
    if (prev && !conversationIdFromUrl) {
      startNewConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationIdFromUrl]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Sync speech transcript to input
  useEffect(() => {
    if (transcript) {
      setInputMessage(transcript);
    }
  }, [transcript]);

  // Show speech error toast
  useEffect(() => {
    if (speechError) {
      toast.error(speechError);
    }
  }, [speechError]);

  // Auto-process pending queue once bot finishes responding
  useEffect(() => {
    if (loading || isSending || pendingQueue.length === 0) return;
    const [next, ...rest] = pendingQueue;
    setPendingQueue(rest);
    setShouldAutoScroll(true);
    setIsSending(true);
    const messageData = { message: next, userId, isLogined: !!isAuthenticated };
    sendMessageStream(messageData)
      .catch(console.error)
      .finally(() => {
        setIsSending(false);
        submitGuardRef.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isSending]);

  // Sync app header content when this chat page is active.
  useEffect(() => {
    if (messages.length > 0) {
      showChatHeader({
        conversationTitle: "Cuộc trò chuyện với Bot AI",
        messages,
      });
    } else {
      hideChatHeader();
    }

    return () => {
      hideChatHeader();
    };
  }, [messages, showChatHeader, hideChatHeader]);

  // Load conversation from URL if conversationId is present
  useEffect(() => {
    const loadConversationFromUrl = async () => {
      if (conversationIdFromUrl && userId) {
        try {
          const response = await chatService.getConversationById(conversationIdFromUrl);
          if (response.success && response.data) {
            loadConversationHistory(response.data);
          }
        } catch (error) {
          console.error("Failed to load conversation:", error);
          toast.error("Không thể tải cuộc hội thoại");
        }
      }
    };

    loadConversationFromUrl();
  }, [conversationIdFromUrl, userId, loadConversationHistory]);

  // Khởi tạo conversation mới khi component mount và chưa có conversationId
  useEffect(() => {
    if (contextChat.isNewChat && !contextChat.conversationId && !currentConversationId && !conversationIdFromUrl) {
      startNewConversation();
    }
  }, [contextChat.isNewChat, contextChat.conversationId, currentConversationId, startNewConversation, conversationIdFromUrl]);

  const fetchUploadedDocuments = async () => {
    try {
      const response = await ragService.listIngestedDocuments();
      setUploadedFiles(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = messagesContainerRef.current;
    if (!el) {
      messagesEndRef.current?.scrollIntoView({ behavior });
      return;
    }

    isProgrammaticScrollRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior });
    window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, behavior === "smooth" ? 300 : 0);
  };

  const handleScrollToLatest = () => {
    setShouldAutoScroll(true);
    // Show full history first, then jump straight to the newest message in one action.
    if (visibleCount < messages.length) {
      setVisibleCount(messages.length);
      requestAnimationFrame(() => {
        scrollToBottom("auto");
      });
      return;
    }
    scrollToBottom("auto");
  };

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;

    if (isProgrammaticScrollRef.current) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShouldAutoScroll(distanceFromBottom < 120);

    // Load more messages when user scrolls near the top
    if (el.scrollTop < 120 && visibleCount < messages.length) {
      const prevScrollHeight = el.scrollHeight;
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, messages.length));
      // Restore scroll position after prepend so view doesn't jump
      requestAnimationFrame(() => {
        el.scrollTop += el.scrollHeight - prevScrollHeight;
      });
    }
  };

  const handleCopyMessage = async (text: string) => {
    const plainText = stripMarkdown(text);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(plainText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = plainText;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!copied) {
          throw new Error("execCommand copy failed");
        }
      }
      toast.success("Đã sao chép nội dung");
    } catch (err) {
      const manual = window.prompt("Trình duyệt chặn sao chép tự động. Hãy sao chép thủ công nội dung bên dưới:", plainText);
      if (manual !== null) {
        toast.success("Đã mở chế độ sao chép thủ công");
      } else {
        toast.error("Không thể sao chép nội dung");
      }
    }
  };

  const handleEditMessage = (text: string) => {
    setInputMessage(text);
  };

  const handleRetryMessage = async (text: string) => {
    if (!text.trim() || loading || isSending) return;
    setShouldAutoScroll(true);
    const messageData = {
      message: text.trim(),
      userId: userId,
      isLogined: !!isAuthenticated,
    };
    await sendMessageStream(messageData);
  };


  const submitMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    // Prevent synchronous double-submit (before React re-renders loading state)
    if (submitGuardRef.current) return;

    // If bot is still responding, add to visible pending queue and show dimmed
    if (loading || isSending) {
      setPendingQueue(prev => [...prev, text]);
      setInputMessage("");
      setShouldAutoScroll(true);
      return;
    }

    submitGuardRef.current = true;
    setInputMessage("");
    setShouldAutoScroll(true);

    // Test mode: simulate streaming with setIsSending so spinner is reactive
    if (text.toLowerCase() === "/test") {
      setIsSending(true);
      addMessage({ recipient_id: userId, text });
      addMessage({ recipient_id: "bot", text: "" });
      const testResponse = "🧪 Test Mode Active\n\nĐây là một tin nhắn test để kiểm tra giao diện chat.\n\n✅ Không gửi đến Rasa chatbot server";
      let displayedText = "";
      let i = 0;
      let lastTick = Date.now();
      const delay = 30;

      while (i < testResponse.length) {
        const now = Date.now();
        const charsToPrint = Math.max(1, Math.floor((now - lastTick) / delay));
        displayedText += testResponse.substring(i, i + charsToPrint);
        i += charsToPrint;
        lastTick = now;

        updateLastMessage(displayedText);
        if (i < testResponse.length) await sleep(delay);
      }
      setIsSending(false);
      submitGuardRef.current = false;
      return;
    }


    // Markdown test mode: simulate streaming with markdown content
    if (text.toLowerCase() === "/testmd") {
      setIsSending(true);
      addMessage({ recipient_id: userId, text });
      addMessage({ recipient_id: "bot", text: "" });
      const testResponse =
        "# Markdown Test\n\n" +
        "This is *italic*, **bold**, and ***bold italic***.\n\n" +
        "A link example: [OpenAI](https://openai.com).\n\n" +
        "Inline code: `const x = 42`.\n\n" +
        "List:\n" +
        "- Item A\n" +
        "- Item B\n" +
        "- Item C\n\n" +
        "Ordered list:\n" +
        "1. First\n" +
        "2. Second\n" +
        "3. Third\n\n" +
        "Blockquote:\n" +
        "> This is a quote.\n\n" +
        "Code block:\n" +
        "```ts\n" +
        "function sum(a: number, b: number) {\n" +
        "  return a + b;\n" +
        "}\n" +
        "```\n\n" +
        "Table:\n" +
        "| Feature | Status |\n" +
        "| --- | --- |\n" +
        "| Markdown | OK |\n" +
        "| Copy text | OK |\n";
      let displayedText = "";
      let i = 0;
      let lastTick = Date.now();
      const delay = 20;

      while (i < testResponse.length) {
        const now = Date.now();
        const charsToPrint = Math.max(1, Math.floor((now - lastTick) / delay));
        displayedText += testResponse.substring(i, i + charsToPrint);
        i += charsToPrint;
        lastTick = now;

        updateLastMessage(displayedText);
        if (i < testResponse.length) await sleep(delay);
      }
      setIsSending(false);
      submitGuardRef.current = false;
      return;
    }

    // Loading indicator test mode: simulate delay before response
    if (text.toLowerCase() === "/testload") {
      setIsSending(true);
      addMessage({ recipient_id: userId, text });

      // Giả lập thời gian chờ AI (8 giây)
      await sleep(8000);

      // Response arrives — add bot message and start streaming
      addMessage({ recipient_id: "bot", text: "", messageId: Math.random().toString() });

      const testResponse =
        "⏱️ **Loading Test Complete!**\n\n" +
        "Đây là kết quả sau khi chatbot xử lý xong:\n\n" +
        "- ✅ Indicator hiển thị phía **bot** (bên trái)\n" +
        "- ✅ Spinner xoay và đồng hồ đếm centisecond (S,cs)\n" +
        "- ✅ Text trạng thái thay đổi theo thời gian\n" +
        "- ✅ Khi API trả về → indicator biến mất tức thời\n" +
        "- ✅ Câu trả lời streaming từng ký tự một\n" +
        "- ✅ Nút Copy / Like / Dislike xuất hiện sau khi stream xong";

      let displayedText = "";
      let i = 0;
      let lastTick = Date.now();
      const delay = 18;

      while (i < testResponse.length) {
        const now = Date.now();
        const charsToPrint = Math.max(1, Math.floor((now - lastTick) / delay));
        displayedText += testResponse.substring(i, i + charsToPrint);
        i += charsToPrint;
        lastTick = now;

        updateLastMessage(displayedText);
        if (i < testResponse.length) await sleep(delay);
      }

      setIsSending(false);
      submitGuardRef.current = false;
      return;
    }

    // Normal Rasa chat
    setIsSending(true);
    const messageData = { message: text, userId, isLogined: !!isAuthenticated };
    try {
      await sendMessageStream(messageData);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
      submitGuardRef.current = false;
    }
  };

  const handleSendMessage = async () => {
    await submitMessage(inputMessage);
  };

  const handleComposerButtonClick = async (payload: string) => {
    setInputMessage("");
    await submitMessage(payload);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickSuggestion = (text: string) => {
    setInputMessage(text);
  };

  const toggleFileUpload = () => {
    setShowFileUpload(!showFileUpload);
  };

  useEffect(() => {
    const shouldRunTimer = isSending || (loading && streamStarted);
    if (!shouldRunTimer) {
      setLoadingElapsedCs(0);
      return;
    }

    // Reset frozen label khi bắt đầu gửi mới
    setFrozenElapsedLabel(null);
    const startedAt = Date.now();
    setLoadingElapsedCs(0);
    // Cập nhật mỗi 50ms → centiseconds (1/100 giây)
    const interval = window.setInterval(() => {
      setLoadingElapsedCs(Math.floor((Date.now() - startedAt) / 10));
    }, 50);

    return () => window.clearInterval(interval);
  }, [loading, isSending, streamStarted]);

  // Detect khi bot bắt đầu trả lời (streaming bắt đầu) → đóng băng timer
  useEffect(() => {
    const shouldRunTimer = isSending || (loading && streamStarted);
    if (!shouldRunTimer) return;
    if (frozenElapsedLabel !== null) return; // đã đóng băng rồi
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.recipient_id !== userId && lastMsg.text && lastMsg.text.length > 0) {
      // Bot bắt đầu có text → đóng băng thời gian
      setFrozenElapsedLabel(formatElapsedTime(loadingElapsedCs) + "s");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, loading, isSending, streamStarted]);

  const loadSuggestedQuestions = async () => {
    if (!chatbotId) {
      setAllSuggestions(DEFAULT_QUICK_SUGGESTIONS);
      return;
    }

    try {
      const response = await chatService.getSuggestedQuestions(16);
      const items = Array.isArray(response?.data) ? response.data : [];
      const fromApi: string[] = Array.from(
        new Set(
          items
            .map((item: any) => (typeof item?.question === "string" ? item.question.trim() : ""))
            .filter((q: string) => q.length > 0)
        )
      );

      if (fromApi.length > 0) {
        const merged = Array.from(
          new Set([...fromApi, ...DEFAULT_QUICK_SUGGESTIONS])
        );
        setAllSuggestions(merged);
      } else {
        setAllSuggestions(DEFAULT_QUICK_SUGGESTIONS);
      }
    } catch {
      setAllSuggestions(DEFAULT_QUICK_SUGGESTIONS);
    }
  };

  useEffect(() => {
    if (!(messages.length === 0 && contextChat.isNewChat)) {
      return;
    }

    const delayedLoad = window.setTimeout(() => {
      void loadSuggestedQuestions();
    }, 700);

    return () => window.clearTimeout(delayedLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatbotId, messages.length, contextChat.isNewChat]);

  useEffect(() => {
    setVisibleSuggestions(pickRandomSuggestions(allSuggestions, 4));
  }, [allSuggestions]);

  // Auto-rotate suggestions every 8 seconds while still on the new chat empty state
  useEffect(() => {
    if (!(messages.length === 0 && contextChat.isNewChat)) return;
    const id = setInterval(() => {
      setVisibleSuggestions(pickRandomSuggestions(allSuggestions, 4));
    }, 8000);
    return () => clearInterval(id);
  }, [messages.length, contextChat.isNewChat, allSuggestions]);

  const visibleStartIndex = Math.max(messages.length - visibleCount, 0);
  const latestComposerButtonsIndex = [...messages]
    .map((message, index) => ({ message, index }))
    .reverse()
    .find(({ message }) => message.recipient_id !== userId && Array.isArray(message.buttons) && message.buttons.length > 0)?.index ?? -1;
  const composerButtons = latestComposerButtonsIndex >= 0 &&
    !messages.slice(latestComposerButtonsIndex + 1).some((message) => message.recipient_id === userId)
    ? (messages[latestComposerButtonsIndex].buttons ?? []).filter((button) => button.type !== "web_url")
    : [];

  const getFeedbackKey = (message: { messageId?: string }, absoluteIndex: number) => {
    if (message.messageId) return message.messageId;
    return `${currentConversationId ?? conversationIdFromUrl ?? "draft"}:${absoluteIndex}`;
  };

  const getQuestionForBotMessage = (absoluteIndex: number) => {
    for (let i = absoluteIndex - 1; i >= 0; i -= 1) {
      const candidate = messages[i];
      if (candidate?.recipient_id === userId && candidate?.text?.trim()) {
        return candidate.text.trim();
      }
    }
    return "Unknown question";
  };

  const toggleMessageFeedback = async (
    messageKey: string,
    message: { messageId?: string },
    feedback: MessageFeedback,
    absoluteIndex: number,
    answerText: string,
    sourceType?: "rasa" | "rag" | "system" | "unknown"
  ) => {
    const previousVote = messageFeedback[messageKey];
    const nextVote = previousVote === feedback ? undefined : feedback;

    setMessageFeedback((prev) => {
      const draft = { ...prev };

      if (nextVote) {
        draft[messageKey] = nextVote;
      } else {
        delete draft[messageKey];
      }

      return draft;
    });

    if (!message.messageId) {
      toast.error("Tin nhắn này chưa có messageId nên chưa gửi được đánh giá");
      return;
    }

    if (!chatbotId) {
      toast.error("Chưa chọn chatbot để ghi nhận đánh giá");
      return;
    }

    const questionText = getQuestionForBotMessage(absoluteIndex);
    const normalizedSourceType: 0 | 1 = sourceType === "rag" ? 1 : 0;

    if (nextVote) {
      pendingFeedbackRef.current[message.messageId] = {
        action: "upsert",
        messageId: message.messageId,
        chatbotId,
        userId,
        sourceType: normalizedSourceType,
        questionText,
        answerText,
        vote: nextVote,
        queuedAt: Date.now(),
      };
    } else {
      const syncedVote = syncedFeedbackRef.current[message.messageId];
      if (syncedVote) {
        pendingFeedbackRef.current[message.messageId] = {
          action: "remove",
          messageId: message.messageId,
          chatbotId,
          userId,
          sourceType: normalizedSourceType,
          questionText,
          answerText,
          vote: syncedVote,
          queuedAt: Date.now(),
        };
      } else {
        delete pendingFeedbackRef.current[message.messageId];
      }
    }

    persistFeedbackQueue();
    scheduleFeedbackFlush();
  };

  return (
    <div className="relative flex h-[calc(100svh-4rem)] min-h-0 max-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-background text-foreground">
      <main className="relative flex min-h-0 flex-1 w-full flex-col overflow-hidden p-3 md:p-4">
        <div className="w-full flex flex-col gap-3 min-h-0 flex-1">
          {/* Header removed as requested */}

          {/* Chat Area */}
          <div className="surface-card-strong relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">

            {/* Loading history overlay */}
            {loadingHistory && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                <div className="h-9 w-9 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <p className="text-sm text-muted-foreground">Đang tải cuộc trò chuyện...</p>
              </div>
            )}

            {/* Chat Messages */}
            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className="chat-container min-h-0 flex-1 overflow-y-scroll px-4 py-3"
              style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch", scrollbarGutter: "stable" }}
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <h3 className="mb-2 text-xl font-bold text-foreground">
                    {t("Start a conversation")}
                  </h3>
                  <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {t("Ask a question or request help to start the conversation")}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* "Load more" sentinel – only when there are hidden older messages */}
                  {visibleCount < messages.length && (
                    <div className="flex items-center justify-center py-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Kéo lên để xem thêm {messages.length - visibleCount} tin nhắn cũ hơn
                      </span>
                    </div>
                  )}
                  {messages.slice(visibleStartIndex).map((message, index, arr) => {
                    const isUser = message.recipient_id === userId;
                    const canVote = !!message.messageId;
                    const absoluteIndex = visibleStartIndex + index;
                    const feedbackKey = getFeedbackKey(message, absoluteIndex);
                    const feedback = messageFeedback[feedbackKey];
                    const isLastMessage = index === arr.length - 1;
                    // Check if this is the last user message (for loading indicator positioning)
                    const isLastUserMessage = isUser && !arr.slice(index + 1).some(m => m.recipient_id === userId);
                    // Streaming đã bắt đầu khi bot đã có text (dùng để ẩn loading indicator)
                    const hasStartedStreaming = arr[arr.length - 1]?.recipient_id !== userId &&
                      arr[arr.length - 1]?.text && arr[arr.length - 1].text.length > 0;

                    return (
                      <Fragment key={feedbackKey}>
                        <div
                          className={`group flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`flex min-w-[120px] flex-col ${isUser ? "max-w-[78%]" : "max-w-[90%]"}`}>
                            <div className={`mb-0.5 flex items-baseline gap-2 text-[11px] font-medium uppercase tracking-wide ${isUser ? "text-right text-slate-500 dark:text-slate-400" : "text-slate-600 dark:text-slate-300"}`}>
                              {isUser ? "Bạn" : "Trợ lý"}
                              {!isUser && isLastMessage && frozenElapsedLabel && !message.isStreaming && message.text && (
                                <span className="normal-case tracking-normal font-mono text-xs text-slate-400 dark:text-slate-500">
                                  {frozenElapsedLabel}
                                </span>
                              )}
                            </div>
                            <div
                              className={`relative rounded-lg ${isUser ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 p-4" : "bg-transparent text-foreground pt-1 px-4 pb-4"}`}
                            >
                              <MarkdownMessage content={message.text} />

                              {/* Message Buttons */}
                              {message.buttons && message.buttons.length > 0 && (
                                <div className="flex flex-col gap-2 mt-3">
                                  {message.buttons.map((button, idx) => (
                                    button.type === "web_url" ? (
                                      <a
                                        key={idx}
                                        href={button.payload}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm text-sm no-underline group"
                                      >
                                        <span className="text-lg">📄</span>
                                        <span className="flex-1 text-left truncate font-medium">
                                          {button.title}
                                        </span>
                                        <span className="opacity-80 group-hover:translate-y-0.5 transition-transform">⬇️</span>
                                      </a>
                                    ) : null
                                  ))}
                                </div>
                              )}

                              {!message.isStreaming && <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>
                                  {new Date().toLocaleTimeString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleCopyMessage(message.text)}
                                    className="rounded px-2 py-1 hover:bg-slate-200/70 dark:hover:bg-slate-700"
                                    title="Sao chép"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                  {!isUser && (
                                    <>
                                      <button
                                        onClick={() => void toggleMessageFeedback(feedbackKey, message, "like", absoluteIndex, message.text, message.sourceType)}
                                        disabled={!canVote}
                                        aria-pressed={feedback === "like"}
                                        className={`rounded px-2 py-1 transition-colors ${feedback === "like" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300" : "hover:bg-slate-200/70 dark:hover:bg-slate-700"} ${!canVote ? "cursor-not-allowed opacity-40 hover:bg-transparent dark:hover:bg-transparent" : ""}`}
                                        title={canVote ? t("Like response") : "Tin nhắn này chưa hỗ trợ đánh giá"}
                                      >
                                        <ThumbsUp className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => void toggleMessageFeedback(feedbackKey, message, "dislike", absoluteIndex, message.text, message.sourceType)}
                                        disabled={!canVote}
                                        aria-pressed={feedback === "dislike"}
                                        className={`rounded px-2 py-1 transition-colors ${feedback === "dislike" ? "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-300" : "hover:bg-slate-200/70 dark:hover:bg-slate-700"} ${!canVote ? "cursor-not-allowed opacity-40 hover:bg-transparent dark:hover:bg-transparent" : ""}`}
                                        title={canVote ? t("Dislike response") : "Tin nhắn này chưa hỗ trợ đánh giá"}
                                      >
                                        <ThumbsDown className="h-3.5 w-3.5" />
                                      </button>
                                    </>
                                  )}
                                  {isUser && (
                                    <>
                                      <button
                                        onClick={() => handleEditMessage(message.text)}
                                        className="rounded px-2 py-1 hover:bg-slate-200/70 dark:hover:bg-slate-700"
                                        title="Sửa nội dung để gửi lại"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleRetryMessage(message.text)}
                                        disabled={loading}
                                        className="rounded px-2 py-1 hover:bg-slate-200/70 disabled:opacity-50 dark:hover:bg-slate-700"
                                        title="Gửi lại"
                                      >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>}
                            </div>
                          </div>
                        </div>
                        {/* Loading indicator: chỉ hiển khi chưa bắt đầu streaming */}
                        {isUser && isLastUserMessage && (loading || isSending) && !hasStartedStreaming && (
                          <div className="flex justify-start mt-3 animate-fadeInUp">
                            <div className="flex min-w-[120px] max-w-[90%] flex-col">
                              {/* Không có label — để chỉ hiển 1 cái "Trợ lý" từ message thực */}
                              <div className="inline-flex items-center gap-2 px-1 py-1">
                                {/* Spinner */}
                                <div className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin dark:border-slate-600 dark:border-t-blue-400" />
                                {/* Status text */}
                                <span className="text-xs text-slate-600 dark:text-slate-300">
                                  {waitingStatusText}
                                </span>
                                {/* Timer */}
                                <span className="text-xs text-slate-600 dark:text-slate-300">
                                  {formatElapsedTime(loadingElapsedCs)}s
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </Fragment>
                    );
                  })}
                  {/* Pending (queued) messages shown dimmed while bot is busy */}
                  {pendingQueue.map((text, i) => (
                    <div key={`pending-${i}`} className="flex justify-end opacity-40">
                      <div className="flex min-w-[120px] max-w-[78%] flex-col">
                        <div className="mb-1 text-right text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Bạn
                        </div>
                        <div className="relative rounded-lg bg-slate-100 p-4 text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
                          <p className="mt-1 text-[10px] text-slate-400">Đang chờ gửi...</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {messages.length > 0 && !shouldAutoScroll && (
              <button
                onClick={handleScrollToLatest}
                className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-lg transition-all duration-200 hover:bg-blue-700"
                title="Về tin nhắn mới nhất"
              >
                <ArrowDown className="h-3.5 w-3.5" />
                Tin nhắn mới nhất
              </button>
            )}
          </div>

          {/* Quick Suggestions Grid */}
          {messages.length === 0 && contextChat.isNewChat && (
            <div className="relative w-full">
              <div
                className="grid grid-cols-1 gap-3 rounded-[1.75rem] border border-slate-200/75 bg-slate-100/65 p-3 sm:grid-cols-2 lg:grid-cols-4 flex-shrink-0 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/55"
                style={{
                  animation: "fadeIn 1s ease-out 0.4s backwards",
                }}
              >
                {visibleSuggestions.map((suggestion, index) => {
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickSuggestion(suggestion)}
                      className="surface-card relative rounded-2xl border border-slate-200/80 bg-slate-50/95 px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-800/80 dark:hover:border-white/20 dark:hover:bg-slate-800"
                      style={{ animation: `fadeInUp 0.5s ease-out ${0.06 * index}s backwards` }}
                    >
                      <div className="text-sm font-medium leading-relaxed text-foreground">
                        {suggestion}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Suggestions randomized on mount; navigation removed */}
            </div>
          )}

          {/* Input Area with Glass Effect */}
          <div
            className="z-30 w-full flex-shrink-0 space-y-2 pb-1"
            style={{
              animation: "fadeInUp 0.8s ease-out 0.6s backwards",
            }}
          >
            {composerButtons.length > 0 && (
              <div className="surface-card-strong overflow-hidden rounded-2xl border border-slate-200/80 bg-background/95 px-3 py-2 backdrop-blur dark:border-white/15">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {composerButtons.map((button, index) => (
                    <button
                      key={`${button.payload}-${index}`}
                      onClick={() => void handleComposerButtonClick(button.payload)}
                      className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium whitespace-nowrap text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20"
                    >
                      {button.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative group">
              <div className="surface-card-strong relative rounded-2xl border border-slate-200/80 bg-background/95 backdrop-blur dark:border-white/15">
                <Input
                  placeholder={loading || isSending ? "Bot đang trả lời, tin nhắn của bạn sẽ được gửi sau..." : "Hỏi bất kỳ điều gì bạn muốn biết..."}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[58px] resize-none rounded-2xl border-none bg-transparent py-3 pl-5 pr-32 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                />

                {/* Right Buttons */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                  <button
                    onClick={() => {
                      if (isListening) {
                        stopListening();
                      } else {
                        resetTranscript();
                        startListening();
                      }
                    }}
                    disabled={!isSpeechSupported}
                    title={!isSpeechSupported ? 'Trình duyệt không hỗ trợ' : isListening ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
                    className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isListening ? 'animate-pulse border-red-400/60 bg-red-500 text-white' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    {isListening ? (
                      <MicOff className="h-5 w-5 text-white" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() && pendingQueue.length === 0}
                    className="relative h-10 w-10 rounded-xl flex items-center justify-center border border-blue-500/40 bg-blue-600 text-white transition-all duration-200 hover:scale-105 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    title={pendingQueue.length > 0 ? `${pendingQueue.length} tin nhắn đang chờ` : undefined}
                  >
                    {loading || isSending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <SendHorizonal className="h-5 w-5 text-white" />
                    )}
                    {pendingQueue.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[9px] font-bold text-slate-900">
                        {pendingQueue.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Chat Bot có thể mắc lỗi. Hãy kiểm tra các thông tin quan trọng.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Custom scrollbar for chat container */
        .chat-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(59, 130, 246, 0.3) transparent;
        }

        .chat-container::-webkit-scrollbar {
          width: 6px;
        }

        .chat-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }

        .chat-container::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.4);
          border-radius: 10px;
          transition: background-color 0.2s ease;
        }

        .chat-container::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.6);
        }

        /* Input focus enhancement */
        .group:focus-within input {
          caret-color: #3b82f6;
        }
      `}</style>
    </div>
  );
}
