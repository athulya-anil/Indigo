import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import gardenRoute from './routes/garden.js';
import chatRoute from './routes/chat.js';
import analyzeRoute from './routes/analyze.js';

const app = new Hono().basePath('/api');

app.use('*', logger());
app.use('*', cors());

app.route('/gardens', gardenRoute);
app.route('/chat', chatRoute);
app.route('/analyze', analyzeRoute);

app.get('/', (c) => {
    return c.json({ message: 'Indigo Gardener API is running 🌿' });
});

export default handle(app);
