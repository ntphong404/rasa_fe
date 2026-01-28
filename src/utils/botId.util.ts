import { useChatbotStore } from '@/store/chatbot';

/**
 * Helper function to get botId from store
 * Use this when you need botId for API requests
 */
export const getBotId = (): string | null => {
  return useChatbotStore.getState().selectedBotId;
};

/**
 * Helper function to add botId to API params
 * Usage: const params = { ...yourParams, ...withBotId() }
 */
export const withBotId = (customParams?: Record<string, any>) => {
  const botId = getBotId();
  return {
    botId,
    ...customParams,
  };
};

/**
 * Helper to format API params with botId
 * Usage: await apiCall(getApiParams({ search: 'test', limit: 10 }))
 */
export const getApiParams = (params?: Record<string, any>) => {
  const botId = getBotId();
  return {
    botId,
    ...params,
  };
};
