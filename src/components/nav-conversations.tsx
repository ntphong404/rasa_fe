import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChevronRight, MessageSquare, Loader2, MoreHorizontal, Share2, Edit, Pin, Archive, Trash2 } from "lucide-react";
import { chatService } from "@/features/chat/api/service";
import { useAuthStore } from "@/store/auth";
import { IConversation } from "@/interfaces/chat.interface";

export function NavConversations() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const scrollContainerRef = useRef<HTMLUListElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isLoadingRef = useRef(false);
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null);

  // Load conversations
  const loadConversations = useCallback(async (pageNum: number = 1, shouldAppend: boolean = false) => {
    if (!user?._id || isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);
      console.log(`Loading conversations page ${pageNum}, shouldAppend: ${shouldAppend}`);
      const response = await chatService.getConversations(user._id, {
        page: pageNum,
        limit: 10,
        sort: "updatedAt,DESC", // Sort by last update to show active conversations first
      });

      if (response.success) {
        console.log(`Loaded ${response.data.length} conversations, meta.total: ${response.meta.total}, pageNum: ${pageNum}`);
        
        if (shouldAppend) {
          setConversations((prev) => [...prev, ...response.data]);
        } else {
          setConversations(response.data);
        }
        
        // Backend bug: meta.total seems to be totalPages, not total count
        // So we just compare pageNum with meta.total
        const hasMorePages = pageNum < response.meta.total;
        console.log(`hasMore: ${hasMorePages} (${pageNum} < ${response.meta.total})`);
        setHasMore(hasMorePages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [user?._id]);

  // Initial load
  useEffect(() => {
    if (user?._id && isOpen) {
      loadConversations(1, false);
    }
  }, [user?._id, isOpen, loadConversations]);

  // Auto-refresh disabled per user request
  /*
  useEffect(() => {
    if (!isOpen || !user?._id) return;

    const interval = setInterval(() => {
      // Refresh first page to get updated conversations
      // Only refresh if not currently loading
      if (!isLoadingRef.current) {
        console.log("Auto-refresh: reloading conversations");
        loadConversations(1, false);
      }
    }, 5000); // 5 seconds - faster refresh to catch updates

    return () => clearInterval(interval);
  }, [isOpen, user?._id, loadConversations]);
  */

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadConversations(page + 1, true);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    // Using _id instead of conversationId to match backend API
    navigate(`/?conversationId=${conversationId}`);
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation
    
    if (!window.confirm("Bạn có chắc chắn muốn xóa cuộc hội thoại này?")) {
      return;
    }

    try {
      // Optimistic update - remove from UI immediately
      setConversations(prev => prev.filter(c => c._id !== conversationId));
      
      // Call API to delete
      await chatService.deleteConversation(conversationId);
      console.log("Conversation deleted successfully");
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      // Reload conversations on error
      loadConversations(1, false);
    }
  };

  const getConversationTitle = (conversation: IConversation): string => {
    // Get first user message as title, or fallback to timestamp
    const firstUserMessage = conversation.chat.find(
      (msg) => msg.role === "user"
    );
    if (firstUserMessage && typeof firstUserMessage.message === "string") {
      return firstUserMessage.message.length > 30
        ? firstUserMessage.message.substring(0, 30) + "..."
        : firstUserMessage.message;
    }
    return new Date(conversation.createdAt).toLocaleDateString("vi-VN");
  };

  if (!user?._id) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Lịch sử</SidebarGroupLabel>
      <SidebarMenu>
        <Collapsible 
          asChild 
          defaultOpen={false} 
          className="group/collapsible"
          onOpenChange={setIsOpen}
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="cursor-pointer">
                <MessageSquare />
                <span>Các đoạn chat của bạn</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub 
                ref={scrollContainerRef}
              >
                {loading && conversations.length === 0 ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    Chưa có cuộc hội thoại nào
                  </div>
                ) : (
                  <>
                    {conversations.map((conversation) => (
                      <SidebarMenuSubItem 
                        key={conversation._id}
                        onMouseEnter={() => setHoveredConversationId(conversation._id)}
                        onMouseLeave={() => setHoveredConversationId(null)}
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <SidebarMenuSubButton
                            onClick={() =>
                              handleConversationClick(conversation._id)
                            }
                            className="cursor-pointer transition-all duration-200 flex-1 min-w-0"
                          >
                            <span className="line-clamp-1 text-sm truncate">
                              {getConversationTitle(conversation)}
                            </span>
                          </SidebarMenuSubButton>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className={`transition-opacity pl-1 hover:bg-accent rounded-md flex-shrink-0 ${
                                  hoveredConversationId === conversation._id ? 'opacity-100' : 'opacity-0'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="right" className="w-48 border-2">
                              <DropdownMenuItem disabled>
                                <Share2 className="mr-2 h-4 w-4" />
                                <span>Chia sẻ</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Đổi tên</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled>
                                <Pin className="mr-2 h-4 w-4" />
                                <span>Ghim</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled>
                                <Archive className="mr-2 h-4 w-4" />
                                <span>Lưu trữ</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                variant="destructive"
                                onClick={(e) => handleDeleteConversation(conversation._id, e)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Xóa</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </SidebarMenuSubItem>
                    ))}
                    
                    {/* Load more button */}
                    {hasMore && (
                      <SidebarMenuSubItem>
                        <button
                          onClick={handleLoadMore}
                          disabled={loading}
                          className="w-full text-left px-2 py-1.5 text-sm font-bold text-primary hover:bg-accent rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Đang tải...</span>
                            </>
                          ) : (
                            <span>Xem thêm</span>
                          )}
                        </button>
                      </SidebarMenuSubItem>
                    )}
                  </>
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
