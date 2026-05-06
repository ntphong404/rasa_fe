import axios from "axios";
import { RAG_BASE_URL, RAG_ENDPOINTS, buildRagPortUrl, createRagEndpoints } from "@/api/rag.endpoints";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChunkSearchRequest,
  ChunkSearchResponse,
  IngestedDocument,
  IngestedDocumentsResponse,
  LightRagDocActionResponse,
  LightRagDocumentsStatusesResponse,
  LightRagPipelineStatusResponse,
} from "@/interfaces/rag.interface";

const ragAxios = axios.create({
  baseURL: RAG_BASE_URL,
  timeout: 60000, // 60s timeout for LLM responses
});

/**
 * Create a custom RAG axios instance with specific port
 * Used for /context-docs page which needs chatbot-specific RAG endpoint
 */
export const createRagAxiosInstance = (ragPort?: number) => {
  const baseURL = ragPort ? buildRagPortUrl(ragPort) : RAG_BASE_URL;
  return axios.create({
    baseURL,
    timeout: 60000,
  });
};

type LightRagDocument = {
  id: string;
  file_path?: string;
  metadata?: Record<string, unknown>;
};

type LightRagDocumentsResponse = {
  statuses?: Record<string, LightRagDocument[]>;
};

const shouldFallbackToLegacyIngestApi = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  return status === 404 || status === 405;
};

const fileNameFromPath = (filePath: string): string => {
  const normalized = filePath.replace(/\\/g, "/");
  const segments = normalized.split("/").filter(Boolean);
  return segments[segments.length - 1] || filePath;
};

const mapLightRagDocument = (doc: LightRagDocument): IngestedDocument => {
  const metadata = doc.metadata || {};
  const metadataFileName = typeof metadata.file_name === "string" ? metadata.file_name : undefined;

  return {
    object: "ingest.document",
    doc_id: doc.id,
    doc_metadata: {
      file_name: metadataFileName || (doc.file_path ? fileNameFromPath(doc.file_path) : doc.id),
    },
  };
};

const mapLightRagDocumentsResponse = (response: LightRagDocumentsResponse): IngestedDocumentsResponse => {
  const statuses = response.statuses || {};
  const documents = Object.values(statuses).flat().map(mapLightRagDocument);

  return {
    object: "list",
    model: "lightrag",
    data: documents,
  };
};

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
    try {
      const response = await ragAxios.get<LightRagDocumentsResponse>(
        RAG_ENDPOINTS.DOCUMENTS_LIST
      );
      return mapLightRagDocumentsResponse(response.data);
    } catch (error) {
      if (!shouldFallbackToLegacyIngestApi(error)) {
        throw error;
      }

      const response = await ragAxios.get<IngestedDocumentsResponse>(
        RAG_ENDPOINTS.INGEST_LIST
      );
      return response.data;
    }
  },

  /**
   * Upload and ingest a file
   */
  ingestFile: async (file: File): Promise<IngestedDocumentsResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await ragAxios.post<LightRagDocActionResponse>(
        RAG_ENDPOINTS.DOCUMENTS_UPLOAD,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.status && response.data.status !== "success") {
        throw new Error(response.data.message || "Upload failed");
      }

      return await ragService.listIngestedDocuments();
    } catch (error) {
      if (!shouldFallbackToLegacyIngestApi(error)) {
        throw error;
      }

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
    }
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
    try {
      const response = await ragAxios.delete<LightRagDocActionResponse>(
        RAG_ENDPOINTS.DOCUMENTS_DELETE,
        {
          data: {
            doc_ids: [docId],
            delete_file: false,
            delete_llm_cache: false,
          },
        }
      );

      if (response.data.status === "busy" || response.data.status === "not_allowed") {
        throw new Error(response.data.message || "Delete request was rejected by server");
      }
      return;
    } catch (error) {
      if (!shouldFallbackToLegacyIngestApi(error)) {
        throw error;
      }

      await ragAxios.delete(RAG_ENDPOINTS.INGEST_DELETE(docId));
    }
  },

  listDocumentsStatuses: async (): Promise<LightRagDocumentsStatusesResponse> => {
    try {
      const response = await ragAxios.get<LightRagDocumentsStatusesResponse>(
        RAG_ENDPOINTS.DOCUMENTS_LIST
      );
      return response.data;
    } catch (error) {
      if (!shouldFallbackToLegacyIngestApi(error)) {
        throw error;
      }

      const legacyResponse = await ragService.listIngestedDocuments();
      return {
        statuses: {
          processed: legacyResponse.data.map((doc) => ({
            id: doc.doc_id,
            content_summary: doc.doc_metadata?.file_name || doc.doc_id,
            content_length: 0,
            status: "processed",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            file_path: doc.doc_metadata?.file_name || doc.doc_id,
          })),
        },
      };
    }
  },

  scanDocuments: async (): Promise<LightRagDocActionResponse> => {
    const response = await ragAxios.post<LightRagDocActionResponse>(
      RAG_ENDPOINTS.DOCUMENTS_SCAN
    );
    return response.data;
  },

  reprocessFailedDocuments: async (): Promise<LightRagDocActionResponse> => {
    const response = await ragAxios.post<LightRagDocActionResponse>(
      RAG_ENDPOINTS.DOCUMENTS_REPROCESS_FAILED
    );
    return response.data;
  },

  getPipelineStatus: async (): Promise<LightRagPipelineStatusResponse> => {
    const response = await ragAxios.get<LightRagPipelineStatusResponse>(
      RAG_ENDPOINTS.DOCUMENTS_PIPELINE_STATUS
    );
    return response.data;
  },

  cancelPipeline: async (): Promise<LightRagDocActionResponse> => {
    const response = await ragAxios.post<LightRagDocActionResponse>(
      RAG_ENDPOINTS.DOCUMENTS_CANCEL_PIPELINE
    );
    return response.data;
  },

  deleteDocuments: async (
    docIds: string[],
    deleteFile: boolean = false,
    deleteLlmCache: boolean = false
  ): Promise<LightRagDocActionResponse> => {
    const response = await ragAxios.delete<LightRagDocActionResponse>(
      RAG_ENDPOINTS.DOCUMENTS_DELETE,
      {
        data: {
          doc_ids: docIds,
          delete_file: deleteFile,
          delete_llm_cache: deleteLlmCache,
        },
      }
    );
    return response.data;
  },

  clearDocuments: async (): Promise<LightRagDocActionResponse> => {
    const response = await ragAxios.delete<LightRagDocActionResponse>(
      RAG_ENDPOINTS.DOCUMENTS_CLEAR
    );
    return response.data;
  },

  clearCache: async (): Promise<{ status: string; message: string }> => {
    const response = await ragAxios.post<{ status: string; message: string }>(
      RAG_ENDPOINTS.DOCUMENTS_CLEAR_CACHE,
      {}
    );
    return response.data;
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

/**
 * Factory function to create RAG service with custom ragPort
 */
export const createRagServiceInstance = (ragPort?: number) => {
  const baseURL = ragPort ? buildRagPortUrl(ragPort) : RAG_BASE_URL;
  const customRagAxios = axios.create({
    baseURL,
    timeout: 60000,
  });
  const ragEndpoints = createRagEndpoints(baseURL);

  return {
    // Use custom axios instance for all methods
    listDocumentsStatuses: async (): Promise<LightRagDocumentsStatusesResponse> => {
      const response = await customRagAxios.get<LightRagDocumentsStatusesResponse>(
        ragEndpoints.DOCUMENTS_LIST
      );
      return response.data;
    },

    uploadDocument: async (file: File): Promise<LightRagDocActionResponse> => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await customRagAxios.post<LightRagDocActionResponse>(
        ragEndpoints.DOCUMENTS_UPLOAD,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },

    ingestFile: async (file: File): Promise<IngestedDocumentsResponse> => {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await customRagAxios.post<LightRagDocActionResponse>(
          ragEndpoints.DOCUMENTS_UPLOAD,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.status && response.data.status !== "success") {
          throw new Error(response.data.message || "Upload failed");
        }

        return await createRagServiceInstance(ragPort).listIngestedDocuments();
      } catch (error) {
        if (!shouldFallbackToLegacyIngestApi(error)) {
          throw error;
        }

        const response = await customRagAxios.post<IngestedDocumentsResponse>(
          ragEndpoints.INGEST_FILE,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return response.data;
      }
    },

    listIngestedDocuments: async (): Promise<IngestedDocumentsResponse> => {
      try {
        const response = await customRagAxios.get<LightRagDocumentsResponse>(
          ragEndpoints.DOCUMENTS_LIST
        );
        return mapLightRagDocumentsResponse(response.data);
      } catch (error) {
        if (!shouldFallbackToLegacyIngestApi(error)) {
          throw error;
        }

        const response = await customRagAxios.get<IngestedDocumentsResponse>(
          ragEndpoints.INGEST_LIST
        );
        return response.data;
      }
    },

    deleteDocument: async (docId: string): Promise<void> => {
      await customRagAxios.delete<LightRagDocActionResponse>(
        ragEndpoints.DOCUMENTS_DELETE,
        {
          data: {
            doc_ids: [docId],
            delete_file: false,
            delete_llm_cache: false,
          },
        }
      );
    },

    deleteDocuments: async (
      docIds: string[],
      deleteFile: boolean = false,
      deleteLlmCache: boolean = false
    ): Promise<LightRagDocActionResponse> => {
      const response = await customRagAxios.delete<LightRagDocActionResponse>(
        ragEndpoints.DOCUMENTS_DELETE,
        {
          data: {
            doc_ids: docIds,
            delete_file: deleteFile,
            delete_llm_cache: deleteLlmCache,
          },
        }
      );
      return response.data;
    },

    scanDocuments: async (): Promise<LightRagDocActionResponse> => {
      const response = await customRagAxios.post<LightRagDocActionResponse>(
        ragEndpoints.DOCUMENTS_SCAN
      );
      return response.data;
    },

    reprocessFailedDocuments: async (): Promise<LightRagDocActionResponse> => {
      const response = await customRagAxios.post<LightRagDocActionResponse>(
        ragEndpoints.DOCUMENTS_REPROCESS_FAILED
      );
      return response.data;
    },

    getPipelineStatus: async (): Promise<LightRagPipelineStatusResponse> => {
      const response = await customRagAxios.get<LightRagPipelineStatusResponse>(
        ragEndpoints.DOCUMENTS_PIPELINE_STATUS
      );
      return response.data;
    },

    cancelPipeline: async (): Promise<LightRagDocActionResponse> => {
      const response = await customRagAxios.post<LightRagDocActionResponse>(
        ragEndpoints.DOCUMENTS_CANCEL_PIPELINE
      );
      return response.data;
    },

    clearDocuments: async (): Promise<LightRagDocActionResponse> => {
      const response = await customRagAxios.delete<LightRagDocActionResponse>(
        ragEndpoints.DOCUMENTS_CLEAR
      );
      return response.data;
    },

    clearCache: async (): Promise<{ status: string; message: string }> => {
      const response = await customRagAxios.post<{ status: string; message: string }>(
        ragEndpoints.DOCUMENTS_CLEAR_CACHE,
        {}
      );
      return response.data;
    },
  };
};
