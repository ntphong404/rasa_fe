import { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/api/axios';
import ENDPOINTS from '@/api/endpoints';
import { useChatbotStore } from '@/store/chatbot';
import { IChatbot } from '@/interfaces/chatbot.interface';

export const useChatbots = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  
  const setChatbots = useChatbotStore((state) => state.setChatbots);
  const setSelectedBotId = useChatbotStore((state) => state.setSelectedBotId);
  const selectedBotId = useChatbotStore((state) => state.selectedBotId);
  const chatbots = useChatbotStore((state) => state.chatbots);

  // Fetch all chatbots
  const fetchChatbots = async () => {
    // Prevent duplicate fetch
    if (isFetchingRef.current || hasFetchedRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(ENDPOINTS.CHATBOT_ENDPOINTS.GET_ALL_PAGINATED, {
        params: {
          limit: 100,
          page: 1,
        },
      });
      
      const chatbotList = response.data?.data || [];
      setChatbots(chatbotList);

      // Auto-select first chatbot if none selected
      if (chatbotList.length > 0 && !selectedBotId) {
        setSelectedBotId(chatbotList[0].botId);
      }

      hasFetchedRef.current = true;
      return chatbotList;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch chatbots';
      setError(errorMessage);
      console.error('Error fetching chatbots:', err);
      throw err;
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Auto-fetch chatbots on mount (only once)
  useEffect(() => {
    // Only fetch if we haven't already
    if (!hasFetchedRef.current && chatbots.length === 0) {
      fetchChatbots();
    }
  }, []);

  return {
    chatbots,
    loading,
    error,
    selectedBotId,
    setSelectedBotId,
    fetchChatbots,
  };
};
