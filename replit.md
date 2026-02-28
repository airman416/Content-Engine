# The Hopper - Content Repurposing Engine

## Overview
A high-performance content repurposing tool that ingests live social media posts (X, LinkedIn, Instagram) via Apify and LinkdAPI APIs, then uses Claude AI to rewrite them for different platforms (LinkedIn, Twitter/X, Instagram Carousel, Newsletter, Quote). Features an Asset Generation Engine for image export.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + Zustand (state) + Dexie.js (IndexedDB local storage)
- **Backend**: Express.js - proxy for Anthropic AI + social media API calls (Apify, LinkdAPI)
- **AI**: Anthropic Claude via Replit AI Integrations (env vars: AI_INTEGRATIONS_ANTHROPIC_API_KEY, AI_INTEGRATIONS_ANTHROPIC_BASE_URL)
- **Storage**: Client-side IndexedDB via Dexie.js (no PostgreSQL used)
- **APIs**: APIFY_API_KEY (X + Instagram scraping), LINKEDAPI_API_KEY (LinkedIn posts)

## Key Features
- Three-column dashboard (Source Feed, Workshop, Preview/Asset Engine)
- Live feed ingestion from X, LinkedIn, Instagram via backend proxy routes
- Keyboard-first navigation (J/K navigate, A approve, R reject, P punchier, H hater, S shaan, Cmd+Enter export)
- Flesch-Kincaid readability scoring + "Anti-AI" human score
- AI micro-tools: Make Punchier, Hater Simulator, Shaan Puri toggle
- Quote format tab for extracting standalone quotes
- Asset Generation Engine (Column 3): html-to-image export, color pickers, font selector, dimension toggles (1080x1080/1350/1920), text alignment
- Same-to-same mockup generator (X→X, LinkedIn→LinkedIn) with profile photo injection
- IG Carousel ZIP download (multiple slides)
- Copy Text with LinkedIn zero-width space formatting
- Trash Graveyard (rejected drafts saved for review)
- Hampton brand defaults: Cream #F5F5F0, Green #1B4332
- Tactile sound design (Web Audio API)

## File Structure
```
client/src/
  pages/dashboard.tsx        - Main three-column layout + keyboard shortcuts
  components/source-feed.tsx - Column 1: chronological post list with loading state
  components/workshop.tsx    - Column 2: editing workspace with 5 tabs (LinkedIn, Twitter/X, IG Carousel, Newsletter, Quote)
  components/preview.tsx     - Column 3: Asset Generation Engine with export controls
  components/trash.tsx       - Modal for rejected drafts (renamed from swipe-file)
  lib/db.ts                  - Dexie.js database + live feed ingestion + mock fallback
  lib/store.ts               - Zustand state (profilePhoto, asset settings, feed loading)
  lib/readability.ts         - Flesch-Kincaid + Anti-AI scoring
  lib/sounds.ts              - Web Audio API sound effects
server/
  routes.ts                  - AI proxy endpoints (/api/ai/*) + feed proxy (/api/feed/twitter, /api/feed/linkedin, /api/feed/instagram)
  storage.ts                 - Empty (no server storage needed)
shared/
  schema.ts                  - Zod schemas for data types
```

## Design System: "Utilitarian Luxury"
- Light mode only, monochrome foundation (DO NOT apply Hampton brand colors to main UI)
- Background: #FAFAFA, Borders: #E5E5E5, Text: #111827
- Accent: #FF4F00 (Safety Orange) - only for primary "Export"/"Download Image" actions
- Typography: Inter (sans), JetBrains Mono (mono)
- 1px solid borders, no glassmorphism, no rounded pills, 3px border-radius
- Hampton brand defaults for asset generator only: Cream #F5F5F0, Green #1B4332

## Database Schema (Dexie v2)
- sourcePosts: id, platform, content, author, authorHandle, profilePhoto, timestamp, url, metrics
- drafts: id, sourcePostId, platform (linkedin|twitter|instagram|newsletter|quote), content, status, createdAt, updatedAt
- trash: id, draftId, sourcePostId, content, platform, rejectedAt, originalContent
