import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import gardenRoute from './routes/garden.js';
import chatRoute from './routes/chat.js';
import analyzeRoute from './routes/analyze.js';

const app = new Hono();

// Serve static files from public/
app.use('/*', serveStatic({ root: './public' }));

// API routes
const api = new Hono().basePath('/api');
api.use('*', logger());
api.use('*', cors());
api.route('/gardens', gardenRoute);
api.route('/chat', chatRoute);
api.route('/analyze', analyzeRoute);
api.get('/', (c) => c.json({ message: 'Indigo API is running 🌿' }));

app.route('/api', api);

const port = 3000;
console.log(`🌿 Indigo running at http://localhost:${port}`);

serve({
    fetch: app.fetch,
    port
});
