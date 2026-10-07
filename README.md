# Office Digital Twin

A Next.js office digital-twin dashboard for monitoring equipment health, reviewing active alerts, exploring IFC building models, and running AI-assisted environmental simulations.

## What It Provides

- Interactive BIM visualization backed by That Open Components and IFC fragments.
- Four model disciplines: architecture, structural, HVAC, and electrical.
- GlobalId-based asset selection, camera fly-to, and critical-alert coloring.
- Office asset health and maintenance views for tracked equipment.
- Active alert acknowledgement with automatic removal of critical model highlighting.
- AI chat and simulation endpoints powered by the Vercel AI SDK and OpenAI.
- Environmental charts, RUL projections, maintenance schedules, and crowd-density views.

## Requirements

- Node.js 20 or newer.
- npm.
- An OpenAI API key for chat and simulation features.
- Browser support for WebGL for the BIM viewer.

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file when using the AI features:

```bash
OPENAI_API_KEY=your_api_key_here
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Serve a production build. |
| `npm run lint` | Run ESLint across the project. |
| `npm run convert:ifc` | Convert IFC source files into browser-ready fragment files. |

## BIM Data Pipeline

Source IFC files live in `models/ifc/`:

- `architecture.ifc`
- `structural.ifc`
- `hvac.ifc`
- `electrical.ifc`

Run `npm run convert:ifc` after changing an IFC source file. The converter writes fragment files to `public/models/fragments/`, which are loaded by the viewer through the model registry in `lib/bim/model-registry.ts`.

The converter preserves the IFC metadata required by the application, including GlobalIds, IFC classes, properties, storeys, spaces, spatial containment, and equipment relationships.

## Application Structure

```text
app/
  page.tsx                 Main dashboard and tab routing
  api/chat/route.ts        AI building assistant endpoint
  api/simulate/route.ts    AI environmental simulation endpoint
components/
  bim/bim-viewer.tsx      IFC fragment viewer and element selection
  chat-assistant.tsx      Chat UI
  crowd-density-heatmap.tsx
lib/bim/
  model-registry.ts        Loaded discipline configuration
  office-assets.ts         Tracked office assets and GlobalIds
  office-alerts.ts         Active office alert definitions
models/ifc/                IFC source models
public/models/fragments/   Generated browser-ready BIM fragments
scripts/convert-ifc.mjs   IFC conversion pipeline
```

## Asset and Alert Conventions

Tracked equipment is defined in `lib/bim/office-assets.ts`. Each asset should have a stable application ID, discipline, IFC class, local ID, and GlobalId. The GlobalId is the integration key used to find the element in the loaded fragment model.

Alerts are defined in `lib/bim/office-alerts.ts`. Unacknowledged critical alerts are converted to GlobalIds in `app/page.tsx` and passed to `BIMViewer`. The viewer resets explicit colors, then applies red coloring to the matching elements. Acknowledging an alert removes its GlobalId from the active critical list and restores the model's original appearance.

Selection and critical coloring are intentionally separate:

- Cyan highlight: the currently selected element.
- Red color: an active critical alert.
- Camera fly-to: triggered when a dashboard asset is selected.

## API Routes

### `POST /api/chat`

Accepts chat history and a user message. Requires `OPENAI_API_KEY` and returns an AI-generated building-operations response.

### `POST /api/simulate`

Accepts a simulation scenario and parameters such as outdoor temperature, occupancy, humidity, duration, and HVAC mode. Requires `OPENAI_API_KEY` and returns predicted environmental and equipment results.

Both routes return a `400` response for invalid request shapes and a `500` response when the API key is unavailable or the provider call fails.

## Development Notes

- Keep BIM model configuration in `lib/bim/model-registry.ts`; do not hard-code fragment URLs in UI components.
- Keep stable asset identity in `lib/bim/office-assets.ts`; display names may change, but GlobalIds must match the source fragments.
- Preserve the viewer's lifecycle ordering: initialize components and fragments before resolving GlobalIds or applying critical colors.
- Normalize BIM metadata defensively. IFC relation graphs can be deep or cyclic, so `normalizeValue()` is bounded and cycle-safe.
- Keep production `console.error` and meaningful `console.warn` diagnostics. Avoid interaction tracing and other development-only logging in committed UI code.
- Do not commit `.env.local`, API keys, generated debug output, or unrelated generated artifacts.

## Validation

Before submitting a change:

```bash
npm run lint
npm run build
```

Use the browser to verify the BIM workflow after model changes:

1. Confirm all four discipline models load.
2. Select a tracked asset from the dashboard.
3. Confirm the viewer flies to and highlights the selected element.
4. Confirm the active critical asset is red.
5. Acknowledge its alert and confirm the red color is cleared.
6. Check that clicking an element still updates the properties panel.

The current Next.js configuration allows builds to proceed with TypeScript errors (`next.config.mjs`). Treat existing diagnostics as technical debt and review new diagnostics separately rather than relying on a green production build alone.

## License and Third-Party Data

This repository does not define a project license. Confirm the licensing and redistribution terms for IFC models, generated fragment files, OpenAI usage, and third-party assets before publishing or deploying the application.
