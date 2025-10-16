export interface CreateIntentRequest {
    name: string;
    description: string;
    define: string;
    entities: string[];
}