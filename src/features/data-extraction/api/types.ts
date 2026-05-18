export interface QAPair {
  conversation: string;
  question: string;
  answer: string;
}

export interface Conversation {
  id: string;
  name: string;
  message_count: number;
}

export interface OwnerCandidate {
  name: string;
  conversation_count: number;
}

export interface GmailStatus {
  connected: boolean;
  email: string | null;
}

export interface GmailExtractResult {
  email: string;
  qa_pairs: QAPair[];
  total: number;
}

export interface FBUploadResult {
  extract_id: string;
  conversations: Conversation[];
  owner_candidates: OwnerCandidate[];
  owner: string | null;
  message_count: number;
}

export interface FBExtractResult {
  owner: string;
  qa_pairs: QAPair[];
  total: number;
}

export interface RasaParseResult {
  text: string;
  intent: {
    name: string;
    confidence: number;
  };
  intent_ranking: Array<{
    name: string;
    confidence: number;
  }>;
  entities: any[];
}

export interface ExtractionRow {
  id: string;
  question: string;
  answer: string;
  conversation: string;
  status?: "pending" | "success" | "error";
  error?: string;
  parseResult?: RasaParseResult | null;
  parsedIntent?: string | null;
  isFallback?: boolean;
  existingIntentId?: string | null;
  label?: string;
  generatedExamples?: string[];
}
