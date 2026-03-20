import { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/api/axios';
import axios from 'axios';
import ENDPOINTS from '@/api/endpoints';
import { useChatbotStore } from '@/store/chatbot';
import { IChatbot } from '@/interfaces/chatbot.interface';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8888';

export const useChatbots = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  
  const setChatbots = useChatbotStore((state) => state.setChatbots);
  const setSelectedBotId = useChatbotStore((state) => state.setSelectedBotId);
  const selectedBotId = useChatbotStore((state) => state.selectedBotId);
  const chatbots = useChatbotStore((state) => state.chatbots);

  // Fetch all chatbots
  const fetchChatbots = async () => {
    // Prevent duplicate simultaneous fetch
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      console.log("🔄 Fetching public chatbots from:", `${BASE_URL}/api/v1/chatbot/public/list`);
      
      // Get token from localStorage to send as Authorization header
      const token = localStorage.getItem('authToken');
      
      const response = await axios.get(`${BASE_URL}/api/v1/chatbot/public/list`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      const chatbotList = response.data?.data || [];
      console.log("✅ Fetched public chatbots:", chatbotList);
      setChatbots(chatbotList);

      // Auto-select first chatbot if none selected
      if (chatbotList.length > 0 && !selectedBotId) {
        setSelectedBotId(chatbotList[0].botId);
      }

      return chatbotList;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch chatbots';
      setError(errorMessage);
      console.error('❌ Error fetching public chatbots:', errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Auto-fetch chatbots on mount
  useEffect(() => {
    fetchChatbots();
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
