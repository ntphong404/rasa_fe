export interface CreateMyReponseRequest {
    name: string;
    description: string;
    define: string;
    label?: string;
    botIds: string[];
}