import { Hono } from 'hono';
import { loadGarden, saveGarden } from '../storage/yamlStorage.js';
import { createLLM } from '../providers/llm/llmFactory.js';
import { GardenHelper } from '../core/garden.js';

const chatRoute = new Hono();

chatRoute.post('/', async (c) => {
    try {
        const { message, gardenName, provider } = await c.req.json();

        if (!message || !gardenName || !provider) {
            return c.json({ error: 'Missing required fields: message, gardenName, provider' }, 400);
        }

        const gardenProfile = await loadGarden(gardenName);
        if (!gardenProfile) {
            return c.json({ error: 'Garden not found' }, 404);
        }

        // specific handling for provider choice
        const llm = createLLM(provider);
        const helper = new GardenHelper(gardenProfile, llm);

        // Add user entry to log and attempt to save (ephemeral on Vercel)
        await helper.addEntry(message);
        await saveGarden(gardenName, helper.getProfile());

        const response = await helper.askAdvice(message);

        return c.json({ response });

    } catch (error: any) {
        console.error('Chat Error:', error);
        return c.json({ error: error.message || 'Internal Server Error' }, 500);
    }
});

export default chatRoute;
