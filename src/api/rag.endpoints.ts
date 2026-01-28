export const RAG_BASE_URL = "http://116.118.48.169:8001";

export const RAG_ENDPOINTS = {
  CHAT_COMPLETIONS: `${RAG_BASE_URL}/v1/chat/completions`,
  COMPLETIONS: `${RAG_BASE_URL}/v1/completions`,
  CHUNKS_SEARCH: `${RAG_BASE_URL}/v1/chunks`,
  SUMMARIZE: `${RAG_BASE_URL}/v1/summarize`,
  INGEST_FILE: `${RAG_BASE_URL}/v1/ingest/file`,
  INGEST_TEXT: `${RAG_BASE_URL}/v1/ingest/text`,
  INGEST_LIST: `${RAG_BASE_URL}/v1/ingest/list`,
  INGEST_DELETE: (docId: string) => `${RAG_BASE_URL}/v1/ingest/${docId}`,
  HEALTH: `${RAG_BASE_URL}/health`,
} as const;
