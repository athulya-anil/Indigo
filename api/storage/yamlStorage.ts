import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { GardenProfile } from '../core/garden.js';

const GARDENS_DIR = path.join(process.cwd(), 'gardens');

export async function loadGarden(name: string): Promise<GardenProfile | null> {
    try {
        const filePath = path.join(GARDENS_DIR, `${name}.yaml`);
        const fileContents = await fs.readFile(filePath, 'utf8');
        return yaml.load(fileContents) as GardenProfile;
    } catch (error) {
        // console.error(`Error loading garden ${name}:`, error);
        return null;
    }
}

export async function saveGarden(name: string, profile: GardenProfile): Promise<void> {
    // logic to ensure directory exists
    try {
        await fs.access(GARDENS_DIR);
    } catch {
        await fs.mkdir(GARDENS_DIR, { recursive: true });
    }

    const filePath = path.join(GARDENS_DIR, `${name}.yaml`);
    const yamlStr = yaml.dump(profile);
    await fs.writeFile(filePath, yamlStr, 'utf8');

    // Vercel Warning
    if (process.env.VERCEL) {
        console.warn("WARNING: Writing to local filesystem on Vercel. This data is ephemeral and will be lost on redeploy.");
    }
}

export async function listGardens(): Promise<string[]> {
    try {
        await fs.access(GARDENS_DIR);
        const files = await fs.readdir(GARDENS_DIR);
        return files.filter(f => f.endsWith('.yaml')).map(f => f.replace('.yaml', ''));
    } catch {
        return [];
    }
}
