import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import { ListActionResponse } from "./dto/ActionResponse";
import { CreateActionRequest } from "./dto/CreateActionRequest";
import { IAction } from "@/interfaces/action.interface";
import createActionQuery, { ActionQuery } from "./dto/ActionQuery";

export const actionService = {
    fetchActions: async (query: ActionQuery): Promise<ListActionResponse> => {
        const response = await axiosInstance.get(
            `${ENDPOINTS.ACTION_ENDPOINTS.GET_ALL_PAGINATED}?${createActionQuery(query)}`
        );
        return response.data;
    },

    createAction: async (data: CreateActionRequest): Promise<IAction> => {
        const response = await axiosInstance.post(ENDPOINTS.ACTION_ENDPOINTS.CREATE, data);
        return response.data.data;
    },

    getActionById: async (id: string): Promise<IAction> => {
        const response = await axiosInstance.get(ENDPOINTS.ACTION_ENDPOINTS.GET_BY_ID(id));
        return response.data.data;
    },

    updateAction: async (id: string, data: IAction): Promise<IAction> => {
        const response = await axiosInstance.put(ENDPOINTS.ACTION_ENDPOINTS.UPDATE(id), data);
        return response.data.data;
    },

    hardDeleteAction: async (id: string): Promise<void> => {
        await axiosInstance.delete(ENDPOINTS.ACTION_ENDPOINTS.HARD_DELETE(id));
    },

    softDeleteAction: async (id: string): Promise<void> => {
        await axiosInstance.delete(ENDPOINTS.ACTION_ENDPOINTS.SOFT_DELETE(id));
    },

    restoreAction: async (id: string): Promise<void> => {
        await axiosInstance.patch(ENDPOINTS.ACTION_ENDPOINTS.RESTORE(id));
    }
};
