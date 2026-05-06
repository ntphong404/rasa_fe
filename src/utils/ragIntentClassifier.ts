/**
 * RAG Intent Classifier
 * Tự động phát hiện intent của câu hỏi để chọn endpoint RAG phù hợp
 */

export enum RAGIntent {
  QUERY = "query",           // Hỏi đáp thông thường
  SEARCH = "search",         // Tìm kiếm thông tin cụ thể
  SUMMARIZE = "summarize",   // Tóm tắt tài liệu
  GENERATE = "generate",     // Sinh nội dung, viết văn bản
}

interface IntentPattern {
  keywords: string[];
  patterns: RegExp[];
  priority: number; // Độ ưu tiên (cao hơn = ưu tiên hơn)
}

const INTENT_PATTERNS: Record<RAGIntent, IntentPattern> = {
  [RAGIntent.SUMMARIZE]: {
    keywords: [
      "tóm tắt",
      "tổng hợp",
      "tóm lược",
      "tóm gọn",
      "nội dung chính",
      "ý chính",
      "điểm chính",
      "summarize",
      "summary",
      "tổng kết",
      "tóm lại",
      "tóm",
    ],
    patterns: [
      /tóm\s*tắt/i,
      /tổng\s*hợp/i,
      /nội\s*dung\s*chính/i,
      /ý\s*chính/i,
      /điểm\s*chính/i,
      /tóm\s*lại/i,
    ],
    priority: 3,
  },

  [RAGIntent.SEARCH]: {
    keywords: [
      "tìm",
      "tìm kiếm",
      "tra cứu",
      "tìm thông tin",
      "search",
      "find",
      "lookup",
      "có thông tin",
      "có nội dung",
      "có đề cập",
      "nói về",
      "liệt kê",
      "danh sách",
      "list",
    ],
    patterns: [
      /tìm\s*(kiếm)?/i,
      /tra\s*cứu/i,
      /có\s*(thông\s*tin|nội\s*dung|đề\s*cập)/i,
      /nói\s*về/i,
      /liệt\s*kê/i,
      /danh\s*sách/i,
    ],
    priority: 2,
  },

  [RAGIntent.GENERATE]: {
    keywords: [
      "viết",
      "tạo",
      "sinh",
      "soạn",
      "generate",
      "create",
      "write",
      "compose",
      "làm",
      "giúp tôi viết",
      "giúp tôi tạo",
      "giúp tôi soạn",
    ],
    patterns: [
      /viết\s*(cho\s*tôi|giúp|hộ)?/i,
      /tạo\s*(cho\s*tôi|giúp|hộ)?/i,
      /sinh\s*(cho\s*tôi|giúp|hộ)?/i,
      /soạn\s*(cho\s*tôi|giúp|hộ)?/i,
      /giúp\s*(tôi)?\s*(viết|tạo|soạn)/i,
    ],
    priority: 2,
  },

  [RAGIntent.QUERY]: {
    keywords: [
      "là gì",
      "như thế nào",
      "thế nào",
      "tại sao",
      "vì sao",
      "khi nào",
      "ở đâu",
      "ai",
      "what",
      "how",
      "why",
      "when",
      "where",
      "who",
      "có phải",
      "có đúng",
      "giải thích",
      "cho biết",
      "hỏi",
    ],
    patterns: [
      /là\s*gì/i,
      /(như|thế)\s*nào/i,
      /(tại|vì)\s*sao/i,
      /khi\s*nào/i,
      /ở\s*đâu/i,
      /có\s*(phải|đúng)/i,
      /giải\s*thích/i,
      /cho\s*biết/i,
    ],
    priority: 1, // Mặc định thấp nhất
  },
};

/**
 * Phát hiện intent của câu hỏi
 */
export function detectRAGIntent(question: string): RAGIntent {
  const normalizedQuestion = question.toLowerCase().trim();

  // Tính điểm cho mỗi intent
  const scores: Record<RAGIntent, number> = {
    [RAGIntent.QUERY]: 0,
    [RAGIntent.SEARCH]: 0,
    [RAGIntent.SUMMARIZE]: 0,
    [RAGIntent.GENERATE]: 0,
  };

  // Duyệt qua từng intent
  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    const intentType = intent as RAGIntent;

    // Kiểm tra keywords
    for (const keyword of pattern.keywords) {
      if (normalizedQuestion.includes(keyword.toLowerCase())) {
        scores[intentType] += pattern.priority;
      }
    }

    // Kiểm tra patterns (regex)
    for (const regex of pattern.patterns) {
      if (regex.test(normalizedQuestion)) {
        scores[intentType] += pattern.priority * 1.5; // Regex có trọng số cao hơn
      }
    }
  }

  // Tìm intent có điểm cao nhất
  let maxScore = 0;
  let detectedIntent = RAGIntent.QUERY; // Mặc định là QUERY

  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedIntent = intent as RAGIntent;
    }
  }

  return detectedIntent;
}

/**
 * Lấy endpoint phù hợp dựa trên intent
 */
export function getRAGEndpoint(intent: RAGIntent): string {
  const endpoints = {
    [RAGIntent.QUERY]: "/v1/chat/completions",
    [RAGIntent.SEARCH]: "/v1/chunks",
    [RAGIntent.SUMMARIZE]: "/v1/summarize",
    [RAGIntent.GENERATE]: "/v1/completions",
  };

  return endpoints[intent];
}

/**
 * Lấy mô tả intent (để hiển thị cho user)
 */
export function getIntentDescription(intent: RAGIntent): string {
  const descriptions = {
    [RAGIntent.QUERY]: "Hỏi đáp",
    [RAGIntent.SEARCH]: "Tìm kiếm",
    [RAGIntent.SUMMARIZE]: "Tóm tắt",
    [RAGIntent.GENERATE]: "Sinh nội dung",
  };

  return descriptions[intent];
}
