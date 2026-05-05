import { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/api/axios';
import axios from 'axios';
import ENDPOINTS from '@/api/endpoints';
import { useChatbotStore } from '@/store/chatbot';
import { IChatbot } from '@/interfaces/chatbot.interface';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/features/auth/api/service';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8888';

export const useChatbots = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  
  const setChatbots = useChatbotStore((state) => state.setChatbots);
  const setSelectedManagementBotId = useChatbotStore((state) => state.setSelectedManagementBotId);
  const setSelectedChatBotId = useChatbotStore((state) => state.setSelectedChatBotId);
  const setSelectedBotId = useChatbotStore((state) => state.setSelectedBotId);
  const selectedManagementBotId = useChatbotStore((state) => state.selectedManagementBotId);
  const selectedManagementBotObjectId = useChatbotStore((state) => state.selectedManagementBotObjectId);
  const selectedChatBotId = useChatbotStore((state) => state.selectedChatBotId);
  const selectedChatbotObjectId = useChatbotStore((state) => state.selectedChatbotObjectId);
  const selectedBotId = useChatbotStore((state) => state.selectedBotId);
  const chatbots = useChatbotStore((state) => state.chatbots);
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const updateUser = useAuthStore((state) => state.updateUser);

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
      const token = localStorage.getItem('authToken');

      const response = await axios.get(`${BASE_URL}/api/v1/chatbot/public/list`);
      
      const chatbotList = response.data?.data || [];
      setChatbots(chatbotList);

      let latestUser = authUser;
      if (token) {
        try {
          const profile = await authService.getMe();
          updateUser(profile);
          latestUser = profile;
        } catch (profileError) {
          console.warn('Cannot refresh current profile:', profileError);
        }
      }

      const {
        selectedManagementBotId: currentSelectedManagementBotId,
        selectedBotId: currentSelectedBotId,
        selectedChatBotId: currentSelectedChatBotId,
        selectedChatbotObjectId: currentSelectedChatbotObjectId,
      } = useChatbotStore.getState();

      const isManager = Boolean(
        latestUser?.roles?.some((role: any) => role.name?.toUpperCase() === 'MANAGER')
      );
      const managerAssignedBotId = latestUser?.managedBotIds?.[0] || null;
      const hasAssignedBot = managerAssignedBotId
        ? chatbotList.some((bot: IChatbot) => bot.botId === managerAssignedBotId)
        : false;

      if (isManager) {
        // Manager scope is always fixed to assigned chatbot from backend.
        const assignedBot = chatbotList.find((bot: IChatbot) => bot.botId === managerAssignedBotId);
        setSelectedManagementBotId(hasAssignedBot ? managerAssignedBotId : null, assignedBot?._id || null);
      }

      // Keep backward compatibility with old selectedBotId key.
      if (!isManager && !currentSelectedManagementBotId && currentSelectedBotId) {
        const bot = chatbotList.find((b: IChatbot) => b.botId === currentSelectedBotId);
        setSelectedManagementBotId(currentSelectedBotId, bot?._id || null);
      }

      // Auto-select first chatbot for management scope if none selected.
      if (!isManager && chatbotList.length > 0 && !currentSelectedManagementBotId && !currentSelectedBotId) {
        const firstBot = chatbotList[0];
        setSelectedManagementBotId(firstBot.botId, firstBot._id);
      }

      // Initialize chat scope from global system setting, fallback to first available chatbot.
      let systemChatbotId: string | null = null;
      let systemChatbotObjectId: string | null = null;
      if (token) {
        try {
          const systemSetting = await authService.getSystemChatbot();
          systemChatbotId = systemSetting.systemChatbotId || null;
          systemChatbotObjectId = systemSetting.chatbotId || null;
        } catch (settingError) {
          console.warn('Cannot load system chatbot setting:', settingError);
        }
      }

      const hasSystemSetting = systemChatbotId
        ? chatbotList.some((bot: IChatbot) => bot.botId === systemChatbotId)
        : false;

      const hasCurrentSelectedChatbot = currentSelectedChatBotId
        ? chatbotList.some((bot: IChatbot) => bot.botId === currentSelectedChatBotId)
        : false;

      // Prefer backend system setting for chat scope whenever it is available.
      if (hasSystemSetting && systemChatbotId && currentSelectedChatBotId !== systemChatbotId) {
        setSelectedChatBotId(systemChatbotId, systemChatbotObjectId);
      } else if ((!currentSelectedChatBotId || !hasCurrentSelectedChatbot) && chatbotList.length > 0) {
        const firstBot = chatbotList[0];
        setSelectedChatBotId(firstBot.botId, firstBot._id);
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
  }, [isAuthenticated]);

  return {
    chatbots,
    loading,
    error,
    selectedBotId,
    selectedManagementBotId,
    selectedManagementBotObjectId,
    selectedChatBotId,
    selectedChatbotObjectId,
    setSelectedBotId,
    setSelectedManagementBotId,
    setSelectedChatBotId,
    fetchChatbots,
  };
};
