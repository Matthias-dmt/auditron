export interface LLMOptions {
    temperature?: number;
    maxTokens?: number;
    model?: string;
}

export interface LLMAdapter {
    complete(prompt: string, options: LLMOptions): Promise<string>;
}