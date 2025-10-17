import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Mic, Plus, Search, SendHorizonal, Loader2 } from "lucide-react";
import { useState, KeyboardEvent, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";

const RASA_URL = import.meta.env.VITE_RASA_URL || 'http://localhost:5005';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface RasaResponse {
  recipient_id: string;
  text: string;
}

export function HomeChatDemoWithoutLogin() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${RASA_URL}/webhooks/rest/webhook`, {
        sender: "user_" + Date.now(),
        message: inputMessage.trim(),
      });

      const rasaResponses: RasaResponse[] = response.data;

      if (rasaResponses && rasaResponses.length > 0) {
        if (rasaResponses.length === 1) {
          // Single response - add immediately
          const botMessage: Message = {
            id: `${Date.now()}`,
            text: rasaResponses[0].text,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, botMessage]);
        } else {
          // Multiple responses - add with slight delay for natural feel
          rasaResponses.forEach((rasaResponse, index) => {
            setTimeout(() => {
              const botMessage: Message = {
                id: `${Date.now()}_${index}`,
                text: rasaResponse.text,
                isUser: false,
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, botMessage]);
            }, index * 800); // 800ms delay between messages
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại.");

      // Add error message
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        text: "Xin lỗi, tôi không thể phản hồi lúc này. Vui lòng thử lại sau.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="relative flex flex-col bg-gradient-to-b from-blue-50 to-white text-foreground">
      {/* Header */}
      {/* <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm py-3 px-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-center">
          <MessageSquare className="h-6 w-6 text-blue-500 mr-2" />
          <h1 className="text-xl font-semibold text-blue-700">AI Assistant</h1>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-between p-4 md:p-6 overflow-auto">
        <div className="max-w-3xl w-full flex flex-col">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center text-blue-800">
            Tôi có thể giúp gì cho bạn?
          </h2>

          {/* Chat container */}
          <div className="flex-1 border rounded-2xl p-5 mb-6 bg-white shadow-lg h-[450px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-blue-400" />
                </div>
                <p className="text-lg font-medium mb-2">
                  Bắt đầu cuộc trò chuyện
                </p>
                <p className="text-sm max-w-xs">
                  Hãy đặt câu hỏi hoặc yêu cầu trợ giúp để bắt đầu cuộc trò chuyện
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.isUser
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Đang trả lời...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <Select value={selectedChatbot} onValueChange={setSelectedChatbot}>
            <SelectTrigger className="h-8 text-sm mb-4">
              <SelectValue placeholder="Select a chatbot" />
            </SelectTrigger>
            <SelectContent className="text-sm">
              <SelectItem value="bot1">Chatbot 1</SelectItem>
              <SelectItem value="bot2">Chatbot 2</SelectItem>
            </SelectContent>
          </Select>

          {/* Input Area */}
          <div className="w-full relative">
            <div className="relative rounded-xl border border-blue-200 bg-white shadow-md transition-all focus-within:shadow-lg focus-within:border-blue-300">
              <Input
                placeholder="Hỏi bất kỳ điều gì"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="min-h-[60px] pl-12 pr-12 py-4 rounded-xl border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-700"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <SendHorizonal className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                >
                  <Mic className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2 mt-3 justify-center">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-blue-200 bg-white text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
              >
                <Search className="h-4 w-4 mr-2" />
                Tìm kiếm
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-2 text-center text-sm text-gray-500 bg-white/80 backdrop-blur-sm border-t">
        <div className="max-w-2xl mx-auto">
          Chat Bot có thể mắc lỗi. Hãy kiểm tra các thông tin quan trọng.
        </div>
      </footer>
    </div>
  );
}
