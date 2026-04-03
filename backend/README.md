# Book Buddy AI Backend

Express.js backend server providing AI capabilities for the Book Buddy library management system using Google's Gemini API.

## Features (A-Z)

| Letter | Feature | Endpoint |
|--------|---------|----------|
| A | **Chat** - Conversational AI assistant | `POST /api/ai/chat` |
| B | **Summarization** - Text/book summary generation | `POST /api/ai/summarize` |
| C | **Cataloging** - Auto-generate book metadata | `POST /api/ai/catalog` |
| D | **Damage Detection** - Assess book condition | `POST /api/ai/damage-detection` |
| E | **Analytics** - Library data insights | `POST /api/ai/analytics` |
| F | **Fine Calculator** - Smart fine estimation | `POST /api/ai/calculate-fine` |
| G | **Goals** - Reading goal assistance | `POST /api/ai/reading-goal` |
| H | **Help/Study Companion** - Educational Q&A | `POST /api/ai/study` |
| I | **Image Analysis** - Multi-modal AI vision | `POST /api/ai/analyze-image` |
| J | **JSON Processing** - Bulk import handling | `POST /api/ai/bulk-import` |
| K | **Knowledge** - General text generation | `POST /api/ai/generate` |
| L | **Library Reports** - Automated reporting | `POST /api/ai/report` |
| M | **Members Analytics** - Student insights | `POST /api/ai/student-analytics` |
| N | **Notifications** - Personalized messages | `POST /api/ai/notification` |
| O | **Organization** - Shelf management | `POST /api/ai/shelf-organization` |
| P | **Predictions** - Availability forecasting | `POST /api/ai/predict-availability` |
| Q | **Query Processing** - Voice search | `POST /api/ai/voice-query` |
| R | **Recommendations** - Book suggestions | `POST /api/ai/recommendations` |
| S | **Stats Analysis** - Reading insights | `POST /api/ai/reading-stats` |
| T | **Text Analysis** - Review sentiment | `POST /api/ai/analyze-reviews` |

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your Gemini API key
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

## API Usage

### Chat Example
```bash
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the best sci-fi books?", "history": []}'
```

### Book Recommendations Example
```bash
curl -X POST http://localhost:3001/api/ai/recommendations \
  -H "Content-Type: application/json" \
  -d '{"preferences": "I like mystery novels with plot twists", "count": 3}'
```

### Summarization Example
```bash
curl -X POST http://localhost:3001/api/ai/summarize \
  -H "Content-Type: application/json" \
  -d '{"text": "Long book description here...", "maxLength": 200}'
```

## Models Available

- `gemini-1.5-flash` - Fast, efficient for simple tasks
- `gemini-1.5-pro` - Powerful for complex reasoning
- `gemini-2.0-flash-exp` - Latest with best performance

## Health Check

```bash
curl http://localhost:3001/api/health
```
