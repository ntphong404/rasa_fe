// Chat service for Rasa
import axios from 'axios';

const RASA_URL = import.meta.env.VITE_RASA_URL || 'https://103.101.163.198:3100';

export interface ChatMessage {
  sender: string;
  message: string;
}

export interface ChatResponse {
  recipient_id: string;
  text: string;
}

export const chatService = {
  sendMessage: async (senderId: string, message: string): Promise<ChatResponse[]> => {
    try {
      const payload: ChatMessage = {
        sender: senderId,
        message: message,
      };

      const response = await axios.post(`${RASA_URL}/webhooks/rest/webhook`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: ChatResponse[] = response.data;

      // Rasa trả về mảng responses trực tiếp
      if (Array.isArray(data)) {
        return data;
      } else {
        throw new Error('Invalid response format from Rasa');
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  },
};
