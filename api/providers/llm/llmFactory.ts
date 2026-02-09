import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export interface LLMProvider {
    complete(prompt: string): Promise<string>;
    generateTags(text: string): Promise<string[]>;
    analyzeImage(base64Image: string, prompt: string): Promise<string>;
}

export class OpenAIProvider implements LLMProvider {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4o') {
        this.client = new OpenAI({ apiKey });
        this.model = model;
    }

    async complete(prompt: string): Promise<string> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
        });
        return response.choices[0].message.content || '';
    }

    async generateTags(text: string): Promise<string[]> {
        const prompt = `Extract 3-5 relevant gardening tags from this text. Return only the tags as a comma-separated list.\n\nText: ${text}`;
        const response = await this.complete(prompt);
        return response.split(',').map(t => t.trim());
    }

    async analyzeImage(base64Image: string, prompt: string): Promise<string> {
        const response = await this.client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
        });
        return response.choices[0].message.content || '';
    }
}

export class AnthropicProvider implements LLMProvider {
    private client: Anthropic;
    private model: string;

    constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
        this.client = new Anthropic({ apiKey });
        this.model = model;
    }

    async complete(prompt: string): Promise<string> {
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
        });
        return response.content[0].text || '';
    }

    async generateTags(text: string): Promise<string[]> {
        const prompt = `Extract 3-5 relevant gardening tags from this text. Return only the tags as a comma-separated list.\n\nText: ${text}`;
        const response = await this.complete(prompt);
        return response.split(',').map(t => t.trim());
    }

    async analyzeImage(base64Image: string, prompt: string): Promise<string> {
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: 'image/jpeg',
                                data: base64Image,
                            },
                        },
                        {
                            type: 'text',
                            text: prompt,
                        },
                    ],
                },
            ],
        });
        return response.content[0].text || '';
    }
}

export class GeminiProvider implements LLMProvider {
    private client: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string, model: string = 'gemini-2.0-flash-exp') {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = this.client.getGenerativeModel({ model });
    }

    async complete(prompt: string): Promise<string> {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }

    async generateTags(text: string): Promise<string[]> {
        const prompt = `Extract 3-5 relevant gardening tags from this text. Return only the tags as a comma-separated list.\n\nText: ${text}`;
        const response = await this.complete(prompt);
        return response.split(',').map(t => t.trim());
    }

    async analyzeImage(base64Image: string, prompt: string): Promise<string> {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg',
            },
        };
        const result = await this.model.generateContent([prompt, imagePart]);
        const response = await result.response;
        return response.text();
    }
}

export class GroqProvider implements LLMProvider {
    private client: Groq;
    private model: string;

    constructor(apiKey: string, model: string = 'mixtral-8x7b-32768') {
        this.client = new Groq({ apiKey });
        this.model = model;
    }

    async complete(prompt: string): Promise<string> {
        const response = await this.client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: this.model,
        });
        return response.choices[0]?.message?.content || '';
    }

    async generateTags(text: string): Promise<string[]> {
        const prompt = `Extract 3-5 relevant gardening tags from this text. Return only the tags as a comma-separated list.\n\nText: ${text}`;
        const response = await this.complete(prompt);
        return response.split(',').map(t => t.trim());
    }

    async analyzeImage(base64Image: string, prompt: string): Promise<string> {
        // Groq doesn't support vision yet, return placeholder
        return "Image analysis not supported for Groq provider. Please use OpenAI, Anthropic, or Gemini.";
    }
}

export function createLLM(provider: string): LLMProvider {
    switch (provider.toLowerCase()) {
        case 'openai':
            return new OpenAIProvider(process.env.OPENAI_API_KEY!);
        case 'anthropic':
            return new AnthropicProvider(process.env.ANTHROPIC_API_KEY!);
        case 'gemini':
            return new GeminiProvider(process.env.GEMINI_API_KEY!);
        case 'groq':
            return new GroqProvider(process.env.GROQ_API_KEY!);
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}
