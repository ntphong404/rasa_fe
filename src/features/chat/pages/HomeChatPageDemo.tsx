import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Mic,
  MicOff,
  SendHorizonal,
  Lightbulb,
  Code,
  Palette,
  Bot,
  User,
  Pencil,
  Copy,
  RotateCcw,
  Plus,
  ArrowDown,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
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
import { responseService } from "@/features/reponses/api/service";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

// List of available quick suggestions (stable reference)
const QUICK_SUGGESTIONS = [
  { icon: Lightbulb, text: "Chiều cao để xe chữa cháy di chuyển được là bao nhiêu?", color: "from-yellow-200 to-yellow-300" },
  { icon: Code, text: "Các nội dung thẩm định thiết kế về phòng cháy và chữa cháy?", color: "from-red-200 to-red-300" },
  { icon: Palette, text: "Hồ sơ đề nghị thẩm định thiết kế về phòng cháy và chữa cháy?", color: "from-orange-200 to-orange-300" },
  { icon: MessageSquare, text: "Yêu cầu PCCC trong quy hoạch xây dựng", color: "from-blue-200 to-blue-300" },
  { icon: Bot, text: "Thời hạn thẩm định thiết kế về PCCC bao lâu?", color: "from-emerald-200 to-emerald-300" },
  { icon: User, text: "Phân loại bộ phân ngăn cháy", color: "from-indigo-200 to-indigo-300" },
  { icon: Plus, text: "Quy định Chiều mở cửa thoát nạn", color: "from-pink-200 to-pink-300" },
  { icon: Mic, text: "Quy định Nguồn điện cho hệ thống báo cháy tự động", color: "from-cyan-200 to-cyan-300" },
  { icon: SendHorizonal, text: "Độ cao lắp đặt của hộp nút ấn báo cháy", color: "from-lime-200 to-lime-300" },
  { icon: MessageSquare, text: "Số lượng bơm chữa cháy dự phòng", color: "from-sky-200 to-sky-300" },
];

export function HomeChatDemo() {
  const { t } = useTranslation();
  type MessageFeedback = "like" | "dislike";
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  // How many messages to show from the END (progressive load upward)
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Visible pending messages shown as dimmed bubbles while bot is responding
  const [pendingQueue, setPendingQueue] = useState<string[]>([]);
  const [messageFeedback, setMessageFeedback] = useState<Record<string, MessageFeedback | undefined>>({});
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
  const { selectedBotId, chatbots } = useChatbotStore();
  
  // Get the _id of selected chatbot
  const selectedChatbot = chatbots.find((bot) => bot.botId === selectedBotId);
  const chatbotId = selectedChatbot?._id || "";
  
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
  const fallbackChatHook = useChat(chatbotId);

  const chatHook = contextChat.chatHook || fallbackChatHook;
  const {
    messages,
    loading,
    loadingHistory,
    error,
    sendMessage,
    clearError,
    currentConversationId,
    startNewConversation,
    loadConversationHistory,
    addMessage,
    updateLastMessage,
  } = chatHook;
  const showChatHeader = useChatHeaderStore((state) => state.showChatHeader);
  const hideChatHeader = useChatHeaderStore((state) => state.hideChatHeader);

  // Reset visible window and auto-scroll whenever the active conversation changes
  useEffect(() => { setVisibleCount(PAGE_SIZE); setShouldAutoScroll(true); }, [currentConversationId]);

  // Fetch uploaded documents on mount
  useEffect(() => {
    fetchUploadedDocuments();
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
    sendMessage(messageData)
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
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
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
      const manual = window.prompt("Trình duyệt chặn sao chép tự động. Hãy sao chép thủ công nội dung bên dưới:", text);
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
    await sendMessage(messageData);
  };


  const handleSendMessage = async () => {
    const text = inputMessage.trim();
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
      for (let i = 0; i < testResponse.length; i++) {
        displayedText += testResponse[i];
        updateLastMessage(displayedText);
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      setIsSending(false);
      submitGuardRef.current = false;
      return;
    }

    // Normal Rasa chat
    setIsSending(true);
    const messageData = { message: text, userId, isLogined: !!isAuthenticated };
    try {
      await sendMessage(messageData);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
      submitGuardRef.current = false;
    }
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


  // show 4 random suggestions on mount
  const [visibleSuggestions, setVisibleSuggestions] = useState(() => QUICK_SUGGESTIONS.slice(0, 4));

  useEffect(() => {
    const shuffled = [...QUICK_SUGGESTIONS].sort(() => Math.random() - 0.5);
    setVisibleSuggestions(shuffled.slice(0, 4));
    // run only on mount
  }, []);

  // Auto-rotate suggestions every 8 seconds while still on the new chat empty state
  useEffect(() => {
    if (!(messages.length === 0 && contextChat.isNewChat)) return;
    const id = setInterval(() => {
      const shuffled = [...QUICK_SUGGESTIONS].sort(() => Math.random() - 0.5);
      setVisibleSuggestions(shuffled.slice(0, 4));
    }, 8000);
    return () => clearInterval(id);
  }, [messages.length, contextChat.isNewChat]);

  const visibleStartIndex = Math.max(messages.length - visibleCount, 0);

  const getFeedbackKey = (absoluteIndex: number) => {
    return `${currentConversationId ?? conversationIdFromUrl ?? "draft"}:${absoluteIndex}`;
  };

  const toggleMessageFeedback = async (
    messageKey: string,
    message: { responseId?: string },
    feedback: MessageFeedback
  ) => {
    const current = messageFeedback[messageKey];
    const next = current === feedback ? undefined : feedback;

    setMessageFeedback((prev) => {
      const next = { ...prev };

      if (next[messageKey] === feedback) {
        delete next[messageKey];
      } else {
        next[messageKey] = feedback;
      }

      return next;
    });

    if (!message.responseId) {
      toast.error("Phản hồi này chưa có responseId nên chưa gửi được đánh giá");
      return;
    }

    try {
      await responseService.submitResponseFeedback(message.responseId, next ?? null);
    } catch (error) {
      setMessageFeedback((prev) => {
        const rollback = { ...prev };
        if (current) {
          rollback[messageKey] = current;
        } else {
          delete rollback[messageKey];
        }
        return rollback;
      });
      toast.error(t("Unable to record feedback right now"));
    }
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
                  {messages.slice(visibleStartIndex).map((message, index) => {
                    const isUser = message.recipient_id === userId;
                    const canVote = !!message.responseId;
                    const absoluteIndex = visibleStartIndex + index;
                    const feedbackKey = getFeedbackKey(absoluteIndex);
                    const feedback = messageFeedback[feedbackKey];

                    return (
                      <div
                        key={feedbackKey}
                        className={`group flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex min-w-[120px] flex-col ${isUser ? "max-w-[78%]" : "max-w-[90%]"}`}>
                          <div className={`mb-1 text-[11px] font-medium uppercase tracking-wide ${isUser ? "text-right text-slate-500 dark:text-slate-400" : "text-slate-600 dark:text-slate-300"}`}>
                            {isUser ? "Bạn" : "Trợ lý"}
                          </div>
                          <div
                            className={`relative rounded-lg p-4 ${isUser ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100" : "bg-transparent text-foreground"}`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.text}
                            </p>
                            
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
                                      onClick={() => void toggleMessageFeedback(feedbackKey, message, "like")}
                                      disabled={!canVote}
                                      aria-pressed={feedback === "like"}
                                      className={`rounded px-2 py-1 transition-colors ${feedback === "like" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300" : "hover:bg-slate-200/70 dark:hover:bg-slate-700"} ${!canVote ? "cursor-not-allowed opacity-40 hover:bg-transparent dark:hover:bg-transparent" : ""}`}
                                      title={canVote ? t("Like response") : "Tin nhắn này chưa hỗ trợ đánh giá"}
                                    >
                                      <ThumbsUp className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => void toggleMessageFeedback(feedbackKey, message, "dislike")}
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
                    );
                  })}
                  {loading && (
                    <div className="flex gap-3 justify-start animate-fadeInUp">
                      <div className="max-w-[90%] rounded-lg bg-transparent p-2">
                        <div className="flex space-x-2 items-center">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-muted-foreground">
                            Bot đang soạn tin...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
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
                      onClick={() => handleQuickSuggestion(suggestion.text)}
                      className="surface-card relative rounded-2xl border border-slate-200/80 bg-slate-50/95 px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-800/80 dark:hover:border-white/20 dark:hover:bg-slate-800"
                      style={{ animation: `fadeInUp 0.5s ease-out ${0.06 * index}s backwards` }}
                    >
                      <div className="text-sm font-medium leading-relaxed text-foreground">
                        {suggestion.text}
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
