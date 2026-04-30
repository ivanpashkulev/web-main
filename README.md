# web-main

The frontend for [ivanpashkulev.com](https://ivanpashkulev.com) — a React single-page application featuring an AI-powered chat interface that lets visitors have real-time conversations with an agent acting as Ivan Pashkulev.

## Overview

The application presents a portfolio header with Ivan's name, title, and bio, alongside a streaming chat component. The chat connects to the backend API via Server-Sent Events (SSE), rendering the AI response token by token as it arrives — providing a natural, real-time conversation experience.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 19](https://react.dev/) |
| Language | TypeScript |
| Build Tool | [Vite](https://vite.dev/) |
| Styling | SCSS with CSS custom properties |
| Package Manager | npm |
| Node Version | 22+ |

## Key Design Decisions

**SCSS over CSS-in-JS / Tailwind** — The project uses plain SCSS with CSS custom properties for theming. This keeps styling co-located with components, avoids runtime overhead, and produces clean, readable stylesheets that are easy to reason about.

**BEM naming convention** — CSS classes follow the Block Element Modifier methodology (`.chat__message--user`). This prevents style collisions without needing CSS modules and makes the relationship between elements explicit.

**Dark/light theme** — Theme is applied via a `data-theme` attribute on `<html>`, toggled by the `useTheme` hook and persisted in `localStorage`. All colours are CSS custom properties defined in `_variables.scss`.

**SSE streaming** — The chat component uses the native `fetch` API with a `ReadableStream` reader to consume SSE events. Responses are buffered and split on `\n\n` boundaries for robust parsing across partial reads.

**Path aliases** — `@/` maps to `src/` in both Vite and TypeScript configs, avoiding brittle relative import chains like `../../../types`.

**Shared types** — Domain types (`Theme`, `Message`) live in `src/types/` with barrel exports, keeping components decoupled from implementation details.

## Project Structure

```
src/
├── components/
│   ├── Chat/
│   │   ├── Chat.tsx           # SSE streaming chat UI
│   │   └── Chat.scss
│   ├── Home/
│   │   ├── Home.tsx           # Portfolio header + layout
│   │   └── Home.scss
│   └── common/
│       ├── ThemeToggle/
│       │   ├── ThemeToggle.tsx
│       │   └── ThemeToggle.scss
│       └── icons/
│           ├── SunIcon.tsx
│           ├── MoonIcon.tsx
│           └── index.ts       # Barrel export
├── hooks/
│   └── useTheme.ts            # Theme state + localStorage persistence
├── types/
│   ├── theme.ts               # Theme type
│   ├── chat.ts                # Message interface
│   └── index.ts               # Barrel export
├── styles/
│   ├── _variables.scss        # CSS custom properties, Google Fonts
│   ├── _reset.scss            # CSS reset
│   ├── _mixins.scss           # Reusable SCSS mixins
│   └── main.scss              # Entry point
└── App.tsx                    # Root component, theme state owner
```

## Local Development

### Prerequisites

- Node.js 22+
- Backend service running (see [api-main](https://github.com/ivanpashkulev/api-main))
- Ollama running with `deepseek-r1:8b`

### Setup

```bash
npm install
```

### Environment Variables

Create a `.env` file at the project root:

```env
VITE_API_URL=http://localhost:8000
```

### Run

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Chat Component

The `Chat` component manages conversation state and handles SSE streaming:

- **Message history** is maintained in local React state and sent with every request, enabling multi-turn conversations
- **Streaming** — as tokens arrive, the last assistant message is updated in place, creating a typewriter effect
- **Blinking cursor** — a CSS animation on the active streaming message indicates the response is in progress
- **Enter to send** — `Shift+Enter` inserts a newline; `Enter` submits the message
- **Input disabled** during streaming to prevent concurrent requests

## Docker

The image is built using a single-stage Node.js Alpine build. At container startup, `npm run build` compiles the app with the `VITE_API_URL` environment variable baked in, then `vite preview --host` serves the production build.

```bash
docker build -t web-main .
docker run -p 4173:4173 \
  -e VITE_API_URL=/api \
  web-main
```

## CI/CD

Pushing to `main` triggers a GitHub Actions workflow that runs on a **self-hosted ARM64 runner** (Apple M2 Max) for native build performance. The workflow:

1. Builds and pushes a Docker image to `ghcr.io/ivanpashkulev/web-main` tagged with the short commit SHA and `latest`
2. Opens an automated pull request on the [devops](https://github.com/ivanpashkulev/devops) repository updating the image tag in `docker-compose.yml`

The deployment is completed by merging that PR and running `docker compose pull && docker compose up -d` on the server.
