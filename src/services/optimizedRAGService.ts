/**
 * Optimized RAG Service with Caching
 * Wraps ragService with intelligent caching layer
 */

import { ragService } from "@/features/chat/api/ragService";
import CacheManager, { CACHE_KEYS, CACHE_TTL } from "@/utils/cacheManager";
import type { IngestedDocumentsResponse } from "@/interfaces/rag.interface";

export class OptimizedRAGService {
  /**
   * List ingested documents with caching
   */
  static async listIngestedDocuments(
    forceRefresh = false
  ): Promise<IngestedDocumentsResponse> {
    // Check cache first
    if (!forceRefresh) {
      const cached =
        CacheManager.get<IngestedDocumentsResponse>(CACHE_KEYS.DOCUMENTS);
      if (cached) {
        return cached;
      }
    }

    // Fetch from API
    console.log("🔄 Fetching documents from API");
    const response = await ragService.listIngestedDocuments();

    // Cache response
    CacheManager.set(CACHE_KEYS.DOCUMENTS, response, CACHE_TTL.MEDIUM);

    return response;
  }

  /**
   * Ingest file and invalidate cache
   */
  static async ingestFile(file: File): Promise<IngestedDocumentsResponse> {
    const response = await ragService.ingestFile(file);

    // Invalidate documents cache
    CacheManager.remove(CACHE_KEYS.DOCUMENTS);

    return response;
  }

  /**
   * Delete document and invalidate cache
   */
  static async deleteDocument(docId: string): Promise<void> {
    await ragService.deleteDocument(docId);

    // Invalidate documents cache
    CacheManager.remove(CACHE_KEYS.DOCUMENTS);
  }

  /**
   * Clear all RAG caches
   */
  static clearCache(): void {
    CacheManager.remove(CACHE_KEYS.DOCUMENTS);
  }
}

export default OptimizedRAGService;
