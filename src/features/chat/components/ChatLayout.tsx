// import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
// import { HomeChatDemo } from "@/features/chat/pages/HomeChatPageDemo";
// import { useChat } from "@/hooks/useChat";
// import { useCurrentUserId } from "@/hooks/useCurrentUserId";
// import { IConversation } from "@/interfaces/chat.interface";

// export function ChatLayout() {
//   const chatbotId = "68e22e6345898f7f46405ecc";
//   const userId = useCurrentUserId();

//   const chatHook = useChat(chatbotId);
//   const {
//     loadConversationHistory,
//     startNewConversation,
//     currentConversationId,
//   } = chatHook;

//   const handleConversationSelect = (conversation: IConversation) => {
//     loadConversationHistory(conversation);
//   };

//   const handleNewChat = () => {
//     startNewConversation();
//   };

//   return (
//     <div className="flex h-screen bg-gray-100">
//       <ChatSidebar
//         userId={userId}
//         currentConversationId={currentConversationId}
//         onConversationSelect={handleConversationSelect}
//         onNewChat={handleNewChat}
//       />
//       <div className="flex-1">
//         <HomeChatDemo />
//       </div>
//     </div>
//   );
// }
