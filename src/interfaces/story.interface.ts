

export interface IStory {
  _id: string;
  name: string;
  description: string;
  define: string; // yaml text
  intents: string[];
  responses: string[];
  action: string[];
  entities: string[];
  slots: string[];
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
  deleted?: boolean;
  deleted_at?: string;
}

export interface ICreateStory {
  name: string;
  description: string;
  define: string;
  intents: string[];
  responses: string[];
  action: string[];
  entities: string[];
  slots: string[];
  roles: string[];
}

export interface IUpdateStory extends ICreateStory {
  _id: string;
}

export interface IStoryDetailResponse {
  success: boolean;
  message: string;
  data: IStory;
}

export interface IStoryPopulated extends Omit<IStory, 'intents' | 'responses' | 'action' | 'entities' | 'slots'> {
  intents: Array<{ _id: string; name: string } | string>;
  responses: Array<{ _id: string; name: string } | string>;
  action: Array<{ _id: string; name: string } | string>;
  entities: Array<{ _id: string; name: string } | string>;
  slots: Array<{ _id: string; name: string } | string>;
}