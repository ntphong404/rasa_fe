import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Mic,
  Plus,
  SendHorizonal,
  Lightbulb,
  Code,
  Palette,
  Bot,
  User,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { MessageActions } from "@/features/chat/components/MessageActions";
import { ConversationExport } from "@/features/chat/components/ConversationExport";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { useAuthStore } from "@/store/auth";
import toast from "react-hot-toast";
import { useChatContext } from "@/features/chat/context/ChatContext";

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
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = useCurrentUserId();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const chatbotId = "68e22e6345898f7f46405ecc";

  // Get chatHook from context or create default one
  const contextChat = useChatContext();
  const fallbackChatHook = useChat(chatbotId);

  const chatHook = contextChat.chatHook || fallbackChatHook;
  const {
    messages,
    loading,
    error,
    sendMessage,
    clearError,
    currentConversationId,
    startNewConversation,
  } = chatHook;

  // Khi đã có tin nhắn, muốn khung chat lớn hơn và cố định chiều cao
  const chatHeightClass = messages && messages.length > 0 ? 'h-[400px] md:h-[465px]' : 'h-[200px] md:h-[300px]';

  // Auto scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Khởi tạo conversation mới khi component mount và chưa có conversationId
  useEffect(() => {
    if (contextChat.isNewChat && !contextChat.conversationId && !currentConversationId) {
      startNewConversation();
    }
  }, [contextChat.isNewChat, contextChat.conversationId, currentConversationId, startNewConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    // Bỏ conversationId vì sẽ được handle trong useChat hook
    const messageData = {
      message: inputMessage.trim(),
      userId: userId,
      // Gán trạng thái đăng nhập thực tế (true nếu đã đăng nhập, false nếu chưa)
      isLogined: !!isAuthenticated,
    };

    try {
      await sendMessage(messageData);
      setInputMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
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

  return (
    <div
      className="relative flex flex-col min-h-0 text-foreground"
      style={{
        background: "linear-gradient(180deg, #f0f9ff 0%, #fefefe 100%)",
      }}
    >
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0) 70%)",
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(99, 102, 241, 0) 70%)",
            animation: "float 8s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Main Content */}
      <main className="relative flex flex-col items-center justify-center p-3 md:p-4 max-h-screen overflow-hidden">
        <div className="max-w-4xl w-full flex flex-col gap-3 min-h-0 justify-center py-2">
          {/* Header removed as requested */}

          {/* Chat Area */}
          <div
            className={`rounded-3xl flex flex-col ${chatHeightClass} relative flex-shrink overflow-hidden`}
            style={{
              background: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(15px)",
              border: "1px solid rgba(59, 130, 246, 0.15)",
              boxShadow: "0 8px 32px rgba(59, 130, 246, 0.1)",
              animation: "fadeIn 0.8s ease-out 0.2s backwards",
            }}
          >
            {/* Chat Header */}
            {messages.length > 0 && (
              <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white/60 backdrop-blur-sm rounded-t-3xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">
                      Cuộc trò chuyện
                    </h3>
                    <span className="text-xs text-gray-500">
                      {messages.length} tin nhắn
                    </span>
                  </div>
                </div>
                <ConversationExport
                  messages={messages}
                  conversationTitle="Cuộc trò chuyện với Bot AI"
                />
              </div>
            )}

            {/* Chat Messages */}
            <div
              className="flex-1 p-2 overflow-y-auto chat-container"
              style={{
                scrollBehavior: "smooth",
              }}
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4 relative"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))",
                      backdropFilter: "blur(10px)",
                      border: "2px solid rgba(59, 130, 246, 0.1)",
                    }}
                  >
                    <MessageSquare className="h-8 w-8 text-blue-500" />
                    <div
                      className="absolute inset-0 rounded-full border-2 border-blue-200"
                      style={{
                        animation:
                          "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      }}
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-800">
                    Bắt đầu cuộc trò chuyện
                  </h3>
                  <p className="text-sm max-w-sm text-gray-600 leading-relaxed">
                    Chọn gợi ý bên dưới hoặc nhập câu hỏi của bạn để bắt đầu trò
                    chuyện với AI
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, index) => {
                    // Debug: log để xem cấu trúc message
                    console.log("Message:", message, "chatbotId:", chatbotId);

                    // Logic chính xác:
                    // - User message có recipient_id = userId
                    // - Bot message có recipient_id = "bot"
                    const isUser = message.recipient_id === userId;

                    console.log(
                      "isUser:",
                      isUser,
                      "index:",
                      index,
                      "recipient_id:",
                      message.recipient_id,
                      "current userId:",
                      userId
                    );

                    return (
                      <div
                        key={index}
                        className={`group flex gap-3 ${isUser ? "justify-end" : "justify-start"
                          } animate-fadeInUp`}
                        style={{
                          animation: `fadeInUp 0.4s ease-out ${index * 0.1
                            }s backwards`,
                        }}
                      >
                        {!isUser && (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-white">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div className="flex flex-col max-w-[80%] min-w-[120px]">
                          <div
                            className={`p-4 rounded-2xl shadow-sm relative transition-all duration-200 hover:shadow-md ${isUser
                              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md ml-auto"
                              : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"
                              }`}
                            style={{
                              boxShadow: isUser
                                ? "0 4px 15px rgba(59, 130, 246, 0.25)"
                                : "0 4px 15px rgba(0, 0, 0, 0.08)",
                            }}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.text}
                            </p>
                            <div
                              className={`text-xs opacity-75 mt-3 flex items-center justify-between ${isUser ? "text-blue-100" : "text-gray-500"
                                }`}
                            >
                              <span className="font-medium">
                                {isUser ? "Bạn" : "Bot AI"}
                              </span>
                              <span className="text-xs opacity-60">
                                {new Date().toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            {!isUser && (
                              <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <MessageActions
                                  message={message.text}
                                  isBot={true}
                                  className="ml-2"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        {isUser && (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-white">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {loading && (
                    <div className="flex gap-3 justify-start animate-fadeInUp">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-white">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div
                        className="max-w-[80%] p-4 rounded-2xl bg-white border border-gray-100 rounded-bl-md shadow-sm"
                        style={{
                          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
                        }}
                      >
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
                          <span className="text-sm text-gray-600 font-medium">
                            Bot đang soạn tin...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Quick Suggestions Grid */}
          {messages.length === 0 && contextChat.isNewChat && (
            <div className="relative w-full">
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0"
                style={{
                  animation: "fadeIn 1s ease-out 0.4s backwards",
                }}
              >
                {visibleSuggestions.map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickSuggestion(suggestion.text)}
                      className="group relative p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: "rgba(255, 255, 255, 0.85)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(59, 130, 246, 0.2)",
                        boxShadow: "0 4px 15px rgba(59, 130, 246, 0.1)",
                        animation: `fadeInUp 0.6s ease-out ${0.08 * index}s backwards`,
                      }}
                    >
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${suggestion.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                          style={{
                            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
                          }}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-800 leading-tight block">
                            {suggestion.text}
                          </span>
                          <span className="text-xs text-gray-500 mt-1 block">
                            Nhấn để bắt đầu
                          </span>
                        </div>
                      </div>

                      {/* Hover gradient effect */}
                      <div
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${suggestion.color.split(" ")[1]} 0%, ${suggestion.color.split(" ")[3]} 100%)`,
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Suggestions randomized on mount; navigation removed */}
            </div>
          )}

          {/* Input Area with Glass Effect */}
          <div
            className="w-full space-y-3 flex-shrink-0"
            style={{
              animation: "fadeInUp 0.8s ease-out 0.6s backwards",
            }}
          >
            <div className="relative group">
              {/* Glow Effect on Focus */}
              <div
                className="absolute -inset-1 rounded-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))",
                  filter: "blur(15px)",
                }}
              />

              <div
                className="relative rounded-3xl transition-all duration-300 group-focus-within:scale-[1.01]"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1.5px solid rgba(59, 130, 246, 0.25)",
                  boxShadow: "0 8px 32px rgba(59, 130, 246, 0.12)",
                }}
              >
                <Input
                  placeholder="Hỏi bất kỳ điều gì bạn muốn biết..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="min-h-[64px] pl-16 pr-32 py-4 rounded-3xl border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base bg-transparent text-gray-800 placeholder:text-gray-500 resize-none"
                  style={{
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  }}
                />

                {/* Left Button */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <button
                    className="h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                    style={{
                      background: "rgba(59, 130, 246, 0.1)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(59, 130, 246, 0.15)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 15px rgba(59, 130, 246, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(59, 130, 246, 0.1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <Plus className="h-5 w-5 text-blue-600" />
                  </button>
                </div>

                {/* Right Buttons */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                  <button
                    className="h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                    style={{
                      background: "rgba(59, 130, 246, 0.1)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(59, 130, 246, 0.15)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 15px rgba(59, 130, 246, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(59, 130, 246, 0.1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <Mic className="h-5 w-5 text-blue-600" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={loading || !inputMessage.trim()}
                    className="h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      background:
                        inputMessage.trim() && !loading
                          ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
                          : "rgba(59, 130, 246, 0.3)",
                      boxShadow:
                        inputMessage.trim() && !loading
                          ? "0 4px 15px rgba(59, 130, 246, 0.4)"
                          : "none",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && inputMessage.trim()) {
                        e.currentTarget.style.boxShadow =
                          "0 6px 20px rgba(59, 130, 246, 0.5)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && inputMessage.trim()) {
                        e.currentTarget.style.boxShadow =
                          "0 4px 15px rgba(59, 130, 246, 0.4)";
                      }
                    }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <SendHorizonal className="h-5 w-5 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
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

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(1deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.05);
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

        /* Smooth transitions for all interactive elements */
        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Input focus enhancement */
        .group:focus-within input {
          caret-color: #3b82f6;
        }
        
        /* Message hover effects */
        .group:hover .message-actions {
          opacity: 1;
          transform: translateY(0);
        }
        
        .message-actions {
          opacity: 0;
          transform: translateY(5px);
          transition: all 0.2s ease;
        }

        /* Button click feedback */
        button:active {
          transform: scale(0.95);
        }

        /* Gradient animation for loading states */
        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }

        .shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200px 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
