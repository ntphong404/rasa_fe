export interface IModel {
  _id: string;
  name: string;
  description: string;
  url: string;
  roles: string[];
  chatbotId: string;
  parentId: string | null;
  intents: string[];
  action: string[];
  entities: string[];
  slots: string[];
  rules: string[];
  stories: string[];
  responses: string[];
  isOriginal: boolean;
  ruleYaml?: string;
  storyYaml?: string;
  domainYaml?: string;
  nluYaml?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ITrainRequest {
  ruleIds: string[];
  storyIds: string[];
  firetune: boolean;
}

export interface ITrainResponse {
  success: boolean;
  data: {
    message: string;
    modelId: string;
    modelName: string;
    flaskResponse: {
      actions_count: number;
      files_created: string[];
      firetune: boolean;
      message: string;
      status: string;
      train_command: string;
    };
  };
  message: string;
}

export interface IModelsListResponse {
  success: boolean;
  data: IModel[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: string;
}
