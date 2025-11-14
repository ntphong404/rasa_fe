// import { Input } from "@/components/ui/input";
// import {
//   MessageSquare,
//   Mic,
//   Plus,
//   SendHorizonal,
//   Sparkles,
//   Lightbulb,
//   Code,
//   Palette,
//   Bot,
//   User,
// } from "lucide-react";
// import { useState, useRef, useEffect } from "react";
// import { useChat, UseChatReturn } from "@/hooks/useChat";
// import { ISendMessageRequest } from "@/interfaces/chat.interface";
// import { MessageActions } from "@/features/chat/components/MessageActions";
// import { ConversationExport } from "@/features/chat/components/ConversationExport";
// import toast from "react-hot-toast";

// interface HomeChatDemoProps {
//   conversationId?: string;
//   isNewChat?: boolean;
//   chatHook?: UseChatReturn;
// }

// export function HomeChatDemo({
//   conversationId,
//   isNewChat = true,
//   chatHook,
// }: HomeChatDemoProps = {}) {
//   const [inputMessage, setInputMessage] = useState("");
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   const chatbotId = "68e22e6345898f7f46405ecc";

//   // Use provided chatHook or create new one
//   const defaultChatHook = useChat(chatbotId);
//   const { messages, loading, error, sendMessage, clearError } =
//     chatHook || defaultChatHook;

//   // Auto scroll to bottom khi có tin nhắn mới
//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // Show error toast
//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//       clearError();
//     }
//   }, [error, clearError]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   const handleSendMessage = async () => {
//     if (!inputMessage.trim() || loading) return;

//     const messageData: ISendMessageRequest = {
//       message: inputMessage.trim(),
//       conversationId: conversationId || "68d8d10919e38bef7a50c1da", // Use provided or default
//       userId: "68d8d10919e38bef7a50c1db", // Từ ví dụ
//       isLogined: true,
//     };

//     try {
//       await sendMessage(messageData);
//       setInputMessage("");
//     } catch (err) {
//       console.error("Error sending message:", err);
//     }
//   };

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   const handleQuickSuggestion = (text: string) => {
//     setInputMessage(text);
//   };
//   const quickSuggestions = [
//     {
//       icon: Lightbulb,
//       text: "Giải thích về AI",
//       color: "from-blue-200 to-blue-300",
//     },
//     {
//       icon: Code,
//       text: "Viết code React",
//       color: "from-indigo-200 to-indigo-300",
//     },
//     {
//       icon: Palette,
//       text: "Ý tưởng sáng tạo",
//       color: "from-purple-200 to-purple-300",
//     },
//     {
//       icon: MessageSquare,
//       text: "Tóm tắt văn bản",
//       color: "from-teal-200 to-teal-300",
//     },
//   ];

//   return (
//     <div
//       className="relative flex flex-col min-h-screen text-foreground"
//       style={{
//         background: "linear-gradient(180deg, #f0f9ff 0%, #fefefe 100%)",
//       }}
//     >
//       {/* Animated Background Circles */}
//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         <div
//           className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10"
//           style={{
//             background:
//               "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0) 70%)",
//             animation: "float 6s ease-in-out infinite",
//           }}
//         />
//         <div
//           className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
//           style={{
//             background:
//               "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(99, 102, 241, 0) 70%)",
//             animation: "float 8s ease-in-out infinite reverse",
//           }}
//         />
//       </div>

//       {/* Main Content */}
//       <main className="relative flex-1 flex flex-col items-center justify-center p-3 md:p-4 max-h-screen overflow-hidden">
//         <div className="max-w-4xl w-full flex flex-col gap-3 h-full justify-center py-2">
//           {/* Header Section with Icon */}
//           <div
//             className="text-center space-y-2"
//             style={{
//               animation: "fadeInUp 0.6s ease-out",
//             }}
//           >
//             <div
//               className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-1 relative"
//               style={{
//                 background:
//                   "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))",
//                 backdropFilter: "blur(10px)",
//                 boxShadow: "0 4px 20px rgba(59, 130, 246, 0.1)",
//               }}
//             >
//               <Sparkles className="h-8 w-8 text-blue-500" />
//               <div
//                 className="absolute inset-0 rounded-full"
//                 style={{
//                   animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
//                   background: "rgba(59, 130, 246, 0.1)",
//                 }}
//               />
//             </div>
//             <h2
//               className="text-2xl md:text-3xl font-bold text-gray-700 mb-1"
//               style={{
//                 textShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
//               }}
//             >
//               Tôi có thể giúp gì cho bạn?
//             </h2>
//             <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
//               Trợ lý AI thông minh giúp bạn viết, phân tích và sáng tạo
//             </p>
//           </div>

//           {/* Chat Header */}
//           {messages.length > 0 && (
//             <div className="flex items-center justify-between p-4 border-b border-gray-200">
//               <div className="flex items-center gap-2">
//                 <MessageSquare className="h-5 w-5 text-gray-500" />
//                 <h3 className="font-medium text-gray-700">Cuộc trò chuyện</h3>
//                 <span className="text-sm text-gray-500">
//                   ({messages.length} tin nhắn)
//                 </span>
//               </div>
//               <ConversationExport
//                 messages={messages}
//                 conversationTitle="Cuộc trò chuyện với Bot AI"
//               />
//             </div>
//           )}

//           {/* Chat Container with Messages */}
//           <div
//             className="rounded-2xl p-4 h-[300px] md:h-[400px] overflow-y-auto relative flex-shrink-0 chat-container"
//             style={{
//               background: "rgba(255, 255, 255, 0.7)",
//               backdropFilter: "blur(10px)",
//               border: "1px solid rgba(59, 130, 246, 0.1)",
//               boxShadow: "0 4px 20px rgba(59, 130, 246, 0.08)",
//               animation: "fadeIn 0.8s ease-out 0.2s backwards",
//             }}
//           >
//             {messages.length === 0 ? (
//               <div className="h-full flex flex-col items-center justify-center text-center p-4">
//                 <div
//                   className="w-16 h-16 rounded-full flex items-center justify-center mb-3 relative"
//                   style={{
//                     background:
//                       "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1))",
//                     backdropFilter: "blur(10px)",
//                   }}
//                 >
//                   <MessageSquare className="h-8 w-8 text-blue-500" />
//                 </div>
//                 <p className="text-lg font-semibold mb-2 text-gray-700">
//                   Bắt đầu cuộc trò chuyện
//                 </p>
//                 <p className="text-xs md:text-sm max-w-md text-gray-500">
//                   Chọn gợi ý bên dưới hoặc nhập câu hỏi của bạn để bắt đầu
//                 </p>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {messages.map((message, index) => {
//                   const isUser =
//                     message.recipient_id === "68d8d10919e38bef7a50c1db";
//                   return (
//                     <div
//                       key={index}
//                       className={`group flex gap-3 ${
//                         isUser ? "justify-end" : "justify-start"
//                       } animate-fadeInUp`}
//                       style={{
//                         animation: `fadeInUp 0.3s ease-out ${
//                           index * 0.1
//                         }s backwards`,
//                       }}
//                     >
//                       {!isUser && (
//                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg">
//                           <Bot className="h-5 w-5 text-white" />
//                         </div>
//                       )}
//                       <div className="flex flex-col max-w-[75%]">
//                         <div
//                           className={`p-4 rounded-2xl shadow-sm relative ${
//                             isUser
//                               ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm"
//                               : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
//                           }`}
//                           style={{
//                             boxShadow: isUser
//                               ? "0 4px 12px rgba(59, 130, 246, 0.3)"
//                               : "0 4px 12px rgba(0, 0, 0, 0.1)",
//                           }}
//                         >
//                           <p className="text-sm leading-relaxed whitespace-pre-wrap">
//                             {message.text}
//                           </p>
//                           <div
//                             className={`text-xs opacity-70 mt-2 flex items-center justify-between ${
//                               isUser ? "text-blue-100" : "text-gray-500"
//                             }`}
//                           >
//                             <span>{isUser ? "Bạn" : "Bot AI"}</span>
//                             {!isUser && (
//                               <MessageActions
//                                 message={message.text}
//                                 isBot={true}
//                                 className="ml-2"
//                               />
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                       {isUser && (
//                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
//                           <User className="h-5 w-5 text-white" />
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//                 {loading && (
//                   <div className="flex gap-3 justify-start animate-fadeInUp">
//                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg">
//                       <Bot className="h-5 w-5 text-white" />
//                     </div>
//                     <div
//                       className="max-w-[75%] p-4 rounded-2xl bg-white border border-gray-200 rounded-bl-sm shadow-sm"
//                       style={{
//                         boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
//                       }}
//                     >
//                       <div className="flex space-x-1 items-center">
//                         <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
//                         <div
//                           className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
//                           style={{ animationDelay: "0.1s" }}
//                         ></div>
//                         <div
//                           className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
//                           style={{ animationDelay: "0.2s" }}
//                         ></div>
//                         <span className="ml-2 text-xs text-gray-500">
//                           Bot đang soạn tin...
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//                 <div ref={messagesEndRef} />
//               </div>
//             )}
//             </div>
//           </div>

//           {/* Quick Suggestions Grid */}
//           {messages.length === 0 && isNewChat && (
//             <div
//               className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-shrink-0"
//               style={{
//                 animation: "fadeIn 1s ease-out 0.4s backwards",
//               }}
//             >
//               {quickSuggestions.map((suggestion, index) => {
//                 const Icon = suggestion.icon;
//                 return (
//                   <button
//                     key={index}
//                     onClick={() => handleQuickSuggestion(suggestion.text)}
//                     className="group relative p-3 rounded-xl transition-all duration-300 hover:scale-105"
//                     style={{
//                       background: "rgba(255, 255, 255, 0.8)",
//                       backdropFilter: "blur(10px)",
//                       border: "1px solid rgba(59, 130, 246, 0.15)",
//                       boxShadow: "0 2px 10px rgba(59, 130, 246, 0.08)",
//                       animation: `fadeInUp 0.6s ease-out ${
//                         0.1 * index
//                       }s backwards`,
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.background =
//                         "rgba(255, 255, 255, 0.95)";
//                       e.currentTarget.style.boxShadow =
//                         "0 4px 15px rgba(59, 130, 246, 0.15)";
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.background =
//                         "rgba(255, 255, 255, 0.8)";
//                       e.currentTarget.style.boxShadow =
//                         "0 2px 10px rgba(59, 130, 246, 0.08)";
//                     }}
//                   >
//                     <div className="flex flex-col items-center gap-1.5">
//                       <div
//                         className={`w-9 h-9 rounded-lg bg-gradient-to-br ${suggestion.color} flex items-center justify-center`}
//                         style={{
//                           boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
//                         }}
//                       >
//                         <Icon className="h-4 w-4 text-white" />
//                       </div>
//                       <span className="text-xs font-medium text-gray-700 text-center leading-tight">
//                         {suggestion.text}
//                       </span>
//                     </div>
//                   </button>
//                 );
//               })}
//             </div>
//           )}

//           {/* Input Area with Glass Effect */}
//           <div
//             className="w-full space-y-2 flex-shrink-0"
//             style={{
//               animation: "fadeInUp 0.8s ease-out 0.6s backwards",
//             }}
//           >
//             <div className="relative group">
//               {/* Glow Effect on Focus */}
//               <div
//                 className="absolute -inset-1 rounded-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"
//                 style={{
//                   background:
//                     "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.15))",
//                   filter: "blur(10px)",
//                 }}
//               />

//               <div
//                 className="relative rounded-2xl transition-all duration-300"
//                 style={{
//                   background: "rgba(255, 255, 255, 0.9)",
//                   backdropFilter: "blur(10px)",
//                   border: "1px solid rgba(59, 130, 246, 0.2)",
//                   boxShadow: "0 4px 20px rgba(59, 130, 246, 0.1)",
//                 }}
//               >
//                 <Input
//                   placeholder="Hỏi bất kỳ điều gì..."
//                   value={inputMessage}
//                   onChange={(e) => setInputMessage(e.target.value)}
//                   onKeyPress={handleKeyPress}
//                   disabled={loading}
//                   className="min-h-[56px] pl-14 pr-28 py-4 rounded-2xl border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm bg-transparent text-gray-700 placeholder:text-gray-400"
//                 />

//                 {/* Left Button */}
//                 <div className="absolute left-3 top-1/2 -translate-y-1/2">
//                   <button
//                     className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
//                     style={{
//                       background: "rgba(59, 130, 246, 0.1)",
//                       backdropFilter: "blur(10px)",
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.background =
//                         "rgba(59, 130, 246, 0.15)";
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.background =
//                         "rgba(59, 130, 246, 0.1)";
//                     }}
//                   >
//                     <Plus className="h-5 w-5 text-blue-600" />
//                   </button>
//                 </div>

//                 {/* Right Buttons */}
//                 <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1.5">
//                   <button
//                     className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
//                     style={{
//                       background: "rgba(59, 130, 246, 0.1)",
//                       backdropFilter: "blur(10px)",
//                     }}
//                     onMouseEnter={(e) => {
//                       e.currentTarget.style.background =
//                         "rgba(59, 130, 246, 0.15)";
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.background =
//                         "rgba(59, 130, 246, 0.1)";
//                     }}
//                   >
//                     <Mic className="h-5 w-5 text-blue-600" />
//                   </button>
//                   <button
//                     onClick={handleSendMessage}
//                     disabled={loading || !inputMessage.trim()}
//                     className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
//                     style={{
//                       background:
//                         "linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%)",
//                       boxShadow: "0 2px 10px rgba(59, 130, 246, 0.3)",
//                     }}
//                     onMouseEnter={(e) => {
//                       if (!loading && inputMessage.trim()) {
//                         e.currentTarget.style.transform = "scale(1.1)";
//                         e.currentTarget.style.boxShadow =
//                           "0 4px 15px rgba(59, 130, 246, 0.4)";
//                       }
//                     }}
//                     onMouseLeave={(e) => {
//                       e.currentTarget.style.transform = "scale(1)";
//                       e.currentTarget.style.boxShadow =
//                         "0 2px 10px rgba(59, 130, 246, 0.3)";
//                     }}
//                   >
//                     {loading ? (
//                       <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                     ) : (
//                       <SendHorizonal className="h-5 w-5 text-white" />
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </div>

//             <p className="text-center text-xs text-gray-500">
//               Chat Bot có thể mắc lỗi. Hãy kiểm tra các thông tin quan trọng.
//             </p>
//           </div>
//         </div>
//       </main>

//       {/* CSS Animations */}
//       <style>{`
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//           }
//           to {
//             opacity: 1;
//           }
//         }

//         @keyframes fadeInUp {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @keyframes float {
//           0%, 100% {
//             transform: translateY(0px);
//           }
//           50% {
//             transform: translateY(-20px);
//           }
//         }

//         @keyframes pulse {
//           0%, 100% {
//             opacity: 1;
//           }
//           50% {
//             opacity: 0.5;
//           }
//         }

//         .animate-fadeInUp {
//           animation: fadeInUp 0.3s ease-out;
//         }

//         /* Custom scrollbar for chat container */
//         .chat-container::-webkit-scrollbar {
//           width: 6px;
//         }

//         .chat-container::-webkit-scrollbar-track {
//           background: rgba(0, 0, 0, 0.1);
//           border-radius: 10px;
//         }

//         .chat-container::-webkit-scrollbar-thumb {
//           background: rgba(59, 130, 246, 0.3);
//           border-radius: 10px;
//         }

//         .chat-container::-webkit-scrollbar-thumb:hover {
//           background: rgba(59, 130, 246, 0.5);
//         }
//       `}</style>
//     </div>
//   );
// }
