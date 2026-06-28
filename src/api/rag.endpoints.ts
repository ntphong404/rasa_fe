export const getRagUrl = (ragUrl: string): string => {
  const trimmed = ragUrl.trim().replace(/\/+$/, "");
  try {
    new URL(trimmed);
  } catch {
    throw new Error(`Invalid RAG URL: "${ragUrl}"`);
  }
  return trimmed;
};

export const createRagEndpoints = (baseUrl: string) => ({
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
  DOCUMENTS_LIST: `${baseUrl}/documents`,
  DOCUMENTS_UPLOAD: `${baseUrl}/documents/upload`,
  DOCUMENTS_DELETE: `${baseUrl}/documents/delete_document`,
  DOCUMENTS_SCAN: `${baseUrl}/documents/scan`,
  DOCUMENTS_REPROCESS_FAILED: `${baseUrl}/documents/reprocess_failed`,
  DOCUMENTS_CLEAR: `${baseUrl}/documents`,
  DOCUMENTS_CLEAR_CACHE: `${baseUrl}/documents/clear_cache`,
  DOCUMENTS_PIPELINE_STATUS: `${baseUrl}/documents/pipeline_status`,
  DOCUMENTS_CANCEL_PIPELINE: `${baseUrl}/documents/cancel_pipeline`,

  HEALTH: `${baseUrl}/health`,
} as const);
