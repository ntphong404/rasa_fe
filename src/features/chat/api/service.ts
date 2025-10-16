// Chat service for Flask API
import axios from 'axios';

const FLASK_URL = import.meta.env.VITE_FLASK_URL || 'https://103.101.163.198:3050';

export interface ChatMessage {
  sender_id: string;
  message: string;
}

export interface ChatResponse {
  recipient_id: string;
  text: string;
}

export interface FlaskChatResponse {
  code: number;
  message: string;
  result: {
    responses: ChatResponse[];
  };
}

export const chatService = {
  sendMessage: async (senderId: string, message: string): Promise<ChatResponse[]> => {
    try {
      const payload: ChatMessage = {
        sender_id: senderId,
        message: message,
      };

      const response = await axios.post(`${FLASK_URL}/chat`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: FlaskChatResponse = response.data;

      // Check if the response is successful
      if (data.code === 200 && data.result && data.result.responses) {
        return data.result.responses;
      } else {
        throw new Error(data.message || 'Failed to get chat response');
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  },
};
