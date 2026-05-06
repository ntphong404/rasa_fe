    import { useState, useEffect } from 'react';
import axios from 'axios';
import { IChatbot } from '@/interfaces/chatbot.interface';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8888';

export const usePublicChatbots = () => {
  const [chatbots, setChatbots] = useState<IChatbot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicChatbots = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASE_URL}/api/v1/chatbot/public/list`);
      const chatbotList = response.data?.data || response.data || [];
      setChatbots(chatbotList);
      return chatbotList;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch chatbots';
      setError(errorMessage);
      console.error('❌ Error fetching public chatbots:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    fetchPublicChatbots();
  }, []);

  return {
    chatbots,
    loading,
    error,
    fetchPublicChatbots,
  };
};
