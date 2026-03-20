# Project Summary & Worklog

Updated: 2026-03-17

## 1) Project Overview

Workspace currently includes 4 main parts:

- `rasa_flask_api`: Flask API layer, proxy/orchestration between frontend/backend and Rasa.
- `kmarag`: LightRAG-based retrieval/generation project (Python, API + docs + web UI module).
- `rasa_fe`: React + TypeScript + Vite admin/chat frontend.
- `rasa_m_be`: Node.js/TypeScript backend services, controllers, models, routes.

In practice, the chatbot flow is:

1. User chats from `rasa_fe`.
2. Request goes through backend (`rasa_m_be`) / Flask bridge (`rasa_flask_api`) depending on endpoint.
3. Rasa/LLM returns response.
4. Frontend renders message stream + actions (copy/feedback/edit/retry depending on role and state).

## 2) Frontend Structure (`rasa_fe`)

Key areas:

- Routing: `src/routes/index.tsx`
- Chat UI page: `src/features/chat/pages/HomeChatPageDemo.tsx`
- Chat state + send flow: `src/hooks/useChat.ts`
- Chat interfaces: `src/interfaces/chat.interface.ts`
- Response admin page: `src/features/reponses/pages/ResponseManagement.tsx`
- Statistics pages: `src/features/statistics/pages/*`
- Sidebar navigation: `src/components/app-sidebar.tsx`

## 3) Summary of Completed Work (This Session History)

### A. Chat UX and Interaction

- Added typewriter-style rendering for bot responses in `useChat.ts`.
- Added robust copy fallback flow in chat page:
  - `navigator.clipboard`
  - fallback `document.execCommand("copy")`
  - final fallback `window.prompt(...)`
- Updated message model to support streaming state:
  - `isStreaming?: boolean` in `IChatMessage`
- Bot action row (copy/feedback icons) now appears only after text streaming finishes:
  - `isStreaming: true` while typing
  - `isStreaming: false` after finishing
  - UI condition: hide action row while streaming

### B. Feedback (Like/Dislike) and Response Mapping

- Investigated why like/dislike API was not called in deployment.
- Root cause identified: missing `responseId` metadata in returned bot message.
- Implemented enrichment logic in Flask and backend layers (historical changes in this session) to map response text -> response metadata when possible.

### C. Stability Fixes (404 / React #310)

- Fixed React Hooks-order crash (error #310) by ensuring hooks are not conditionally skipped.
- Repaired corrupted code sections in response/statistics area during debugging.
- Fixed sidebar links from relative to absolute URLs for admin pages to prevent bad nested routes.

### D. UI Cleanup Requested

- Removed Top Like/Dislike block from chatbot statistics page.
- Removed Like/Dislike summary column and related sort logic from response table page.

## 4) Current State (Verified)

- Chatbot message streaming state is active and used by UI.
- Action icons on bot messages are hidden during typing and shown after text finishes.
- Chatbot statistics page no longer displays top like/dislike charts block.
- Response management table no longer has like/dislike summary column.

## 5) Notes

- In current local git status for `rasa_fe`, only `.env` is shown as modified.
- Some earlier changes may already have been committed/pushed in previous steps.

## 6) Suggested Next Checks

1. Re-test chat UI in production build to confirm icon timing behavior feels correct.
2. Re-test route transitions: `/settings`, `/statistics/chatbots`, `/responses`.
3. If needed, add route-level error boundary for friendlier fallback instead of global 404 page.
