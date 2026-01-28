export interface OverallStatistics {
  totalUsers: number;
  totalConversations: number;
  totalChatbots: number;
  totalIntents: number;
  totalEntities: number;
  totalActions: number;
  totalStories: number;
  totalResponses: number;
  totalRoles: number;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  inactiveUsers: number;
  usersByGender: Array<{
    _id: string;
    count: number;
  }>;
  userCreationTrend: Array<{
    _id: string;
    count: number;
  }>;
}

export interface ConversationStatistics {
  totalConversations: number;
  avgMessagesPerConversation: number;
  topUsers: Array<{
    _id: string;
    count: number;
    messages: number;
    user: Array<{
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    }>;
  }>;
  conversationTrend: Array<{
    _id: string;
    count: number;
    totalMessages: number;
  }>;
}

export interface ChatbotStatistics {
  totalChatbots: number;
  chatbots: Array<{
    _id: string;
    name: string;
    ip: string;
    rasaPort: number;
    flaskPort: number;
    roles: Array<{
      _id: string;
      name: string;
    }>;
  }>;
}

export interface NLPStatistics {
  totalIntents: number;
  totalEntities: number;
  totalActions: number;
  totalStories: number;
  totalResponses: number;
  nlpComponents: {
    intents: {
      total: number;
      topIntents: Array<{
        _id: string;
        entities: Array<{
          _id: string;
          name: string;
        }>;
      }>;
    };
    entities: {
      total: number;
    };
    actions: {
      total: number;
    };
    stories: {
      total: number;
      topStories: Array<{
        _id: string;
        intentsCount: number;
        intents: any[];
      }>;
    };
    responses: {
      total: number;
    };
  };
}

export interface DocumentStatistics {
  totalDocs: number;
  docsByType: Array<{
    _id: string;
    count: number;
    totalSize: number;
  }>;
  fileSizeStats: {
    smallFiles: number;
    mediumFiles: number;
    largeFiles: number;
    totalSize: number;
  };
  accessStats: {
    public: number;
    private: number;
  };
}

export interface SystemStatistics {
  overall: OverallStatistics;
  users: UserStatistics;
  conversations: ConversationStatistics;
  chatbots: ChatbotStatistics;
  nlp: NLPStatistics;
  documents: DocumentStatistics;
}

export interface StatisticsResponse<T> {
  status: boolean;
  data: T;
  message: string;
}
