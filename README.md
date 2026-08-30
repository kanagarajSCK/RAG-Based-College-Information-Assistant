# CampusIQ - College Information Assistant

CampusIQ is a full-stack college information assistant powered by Retrieval-Augmented Generation (RAG). Students can ask questions about official college information such as academics, examinations, hostels, libraries, scholarships, and placements. Administrators can manage the knowledge base by uploading and maintaining college documents.

## Highlights

- AI-assisted answers grounded in college documents
- Role-based student and administrator access
- JWT authentication
- Document upload and management for administrators
- PDF, TXT, Markdown, DOC, DOCX, and JSON document support
- Conversation history and searchable knowledge base
- Local JSON persistence with optional MongoDB configuration
- Separate Vercel frontend and Render backend deployment support

## Technology

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- AI: Google Gemini API
- Authentication: JWT and bcryptjs
- Document processing: pdf-parse and Multer
- Deployment: Vercel and Render

## Project Structure

```text
.
├── src/                    React frontend
│   ├── components/         UI views and dashboards
│   ├── context/            Authentication and toast state
│   ├── services/api.ts     Axios API client
│   └── types/              Shared frontend types
├── server/                 Express backend
│   ├── config/             Environment and RAG configuration
│   ├── controllers/        Authentication, chat, document, and admin logic
│   ├── routes/              API route definitions
│   └── services/           Database, embeddings, RAG, and document services
├── data/db.json            Local JSON database
├── server.ts               Application entry point
├── vercel.json              Vercel frontend configuration
└── render.yaml              Render backend configuration
```

## Prerequisites

- Node.js 18 or newer
- npm
- A Google Gemini API key for AI features
- Git for deployment from GitHub

## Local Setup

Clone the repository and install dependencies:

```powershell
git clone https://github.com/kanagarajSCK/RAG-Based-College-Information-Assistant.git
cd RAG-Based-College-Information-Assistant
npm install
```

Create a local environment file:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set at least:

```env
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=replace_with_a_long_random_secret
PORT=3000
FRONTEND_URL=http://localhost:3000
VITE_API_URL=
```

Start the application:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). During development, the Express server hosts the Vite middleware and API together.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the combined development server |
| `npm run build:frontend` | Build the Vite frontend into `dist` |
| `npm run build:server` | Bundle the backend into `dist/server.cjs` |
| `npm run build` | Build frontend and backend |
| `npm start` | Start the production backend bundle |
| `npm run preview` | Preview the built frontend with Vite |
| `npm run lint` | Run the TypeScript check |

## Environment Variables

### Backend: Render or local `.env`

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes for AI | Google Gemini API key |
| `JWT_SECRET` | Yes in production | Secret used to sign login tokens |
| `FRONTEND_URL` | Yes for split deployment | Exact Vercel URL allowed by CORS; comma-separated URLs are supported |
| `MONGODB_URI` | Optional | MongoDB connection string; local JSON storage is used when empty |
| `AI_MODEL` | Optional | Gemini generation model |
| `EMBEDDING_MODEL` | Optional | Gemini embedding model |
| `PORT` | Optional | Server port; Render supplies its own port automatically |

### Frontend: Vercel

```env
VITE_API_URL=https://campusiq-backend-bcap.onrender.com
```

Do not append `/api`; the frontend API client adds that path automatically. `VITE_` values are included in the browser bundle, so this variable must contain only the public backend URL and never a secret.

## Production Deployment

### 1. Deploy the backend to Render

Create a Render **Web Service** connected to the `main` branch.

Use:

```text
Build Command: npm install && npm run build:server
Start Command: npm start
```

Set these Render environment variables:

```env
NODE_ENV=production
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_long_random_secret
FRONTEND_URL=https://your-project.vercel.app
```

Render provides the `PORT` variable automatically. The deployed API will be available at a URL similar to:

```text
https://your-backend.onrender.com
```

### 2. Deploy the frontend to Vercel

Import the same GitHub repository into Vercel. The included `vercel.json` uses:

```text
Build Command: npm run build:frontend
Output Directory: dist
Install Command: npm install
```

Add this Vercel environment variable:

```env
VITE_API_URL=https://your-backend.onrender.com
```

Deploy the `main` branch.

### 3. Complete the connection

Copy the final Vercel URL into Render as `FRONTEND_URL`, without a trailing slash. Redeploy the Render service after changing it. If the Vercel URL or `VITE_API_URL` changes, redeploy the Vercel project too.

## Health Checks

Backend root status:

```text
GET https://your-backend.onrender.com/
```

API health status:

```text
GET https://your-backend.onrender.com/api/health
```

A healthy response from `/api/health` includes `status: "ok"`.

## Troubleshooting

### Frontend shows Network Error during login

1. Confirm Vercel has `VITE_API_URL` set to the Render URL without `/api`.
2. Confirm the Vercel project was redeployed after changing the variable.
3. Confirm Render has `FRONTEND_URL` set to the exact Vercel URL without a trailing slash.
4. Confirm Render has been redeployed after changing `FRONTEND_URL`.
5. Open `/api/health` on the Render URL and verify it returns status `ok`.
6. Check the browser developer console for the failed request URL.

### Render displays `Cannot GET /`

The root endpoint should return a JSON service status. If it does not, wait for the latest GitHub commit to finish deploying and check the Render deploy logs.

### Data disappears after a restart

The default database is `data/db.json`, which is suitable for development and demos. For production data, configure MongoDB or attach durable storage according to the hosting provider's current plan and storage options. Uploaded files also require persistent storage in production.

## Security Notes

- Never commit `.env` or API keys to GitHub.
- Use a unique, strong `JWT_SECRET` in production.
- Keep `GEMINI_API_KEY`, `JWT_SECRET`, and `MONGODB_URI` on the backend only.
- Only `VITE_API_URL` should be exposed to the frontend.
- Restrict `FRONTEND_URL` to trusted origins.

## License

No license has been specified for this repository.
