import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import { DocDetailResponse, ListDocResponse } from "./dto/DocResponse";
import { CreateDocRequest } from "./dto/CreateDocRequest";
import { UpdateDocRequest } from "./dto/UpdateDocRequest";
import { IDoc } from "@/interfaces/doc.interface";
import createDocQuery, { DocQuery } from "./dto/DocQuery";

export const docService = {
  fetchDocuments: async (query: DocQuery): Promise<ListDocResponse> => {
    const response = await axiosInstance.get(
      `${ENDPOINTS.DOC_ENDPOINTS.GET_ALL_PAGINATED}?${createDocQuery(query)}`
    );
    return response.data;
  },

  createDocument: async (
    data: CreateDocRequest
  ): Promise<DocDetailResponse> => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description || "");
    formData.append("tags", JSON.stringify(data.tags));
    formData.append("isPublic", String(data.isPublic));
    formData.append("document", data.file); // Backend expects 'document' field

    const response = await axiosInstance.post<DocDetailResponse>(
      ENDPOINTS.DOC_ENDPOINTS.CREATE,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  getDocumentById: async (id: string): Promise<DocDetailResponse> => {
    const response = await axiosInstance.get(
      ENDPOINTS.DOC_ENDPOINTS.GET_BY_ID(id)
    );
    return response.data;
  },

  updateDocument: async (
    data: UpdateDocRequest
  ): Promise<DocDetailResponse> => {
    const formData = new FormData();
    formData.append("_id", data._id);
    formData.append("name", data.name || "");
    formData.append("description", data.description || "");
    formData.append("tags", JSON.stringify(data.tags || []));
    formData.append("isPublic", String(data.isPublic ?? true));

    if (data.file) {
      formData.append("document", data.file); // Backend expects 'document' field
    }

    const response = await axiosInstance.put<DocDetailResponse>(
      ENDPOINTS.DOC_ENDPOINTS.UPDATE(data._id),
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  hardDeleteDocument: async (id: string): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.DOC_ENDPOINTS.HARD_DELETE(id));
  },

  softDeleteDocument: async (id: string): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.DOC_ENDPOINTS.SOFT_DELETE(id));
  },

  restoreDocument: async (id: string): Promise<void> => {
    await axiosInstance.patch(ENDPOINTS.DOC_ENDPOINTS.RESTORE(id));
  },
};
