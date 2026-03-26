export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ContextFilter {
  docs_ids?: string[];
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  use_context?: boolean;
  include_sources?: boolean;
  stream?: boolean;
  context_filter?: ContextFilter;
}

export interface DocumentMetadata {
  file_name: string;
  page_label?: string;
}

export interface IngestedDocument {
  object: string;
  doc_id: string;
  doc_metadata: DocumentMetadata;
}

export interface ContextChunk {
  object: string;
  score: number;
  document: IngestedDocument;
  text: string;
  previous_texts?: string[];
  next_texts?: string[];
}

export interface ChatChoice {
  finish_reason: string;
  message: ChatMessage;
  sources?: ContextChunk[];
  index: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatChoice[];
}

export interface ChunkSearchRequest {
  text: string;
  limit?: number;
  prev_next_chunks?: number;
  context_filter?: ContextFilter;
}

export interface ChunkSearchResponse {
  object: string;
  model: string;
  data: ContextChunk[];
}

export interface IngestedDocumentsResponse {
  object: string;
  model: string;
  data: IngestedDocument[];
}

export type DocStatus = "pending" | "processing" | "preprocessed" | "processed" | "failed";

export interface LightRagDocumentStatusItem {
  id: string;
  content_summary: string;
  content_length: number;
  status: DocStatus;
  created_at: string;
  updated_at: string;
  track_id?: string;
  chunks_count?: number;
  error_msg?: string;
  metadata?: Record<string, unknown>;
  file_path: string;
}

export interface LightRagDocumentsStatusesResponse {
  statuses: Record<string, LightRagDocumentStatusItem[]>;
}

export interface LightRagDocActionResponse {
  status: "success" | "partial_success" | "failure" | "duplicated" | "deletion_started" | "busy" | "not_allowed" | "scanning_started" | "reprocessing_started" | "cancellation_requested" | "not_busy";
  message: string;
  track_id?: string;
  doc_id?: string;
}

export interface LightRagPipelineStatusResponse {
  autoscanned: boolean;
  busy: boolean;
  job_name: string;
  job_start?: string;
  docs: number;
  batchs: number;
  cur_batch: number;
  request_pending: boolean;
  cancellation_requested?: boolean;
  latest_message: string;
  history_messages?: string[];
  update_status?: Record<string, unknown>;
}
