import { IIntent } from "./intent.interface";
import { IMyResponse } from "./response.interface";
import { IAction } from "./action.interface";

export interface IRule {
  _id: string;
  name: string;
  description: string;
  define: string; // yaml text
  intents: IIntent[] | string[]; // Can be populated or just IDs
  responses: IMyResponse[] | string[]; // Can be populated or just IDs
  action: IAction[] | string[]; // Backend uses singular 'action', can be populated or just IDs

  roles: string[];

  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
  deletedAt?: Date;
}