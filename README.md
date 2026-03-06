# ui-demo-vercel

Vercel-ready clone of **ui-demo** with **no backend**. Everything is dummy data orchestrated in the browser so it behaves like a read backend.

- **No API calls** — all data is in-memory.
- **No SSE/WebSocket** — streaming is simulated with delayed fake events.
- **Deploy on Vercel** — static build; `vercel.json` rewrites routes to `index.html` for React Router.

## Run locally

```bash
npm install
npm run dev
```

## Build & deploy (Vercel)

```bash
npm run build
# Deploy the `dist` folder to Vercel (or connect the repo in Vercel dashboard).
```

Vercel will use `vercel.json`: build command `npm run build`, output directory `dist`, and SPA rewrites so `/plans/:id` and `/test-manager` work.

## What’s different from ui-demo

| Area | ui-demo | ui-demo-vercel |
|------|--------|-----------------|
| API | `src/api/client.js` (axios → backend) | Dummy client: in-memory stores, same function signatures |
| SSE | `src/hooks/useSSE.js` (fetch POST stream) | Simulated stream: fake status/progress events then `plan_completed` |
| Chat WebSocket | `src/hooks/useChatWebSocket.js` (real WS) | No connection; chat UI still renders but send is disabled |
| Vite | Proxy to backend | No proxy |
| Deploy | Needs backend | Static only; Vercel-ready |

Creating a new plan from the home page will “stream” fake progress and then show a completed plan with dummy scenarios and test cases. Test Manager and Recent Plans use the same dummy data.
