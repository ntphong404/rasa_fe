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
