import fs from 'fs/promises';
import path from 'path';
import { createLLM } from '../api/providers/llm/llmFactory.js';

/**
 * Simple evaluation script for plant health image analysis
 * 
 * Usage:
 * 1. Place test images in test-images/ folder
 * 2. Create ground-truth.json with format:
 *    {
 *      "image1.jpg": { "condition": "healthy", "plant": "tomato" },
 *      "image2.jpg": { "condition": "diseased", "plant": "basil", "issue": "powdery mildew" }
 *    }
 * 3. Run: node scripts/evaluate.js
 */

const TEST_IMAGES_DIR = path.join(process.cwd(), 'test-images');
const GROUND_TRUTH_FILE = path.join(TEST_IMAGES_DIR, 'ground-truth.json');

async function loadGroundTruth() {
    try {
        const data = await fs.readFile(GROUND_TRUTH_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading ground truth file. Please create test-images/ground-truth.json');
        process.exit(1);
    }
}

async function evaluateImage(imagePath, groundTruth, provider) {
    const imageBuffer = await fs.readFile(imagePath);
    const base64 = imageBuffer.toString('base64');

    const prompt = `Analyze this plant image. Identify:
1. Plant type (if possible)
2. Health condition (healthy, diseased, pest damage, stressed)
3. Specific issues (if any)

Respond in JSON format: { "plant": "...", "condition": "...", "issue": "..." }`;

    const llm = createLLM(provider);
    const response = await llm.analyzeImage(base64, prompt);

    // Simple parsing (in production, use structured output)
    let prediction;
    try {
        prediction = JSON.parse(response);
    } catch {
        // Fallback: extract keywords
        prediction = {
            plant: response.toLowerCase().includes(groundTruth.plant?.toLowerCase() || '') ? groundTruth.plant : 'unknown',
            condition: response.toLowerCase().includes('healthy') ? 'healthy' : 'diseased'
        };
    }

    return prediction;
}

async function main() {
    const provider = process.argv[2] || 'openai';
    console.log(`\n🌿 Indigo Image Analysis Evaluation`);
    console.log(`Provider: ${provider}\n`);

    const groundTruth = await loadGroundTruth();
    const images = Object.keys(groundTruth);

    let correct = 0;
    let total = images.length;

    for (const imageName of images) {
        const imagePath = path.join(TEST_IMAGES_DIR, imageName);
        const truth = groundTruth[imageName];

        console.log(`Testing: ${imageName}`);
        console.log(`  Expected: ${truth.condition} ${truth.plant || ''}`);

        try {
            const prediction = await evaluateImage(imagePath, truth, provider);
            console.log(`  Predicted: ${prediction.condition} ${prediction.plant || ''}`);

            // Simple accuracy: condition match
            if (prediction.condition?.toLowerCase() === truth.condition?.toLowerCase()) {
                correct++;
                console.log(`  ✅ Correct\n`);
            } else {
                console.log(`  ❌ Incorrect\n`);
            }
        } catch (error) {
            console.log(`  ⚠️  Error: ${error.message}\n`);
        }
    }

    const accuracy = (correct / total * 100).toFixed(2);
    console.log(`\n📊 Results: ${correct}/${total} correct (${accuracy}% accuracy)`);
}

main().catch(console.error);
