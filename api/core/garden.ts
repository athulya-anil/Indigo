import { LLMProvider } from '../providers/llm/llmFactory.js';

export interface GardenProfile {
    name: string;
    anchor: {
        principles: string[];
        location: string;
        zone: string;
        style: string;
    };
    log: {
        date: string;
        entry: string;
        tags: string[];
    }[];
    review: {
        period: string;
        summary: string;
        lessons_learned: string[];
    }[];
}

export class GardenHelper {
    private profile: GardenProfile;
    private llm: LLMProvider;

    constructor(profile: GardenProfile, llm: LLMProvider) {
        this.profile = profile;
        this.llm = llm;
    }

    async addEntry(entry: string) {
        const today = new Date().toISOString().split('T')[0];
        const tags = await this.llm.generateTags(entry);
        this.profile.log.push({
            date: today,
            entry,
            tags,
        });
        // Simple salience: Keep log size manageable?
        // For now, infinite log as per "stateless" but maybe limit in future
    }

    async addImageAnalysis(analysis: string, imageDescription?: string) {
        const today = new Date().toISOString().split('T')[0];
        const entry = imageDescription
            ? `[IMAGE ANALYSIS] ${imageDescription}: ${analysis}`
            : `[IMAGE ANALYSIS] ${analysis}`;

        this.profile.log.push({
            date: today,
            entry,
            tags: ['image-analysis', 'visual-inspection'],
        });
    }

    async askAdvice(question: string): Promise<string> {
        // Construct context from Anchor + Recent Logs + Reviews
        const context = `
    You are Indigo, a gardening assistant for the garden "${this.profile.name}".
    
    CORE PRINCIPLES:
    ${this.profile.anchor.principles.join('\n')}
    
    LOCATION/ZONE:
    ${this.profile.anchor.location} (Zone ${this.profile.anchor.zone})
    Style: ${this.profile.anchor.style}
    
    RECENT ACTIVITY:
    ${this.profile.log.slice(-5).map(l => `- [${l.date}] ${l.entry}`).join('\n')}
    
    SEASONAL REVIEWS:
    ${this.profile.review.slice(-2).map(r => `[${r.period}]: ${r.summary}`).join('\n')}
    `;

        const prompt = `${context}\n\nUser Question: ${question}\n\nIndigo's Advice:`;
        return this.llm.complete(prompt);
    }

    async seasonalReview(period: string) {
        // Summarize logs since last review
        const logsToReview = this.profile.log; // In a real app, filter by date
        if (logsToReview.length === 0) return;

        const context = logsToReview.map(l => `- ${l.entry}`).join('\n');
        const summaryPrompt = `Summarize these gardening logs for the period "${period}" into a concise summary and list 3 key lessons learned.\n\nLogs:\n${context}`;

        const response = await this.llm.complete(summaryPrompt);

        // Naively parse response (in production, use structured output)
        const summary = response.split('\n')[0]; // First line
        const lessons = [response]; // Just store the whole thing for now to be safe

        this.profile.review.push({
            period,
            summary,
            lessons_learned: lessons
        });

        // innovative memory pruning: clear logs that are summarized? 
        // For safety, we keep them in this MVP.
    }

    getProfile(): GardenProfile {
        return this.profile;
    }
}
