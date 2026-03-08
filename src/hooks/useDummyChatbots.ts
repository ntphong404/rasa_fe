import { useState, useEffect } from 'react';
import { IChatbot } from '@/interfaces/chatbot.interface';

// Dummy chatbots data for demo (home_chat_without_login)
const DUMMY_CHATBOTS: IChatbot[] = [
  {
    _id: '1',
    botId: 'bot_1',
    name: 'PCCC Nam Định',
    ip: 'localhost',
    rasaPort: 5005,
    flaskPort: 5005,
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deleted: false,
  },
  {
    _id: '2',
    botId: 'bot_2',
    name: 'Support Bot',
    ip: 'localhost',
    rasaPort: 5006,
    flaskPort: 5006,
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deleted: false,
  },
];

export const useDummyChatbots = () => {
  const [chatbots, setChatbots] = useState<IChatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call delay
    const timer = setTimeout(() => {
      setChatbots(DUMMY_CHATBOTS);
      setSelectedBotId(DUMMY_CHATBOTS[0].botId);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return {
    chatbots,
    loading,
    error: null,
    selectedBotId,
    setSelectedBotId,
  };
};
