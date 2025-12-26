import axios from "axios";
import { RAG_ENDPOINTS } from "@/api/rag.endpoints";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChunkSearchRequest,
  ChunkSearchResponse,
  IngestedDocumentsResponse,
} from "@/interfaces/rag.interface";

const ragAxios = axios.create({
  timeout: 60000, // 60s timeout for LLM responses
});

export const ragService = {
  /**
   * Chat with AI using RAG context
   */
  chatCompletion: async (
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> => {
    const response = await ragAxios.post<ChatCompletionResponse>(
      RAG_ENDPOINTS.CHAT_COMPLETIONS,
      request
    );
    return response.data;
  },

  /**
   * Search for relevant chunks in documents
   */
  searchChunks: async (
    request: ChunkSearchRequest
  ): Promise<ChunkSearchResponse> => {
    const response = await ragAxios.post<ChunkSearchResponse>(
      RAG_ENDPOINTS.CHUNKS_SEARCH,
      request
    );
    return response.data;
  },

  /**
   * List all ingested documents
   */
  listIngestedDocuments: async (): Promise<IngestedDocumentsResponse> => {
    const response = await ragAxios.get<IngestedDocumentsResponse>(
      RAG_ENDPOINTS.INGEST_LIST
    );
    return response.data;
  },

  /**
   * Upload and ingest a file
   */
  ingestFile: async (file: File): Promise<IngestedDocumentsResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await ragAxios.post<IngestedDocumentsResponse>(
      RAG_ENDPOINTS.INGEST_FILE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Ingest text directly
   */
  ingestText: async (
    fileName: string,
    text: string
  ): Promise<IngestedDocumentsResponse> => {
    const response = await ragAxios.post<IngestedDocumentsResponse>(
      RAG_ENDPOINTS.INGEST_TEXT,
      {
        file_name: fileName,
        text: text,
      }
    );
    return response.data;
  },

  /**
   * Delete an ingested document
   */
  deleteDocument: async (docId: string): Promise<void> => {
    await ragAxios.delete(RAG_ENDPOINTS.INGEST_DELETE(docId));
  },

  /**
   * Summarize text or documents
   */
  summarize: async (request: {
    text?: string;
    use_context?: boolean;
    context_filter?: { docs_ids: string[] };
    instructions?: string;
    stream?: boolean;
  }): Promise<any> => {
    const response = await ragAxios.post(RAG_ENDPOINTS.SUMMARIZE, request);
    return response.data;
  },

  /**
   * Generate completion (for content generation)
   */
  completion: async (request: {
    prompt: string;
    system_prompt?: string;
    use_context?: boolean;
    context_filter?: { docs_ids: string[] };
    stream?: boolean;
  }): Promise<any> => {
    const response = await ragAxios.post(RAG_ENDPOINTS.COMPLETIONS, request);
    return response.data;
  },

  /**
   * Health check
   */
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await ragAxios.get<{ status: string }>(
      RAG_ENDPOINTS.HEALTH
    );
    return response.data;
  },
};
