import { Hono } from 'hono';
import { loadGarden, saveGarden } from '../storage/yamlStorage.js';
import { createLLM } from '../providers/llm/llmFactory.js';
import { GardenHelper } from '../core/garden.js';

const analyzeRoute = new Hono();

analyzeRoute.post('/', async (c) => {
    try {
        const { image, gardenName, provider, description } = await c.req.json();

        if (!image || !gardenName || !provider) {
            return c.json({ error: 'Missing required fields: image, gardenName, provider' }, 400);
        }

        const gardenProfile = await loadGarden(gardenName);
        if (!gardenProfile) {
            return c.json({ error: 'Garden not found' }, 404);
        }

        // Create LLM with vision support
        const llm = createLLM(provider);

        // Analyze the image
        const analysisPrompt = `You are Indigo, an expert gardening AI. Analyze this plant image and provide:
1. Plant identification (if possible)
2. Health assessment (healthy, stressed, diseased, pest damage, etc.)
3. Specific observations (leaf color, spots, wilting, etc.)
4. Recommended actions (if any issues detected)

Be concise but thorough.`;

        const analysis = await llm.analyzeImage(image, analysisPrompt);

        // Save to garden memory
        const helper = new GardenHelper(gardenProfile, llm);
        await helper.addImageAnalysis(analysis, description);
        await saveGarden(gardenName, helper.getProfile());

        return c.json({ analysis });

    } catch (error: any) {
        console.error('Image Analysis Error:', error);
        return c.json({ error: error.message || 'Internal Server Error' }, 500);
    }
});

export default analyzeRoute;
