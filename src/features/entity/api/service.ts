import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import { ListEnityResponse } from "./dto/EntityResponse";
import { CreateEntityRequest } from "./dto/CreateEntityRequest";
import { IEntity } from "@/interfaces/entity.interface";
import createEntityQuery, { EntityQuery } from "./dto/EnityQuery";

export const entityService = {
    fetchEntities: async (query: EntityQuery): Promise<ListEnityResponse> => {
        const response = await axiosInstance.get(`${ENDPOINTS.ENTITY_ENDPOINTS.GET_ALL_PAGINATED}?${createEntityQuery(query)}`);
        return response.data;
    },
    createEntity: async (data: CreateEntityRequest) : Promise<IEntity> => {
        const response = await axiosInstance.post(ENDPOINTS.ENTITY_ENDPOINTS.CREATE, data);
        return response.data.data;
    },
    getEntityById: async (id: string) : Promise<IEntity> => {
        const response = await axiosInstance.get(ENDPOINTS.ENTITY_ENDPOINTS.GET_BY_ID(id));
        return response.data.data;
    },
    updateEntity: async (id: string, data: IEntity) : Promise<IEntity> => {
        const response = await axiosInstance.put(ENDPOINTS.ENTITY_ENDPOINTS.UPDATE(id), data);
        return response.data.data;
    },
    hardDeleteEntity: async (id: string) : Promise<void> => {
        await axiosInstance.delete(ENDPOINTS.ENTITY_ENDPOINTS.HARD_DELETE(id));
    },
    softDeleteEntity: async (id: string) : Promise<void> => {
        await axiosInstance.delete(ENDPOINTS.ENTITY_ENDPOINTS.SOFT_DELETE(id));
    },
    restoreEntity: async (id: string) : Promise<void> => {
        await axiosInstance.patch(ENDPOINTS.ENTITY_ENDPOINTS.RESTORE(id));
    }
}