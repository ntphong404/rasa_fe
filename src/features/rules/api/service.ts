import axiosInstance from "@/api/axios";
import ENDPOINTS from "@/api/endpoints";
import { RuleDetailResponse, ListRuleResponse } from "./dto/RuleResponse";
import { CreateRuleRequest } from "./dto/CreateRuleRequest";
import { IRule } from "@/interfaces/rule.interface";
import createRuleQuery, { RuleQuery } from "./dto/RuleQuery";
import { IIntent } from "@/interfaces/intent.interface";
import createIntentQuery from "@/features/intents/api/dto/IntentQuery";
import { IAction } from "@/interfaces/action.interface";
import createActionQuery from "@/features/action/api/dto/ActionQuery";
import { IMyResponse } from "@/interfaces/response.interface";
import { responseService } from "@/features/reponses/api/service";

export const ruleService = {
  fetchRules: async (query: RuleQuery): Promise<ListRuleResponse> => {
    const response = await axiosInstance.get(`${ENDPOINTS.RULE_ENDPOINTS.GET_ALL_PAGINATED}?${createRuleQuery(query)}`);
    return response.data;
  },
  createRule: async (data: CreateRuleRequest): Promise<IRule> => {
    const response = await axiosInstance.post(ENDPOINTS.RULE_ENDPOINTS.CREATE, data);
    return response.data.data;
  },
  getRuleById: async (id: string): Promise<RuleDetailResponse> => {
    const response = await axiosInstance.get(ENDPOINTS.RULE_ENDPOINTS.GET_BY_ID(id));
    return response.data.data;
  },
  updateRule: async (id: string, data: IRule): Promise<IRule> => {
    const response = await axiosInstance.put(ENDPOINTS.RULE_ENDPOINTS.UPDATE(id), data);
    return response.data.data;
  },
  hardDeleteRule: async (id: string): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.RULE_ENDPOINTS.HARD_DELETE(id));
  },
  softDeleteRule: async (id: string): Promise<void> => {
    await axiosInstance.delete(ENDPOINTS.RULE_ENDPOINTS.SOFT_DELETE(id));
  },
  restoreRule: async (id: string): Promise<void> => {
    await axiosInstance.patch(ENDPOINTS.RULE_ENDPOINTS.RESTORE(id));
  },
  searchIntentForRule: async (query: string): Promise<IIntent[]> => {
    const response = await axiosInstance.get(`${ENDPOINTS.INTENT_ENDPOINTS.GET_ALL_PAGINATED}?${createIntentQuery({ search: query, limit: 5 })}`);
    return response.data.data;
  },
  searchActionForRule: async (query: string): Promise<IAction[]> => {
    const response = await axiosInstance.get(`${ENDPOINTS.ACTION_ENDPOINTS.GET_ALL_PAGINATED}?${createActionQuery({ search: query, limit: 5 })}`);
    return response.data.data;
  },
  searchResponseForRule: async (query: string): Promise<IMyResponse[]> => {
    const response = await responseService.fetchResponses(`search=${query}&limit=5`);
    return response.data;
  }
};
