import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";

export interface IImportBatch {
  importBatchId: string;
  importLabel: string | null;
  sourceType: string | null;
  createdAt: string;
  counts: {
    intents: number;
    rules: number;
    stories: number;
    responses: number;
    actions: number;
    entities: number;
    slots: number;
  };
  totalCount: number;
  activeCount: number;
}

export interface IImportExcelResult {
  importBatchId: string;
  importLabel: string;
  dryRun: boolean;
  summary: {
    totalRows: number;
    created: number;
    skipped: number;
    failed: number;
    sheets: string[];
  };
  errors: Array<{ sheet: string; row: number; intent: string; reason: string }>;
}

export const importService = {
  getBatches: async (botId?: string): Promise<IImportBatch[]> => {
    const query = botId ? `?botId=${encodeURIComponent(botId)}` : "";
    const response = await axiosInstance.get(
      `${ENDPOINTS.IMPORT_ENDPOINTS.GET_BATCHES}${query}`
    );
    return response.data?.data ?? [];
  },

  toggleBatch: async (botId: string, batchId: string, isActive: boolean): Promise<void> => {
    await axiosInstance.patch(
      `${ENDPOINTS.IMPORT_ENDPOINTS.TOGGLE_BATCH(batchId)}?botId=${encodeURIComponent(botId)}`,
      { isActive }
    );
  },

  deleteBatch: async (botId: string, batchId: string): Promise<void> => {
    await axiosInstance.delete(
      `${ENDPOINTS.IMPORT_ENDPOINTS.DELETE_BATCH(batchId)}?botId=${encodeURIComponent(botId)}`
    );
  },

  importExcel: async (
    botId: string,
    file: File,
    options?: {
      importLabel?: string;
      dryRun?: boolean;
    }
  ): Promise<IImportExcelResult> => {
    const params = new URLSearchParams({ botId });
    if (options?.importLabel) params.append("importLabel", options.importLabel);
    if (options?.dryRun) params.append("dryRun", "true");

    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post(
      `${ENDPOINTS.IMPORT_ENDPOINTS.IMPORT_EXCEL}?${params.toString()}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data?.data;
  },
};
