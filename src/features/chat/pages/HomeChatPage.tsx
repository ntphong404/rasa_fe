// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { cn } from "@/lib/utils";
// import { MessageSquare, Mic, Plus, Search, SendHorizonal } from "lucide-react";
// import { useEffect, useRef, useState } from "react";

export function HomeChat() {
  //   const [inputValue, setInputValue] = useState("");
  //   //   const { messages, sendMessage, loading, error } = useChatRasa();
  //   const messagesEndRef = useRef<HTMLDivElement>(null);
  //   //   const chatbots = useUserStore((state) => state.user?.role?.chatbots || []);
  //   const [selectedBotUrl, setSelectedBotUrl] = useState<string | null>();

  //   // Auto-scroll to bottom when messages change
  //   //   useEffect(() => {
  //   //     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  //   //   }, [messages]);

  //   //   const handleSend = () => {
  //   //     if (inputValue.trim() === "") return;
  //   //     sendMessage(
  //   //       (selectedBotUrl || import.meta.env.VITE_RASA_DEFAULT_URL) +
  //   //         "/webhooks/rest/webhook",
  //   //       inputValue.trim()
  //   //     );
  //   //     setInputValue("");
  //   //   };

  //   return (
  //     <div className="relative flex flex-col bg-gradient-to-b from-blue-50 to-white text-foreground">
  //       {/* Header */}
  //       {/* <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm py-3 px-4 shadow-sm">
  //         <div className="max-w-3xl mx-auto flex items-center justify-center">
  //           <MessageSquare className="h-6 w-6 text-blue-500 mr-2" />
  //           <h1 className="text-xl font-semibold text-blue-700">AI Assistant</h1>
  //         </div>
  //       </header> */}

  //       {/* Main Content */}
  //       <main className="flex-1 flex flex-col items-center justify-between p-4 md:p-6 overflow-auto">
  //         <div className="max-w-3xl w-full flex flex-col">
  //           <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center text-blue-800">
  //             Tôi có thể giúp gì cho bạn?
  //           </h2>

  //           {/* Chat container with subtle shadow and rounded corners */}
  //           <div className="flex-1 border rounded-2xl p-5 mb-6 bg-white shadow-lg h-[450px] overflow-y-auto">
  //             {messages.length === 0 ? (
  //               <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
  //                 <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
  //                   <MessageSquare className="h-8 w-8 text-blue-400" />
  //                 </div>
  //                 <p className="text-lg font-medium mb-2">
  //                   Bắt đầu cuộc trò chuyện
  //                 </p>
  //                 <p className="text-sm max-w-xs">
  //                   Hãy đặt câu hỏi hoặc yêu cầu trợ giúp để bắt đầu cuộc trò
  //                   chuyện
  //                 </p>
  //               </div>
  //             ) : (
  //               <>
  //                 {messages.map((msg, index) => (
  //                   <div
  //                     key={index}
  //                     className={cn(
  //                       "mb-6 flex items-end gap-2",
  //                       msg.sender === "user" ? "flex-row-reverse" : "flex-row"
  //                     )}
  //                   >
  //                     {/* Message content */}
  //                     <div
  //                       className={cn(
  //                         "max-w-[75%] flex flex-col",
  //                         msg.sender === "user" ? "items-end" : "items-start"
  //                       )}
  //                     >
  //                       <div
  //                         className={cn(
  //                           "rounded-2xl p-4 shadow-sm",
  //                           msg.sender === "user"
  //                             ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-none"
  //                             : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 rounded-tl-none border border-gray-100"
  //                         )}
  //                       >
  //                         <p className="text-sm md:text-base leading-relaxed">
  //                           {msg.text}
  //                         </p>
  //                       </div>

  //                       {/* Timestamp */}
  //                       <div className="text-xs mt-1.5 text-gray-500 flex items-center gap-1">
  //                         {new Date().toLocaleTimeString([], {
  //                           hour: "2-digit",
  //                           minute: "2-digit",
  //                         })}
  //                         {msg.sender === "user" && (
  //                           <svg
  //                             className="h-3 w-3 text-blue-500 fill-current"
  //                             viewBox="0 0 16 16"
  //                           >
  //                             <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
  //                           </svg>
  //                         )}
  //                       </div>
  //                     </div>
  //                   </div>
  //                 ))}

  //                 {loading && (
  //                   <div className="flex items-start gap-2 mb-6">
  //                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white flex-shrink-0">
  //                       B
  //                     </div>
  //                     <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4 inline-block">
  //                       <div className="flex space-x-2">
  //                         <div
  //                           className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
  //                           style={{ animationDelay: "0ms" }}
  //                         ></div>
  //                         <div
  //                           className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
  //                           style={{ animationDelay: "150ms" }}
  //                         ></div>
  //                         <div
  //                           className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
  //                           style={{ animationDelay: "300ms" }}
  //                         ></div>
  //                       </div>
  //                     </div>
  //                   </div>
  //                 )}

  //                 {error && (
  //                   <div className="flex items-start gap-2 mb-6">
  //                     <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white flex-shrink-0">
  //                       !
  //                     </div>
  //                     <div className="bg-red-50 text-red-600 p-4 rounded-2xl rounded-tl-none border border-red-100">
  //                       <p className="text-sm font-medium">Lỗi</p>
  //                       <p className="text-sm">{error}</p>
  //                     </div>
  //                   </div>
  //                 )}
  //                 <div ref={messagesEndRef} />
  //               </>
  //             )}
  //           </div>
  //           <Select onValueChange={(value) => setSelectedBotUrl(value)}>
  //             <SelectTrigger className=" h-8 text-sm mb-4">
  //               <SelectValue placeholder="Select a chatbot" />
  //             </SelectTrigger>
  //             <SelectContent className="text-sm">
  //               {chatbots.map((bot) => (
  //                 <SelectItem key={bot._id} value={bot.url}>
  //                   {bot.name}
  //                 </SelectItem>
  //               ))}
  //             </SelectContent>
  //           </Select>

  //           {/* Input Area with enhanced styling */}
  //           <div className="w-full relative">
  //             <div className="relative rounded-xl border border-blue-200 bg-white shadow-md transition-all focus-within:shadow-lg focus-within:border-blue-300">
  //               <Input
  //                 value={inputValue}
  //                 // onChange={(e) => setInputValue(e.target.value)}
  //                 // onKeyDown={(e) => e.key === "Enter" && handleSend()}
  //                 placeholder="Hỏi bất kỳ điều gì"
  //                 className="min-h-[60px] pl-12 pr-12 py-4 rounded-xl border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-700"
  //               />
  //               <div className="absolute left-3 top-1/2 -translate-y-1/2">
  //                 <Button
  //                   variant="ghost"
  //                   size="icon"
  //                   className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
  //                 >
  //                   <Plus className="h-5 w-5" />
  //                 </Button>
  //               </div>
  //               <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
  //                 <Button
  //                   variant="ghost"
  //                   size="icon"
  //                   className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
  //                   //   onClick={handleSend}
  //                   //   disabled={loading}
  //                 >
  //                   <SendHorizonal className="h-5 w-5" />
  //                 </Button>
  //                 <Button
  //                   variant="ghost"
  //                   size="icon"
  //                   className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
  //                 >
  //                   <Mic className="h-5 w-5" />
  //                 </Button>
  //               </div>
  //             </div>

  //             <div className="flex gap-2 mt-3 justify-center">
  //               <Button
  //                 variant="outline"
  //                 size="sm"
  //                 className="rounded-lg border-blue-200 bg-white text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
  //               >
  //                 <Search className="h-4 w-4 mr-2" />
  //                 Tìm kiếm
  //               </Button>
  //             </div>
  //           </div>
  //         </div>
  //       </main>

  //       {/* Footer */}
  //       <footer className="p-2 text-center text-sm text-gray-500 bg-white/80 backdrop-blur-sm border-t">
  //         <div className="max-w-2xl mx-auto">
  //           Chat Bot có thể mắc lỗi. Hãy kiểm tra các thông tin quan trọng.
  //         </div>
  //       </footer>
  //     </div>
  //   );
  return (
    <>
      <div>Home Chat Page</div>
    </>
  );
}
