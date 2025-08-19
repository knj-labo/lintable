# lintable
One command · One extension · Every page is lintable

## Architecture

Monorepo structure using pnpm workspaces:

```
.
├── apps/
│   ├── overlay/     # Chrome Extension (MV3) with textlint
│   └── api/         # Hono on Cloudflare Workers
├── packages/
│   ├── rules/       # Textlint rules and operational levels (L0-L3)
│   └── shared/      # Shared types and utilities
```

## Tech Stack

- **Chrome Extension**: Manifest V3, WebWorker for textlint execution
- **API Gateway**: Hono + Cloudflare Workers with KV storage
- **Linting Engine**: textlint + Proofdict
- **Build Tools**: Vite, wrangler, pnpm workspaces
- **Code Quality**: Biome for linting/formatting

## Quick Start

```bash
# Install dependencies
pnpm install

# Development
pnpm dev:overlay  # Chrome extension
pnpm dev:api      # API server

# Build
pnpm build

# Lint & Format
pnpm lint
pnpm format
```

## Features

- **L0-L3 Operational Levels**: Configurable linting strictness
- **WebWorker Processing**: Non-blocking textlint execution
- **Cloud Storage**: Draft saving via Cloudflare KV
- **Real-time Overlay**: In-page lint results display
