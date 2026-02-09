import { Hono } from 'hono';
import { listGardens, loadGarden } from '../storage/yamlStorage.js';

const gardenRoute = new Hono();

gardenRoute.get('/', async (c) => {
    const gardens = await listGardens();
    return c.json({ gardens });
});

gardenRoute.get('/:name', async (c) => {
    const name = c.req.param('name');
    const garden = await loadGarden(name);

    if (!garden) {
        return c.json({ error: 'Garden not found' }, 404);
    }

    return c.json(garden);
});

export default gardenRoute;
