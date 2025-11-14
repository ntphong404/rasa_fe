import { useState, useEffect, useCallback } from "react";
import { chatService } from "@/features/chat/api/service";
import { IConversation } from "@/interfaces/chat.interface";

export const useConversations = (userId: string) => {
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await chatService.getConversations(userId);
      
      if (response.success) {
        setConversations(response.data);
        setMeta(response.meta);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Có lỗi xảy ra khi tải lịch sử trò chuyện";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (meta.page >= meta.totalPages || loading) return;

    setLoading(true);
    try {
      const response = await chatService.getConversations(userId);
      
      if (response.success) {
        setConversations(prev => [...prev, ...response.data]);
        setMeta(response.meta);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Có lỗi xảy ra khi tải thêm cuộc trò chuyện";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, meta, loading]);

  const refreshConversations = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    meta,
    loadMore,
    refreshConversations,
    fetchConversations,
  };
};