# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A recipe management web app built with Next.js 16 (App Router) and backed by Notion as the database. The UI is entirely in Korean.

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

No test framework is configured.

## Environment Variables

Required in `.env.local`:
- `NOTION_API_KEY` — Notion API key
- `NOTION_RECIPES_DB_ID` — Notion recipes database ID
- `NOTION_INGREDIENTS_DB_ID` — Notion ingredients database ID
- `ADMIN_PASSWORD` — Password for admin operations (create/update/delete)

## Architecture

### Data Flow

All data lives in two Notion databases (Recipes and Ingredients). `src/lib/notion.ts` is the sole data access layer — it wraps `@notionhq/client` and transforms Notion property formats into app-level TypeScript types. API routes call into this module; components fetch from the API routes.

```
Components → fetch(/api/*) → API Routes → lib/notion.ts → Notion API
```

### API Routes (`src/app/api/`)

- `recipes/route.ts` — GET (list with filters) and POST (create, requires auth)
- `recipes/[id]/route.ts` — GET, PATCH, DELETE for individual recipes (mutations require auth)
- `ingredients/route.ts` — GET (list) and POST (create, requires auth)

Auth is a simple `Authorization: Bearer <ADMIN_PASSWORD>` header check on mutation endpoints.

### Key Modules

- **`src/lib/notion.ts`** — All Notion database queries and data transformation. Note: uses raw `fetch` for database queries instead of the SDK's `query` method due to an SDK issue.
- **`src/types/index.ts`** — All TypeScript interfaces (`Recipe`, `Ingredient`, `RecipeFormData`, `ApiResponse<T>`, Notion property mappings).
- **`src/components/`** — Client components (`'use client'`). No server components beyond the pages themselves.

### Notion Database Schema

**Recipes:** Name (title), Description (rich_text), ImageURL (url), Category (select), Tags (multi_select), Servings (number), PrepTime (number), CookTime (number), Instructions (rich_text), SourceURL (url), SourceType (select), Ingredients (relation), CreatedAt (created_time), UpdatedAt (last_edited_time).

**Ingredients:** Name (title), Category (select), Unit (select).

### State Management

No global state library. All state is local via React hooks (`useState`, `useEffect`, `useCallback`). Data is fetched on component mount.

### Styling

Tailwind CSS 4 via PostCSS. Path alias `@/*` maps to `./src/*`.

### Image Configuration

`next.config.ts` allows remote images from any HTTPS hostname for `next/image`.
