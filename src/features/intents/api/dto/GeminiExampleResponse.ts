export interface ApiResponse {
    success: boolean;
    data: GeminiExampleResponse;
    message: string;
}

export interface GeminiExampleResponse {
    examples: string[];
}