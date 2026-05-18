# MediSimple

A prescription decoder for rural India — upload a photo of a handwritten doctor's prescription and get a plain-language explanation of every medicine, dosage, side effects, cheaper alternatives, and full translations in Hindi, Tamil, Kannada, and Telugu.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/medisimple run dev` — run the frontend (dynamic port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui
- API: Express 5
- AI: Anthropic Claude claude-sonnet-4-6 with vision (via Replit AI Integrations — no API key needed)
- Drug data: OpenFDA API (free, no key needed)
- Validation: Zod (zod/v4)
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validation schemas
- `lib/integrations-anthropic-ai/` — Anthropic SDK client (auto-configured via Replit AI Integrations)
- `artifacts/medisimple/src/` — React frontend
  - `src/pages/ScanPage.tsx` — upload/camera UI
  - `src/pages/ResultPage.tsx` — medicine card results
  - `src/contexts/prescription-context.tsx` — state shared between pages
- `artifacts/api-server/src/routes/prescriptions/` — POST /api/prescriptions/analyze
- `artifacts/api-server/src/lib/claude-prescription.ts` — Claude vision prompt & response parsing
- `artifacts/api-server/src/lib/fda-service.ts` — OpenFDA API integration

## Architecture decisions

- Stateless backend: no database — each request is independent, Claude analyzes the image fresh each time
- Base64 JSON over multipart: frontend converts image to base64 before sending, keeping the API simple and codegen-friendly
- Anthropic via Replit AI Integrations: `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` and `AI_INTEGRATIONS_ANTHROPIC_API_KEY` are auto-set; no user API keys needed
- OpenFDA is best-effort: Indian brand names often aren't in the FDA database, so failures are silently swallowed and return empty arrays
- Claude model: claude-sonnet-4-6 (best balance of vision quality and speed for this use case)

## Product

- ScanPage: drag-and-drop / camera capture for prescription image, language selector (English/Hindi/Tamil/Kannada/Telugu)
- ResultPage: one card per medicine (name, purpose, dosage, timing, duration, side effects), drug interaction warnings, generic alternatives with savings estimate, regional language summary section

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always re-run `pnpm --filter @workspace/api-spec run codegen` before editing backend or frontend code
- The Anthropic client throws at startup if `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` or `AI_INTEGRATIONS_ANTHROPIC_API_KEY` are missing — re-run `setupReplitAIIntegrations` if that happens
- Claude expects raw base64 (no `data:image/...;base64,` prefix) — the frontend strips it before sending
- OpenFDA rate limits are generous but the API has no key, so batch calls are done with `Promise.allSettled` to avoid cascading failures
