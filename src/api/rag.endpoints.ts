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

export const RAG_ENDPOINTS = {
  CHAT_COMPLETIONS: `${RAG_BASE_URL}/v1/chat/completions`,
  COMPLETIONS: `${RAG_BASE_URL}/v1/completions`,
  CHUNKS_SEARCH: `${RAG_BASE_URL}/v1/chunks`,
  SUMMARIZE: `${RAG_BASE_URL}/v1/summarize`,

  // Legacy ingest endpoints
  INGEST_FILE: `${RAG_BASE_URL}/v1/ingest/file`,
  INGEST_TEXT: `${RAG_BASE_URL}/v1/ingest/text`,
  INGEST_LIST: `${RAG_BASE_URL}/v1/ingest/list`,
  INGEST_DELETE: (docId: string) => `${RAG_BASE_URL}/v1/ingest/${docId}`,

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

  HEALTH: `${RAG_BASE_URL}/health`,
} as const;
