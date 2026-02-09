# Indigo 🌿

Indigo is a specialized AI agent for gardening, inspired by the stateless, modular architecture of SoulEngine. It provides personalized advice based on your garden's specific profile/history and can analyze plant images using vision AI.

## Features
- **Stateless AI**: Logic driven by YAML garden profiles.
- **Multi-Provider**: Choose between OpenAI, Anthropic, Gemini, or Groq.
- **Vision Analysis**: Upload plant images for AI-powered health diagnosis (GPT-4V, Claude 3.5, Gemini 2.0 Flash).
- **Memory Integration**: Image analysis results are saved to garden logs and referenced in future conversations.
- **Vercel Ready**: Structure optimized for one-click deployment.
- **Garden Memory**: Tracks history and seasonal reviews to give context-aware advice.

## Project Structure
- `api/`: Backend logic (Hono + TypeScript).
  - `core/`: Domain logic (Garden Model).
  - `storage/`: YAML persistence.
  - `providers/`: LLM integrations.
- `public/`: Static frontend (Vanilla JS/CSS).
- `gardens/`: Your garden data (YAML).

## Getting Started

### Prerequisites
- Node.js > 18
- API Keys for at least one provider (OpenAI, Anthropic, etc.)

### Local Development
1. Clone and install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` with your API keys:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

### Deployment (Vercel)
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel deploy`
3. Add Environment Variables in Vercel Dashboard.

**Note on Persistence**: On Vercel, the filesystem is ephemeral. Garden logs added via chat will be processed for the current session but may reset on redeploy. For permanent storage, connect an external database or Blob store (future improvement).
