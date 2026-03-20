export interface CreateRuleRequest {
  name: string;
  description: string;
  define: string;
  botIds: string[];
  intents?: string[];
  responses?: string[];
  action?: string[]; // Backend uses singular 'action'
  roles?: string[];
}
