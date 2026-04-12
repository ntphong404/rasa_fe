const DEFAULT_RAG_ENTRY_URL = "http://103.170.123.35:9621/webui/#/";

const normalizeRagBaseUrl = (rawUrl?: string): string => {
  const candidate = (rawUrl || DEFAULT_RAG_ENTRY_URL).trim();

  try {
    // Accept UI URLs like .../webui/#/ and normalize to API origin.
    return new URL(candidate).origin;
  } catch {
    return "http://103.170.123.35:9621";
  }
};

export const RAG_BASE_URL = normalizeRagBaseUrl(import.meta.env.VITE_RAG_BASE_URL);

/**
 * Build RAG API URL using VITE_RAG_URL and ragPort
 * For /context-docs page which requires chatbot-specific RAG endpoint
 */
export const buildRagPortUrl = (ragPort?: number): string => {
  const ragUrl = (import.meta.env.VITE_RAG_URL || "http://103.170.123.35").trim();
  if (!ragPort) {
    return RAG_BASE_URL; // Fallback to default
  }
  try {
    return `${ragUrl}:${ragPort}`;
  } catch {
    return RAG_BASE_URL;
  }
};

export const createRagEndpoints = (baseUrl: string = RAG_BASE_URL) => ({
  CHAT_COMPLETIONS: `${baseUrl}/v1/chat/completions`,
  COMPLETIONS: `${baseUrl}/v1/completions`,
  CHUNKS_SEARCH: `${baseUrl}/v1/chunks`,
  SUMMARIZE: `${baseUrl}/v1/summarize`,

  // Legacy ingest endpoints
  INGEST_FILE: `${baseUrl}/v1/ingest/file`,
  INGEST_TEXT: `${baseUrl}/v1/ingest/text`,
  INGEST_LIST: `${baseUrl}/v1/ingest/list`,
  INGEST_DELETE: (docId: string) => `${baseUrl}/v1/ingest/${docId}`,

  // LightRAG WebUI document endpoints
  DOCUMENTS_LIST: "/documents",
  DOCUMENTS_UPLOAD: "/documents/upload",
  DOCUMENTS_DELETE: "/documents/delete_document",
  DOCUMENTS_SCAN: "/documents/scan",
  DOCUMENTS_REPROCESS_FAILED: "/documents/reprocess_failed",
  DOCUMENTS_CLEAR: "/documents",
  DOCUMENTS_CLEAR_CACHE: "/documents/clear_cache",
  DOCUMENTS_PIPELINE_STATUS: "/documents/pipeline_status",
  DOCUMENTS_CANCEL_PIPELINE: "/documents/cancel_pipeline",

  HEALTH: `${baseUrl}/health`,
} as const);

export const RAG_ENDPOINTS = createRagEndpoints(RAG_BASE_URL);
