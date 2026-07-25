# NexFlow 2.0 - Frontend

NexFlow is an AI-powered agentic chatbot designed to seamlessly integrate with your favorite applications and provide a powerful, unified ChatGPT-like interface to orchestrate complex workflows.

This repository contains the **Frontend** application built with React, Vite, and GSAP. 

**Live demo:** _add the Vercel URL here_ · **Backend Repository:** [NexFlow-2.0-backend](https://github.com/MuditGarg007/NexFlow-2.0-backend)

## Features

- **Agentic Chat Interface:** A sleek, ChatGPT-like chat experience with markdown support, code highlighting, and beautifully rendered tool call cards.
- **Real-time SSE Streaming:** Experience fluid, real-time responses from the AI, complete with "thinking" states and immediate tool execution feedback.
- **Multi-App Orchestration:** Connect and interact with multiple OAuth applications from a single chat window.
- **Premium UI/UX:** A bespoke black and emerald green glassmorphic design system.
- **Fluid Animations:** Powered by GSAP and Framer Motion for buttery-smooth page transitions, hero-to-docked chat inputs, and micro-interactions.
- **Secure Authentication:** JWT-based authentication with automatic token refreshing and protected routes.

- **Landing Page:** A public marketing page at `/` whose hero replays a real agent turn — prompt, `thinking`, `tool_call`, `tool_result`, answer — using the same event names the backend streams.
- **One-click Demo:** With `VITE_DEMO_EMAIL` / `VITE_DEMO_PASSWORD` set, the landing page signs visitors straight into a shared read-only demo account.

## Supported Integrations

Each app is an independent OAuth connection that grants only the access it needs:

| Integration | Status |
|---|---|
| Gmail | stable |
| Google Calendar | stable |
| Google Drive | stable |
| GitHub | stable |
| Google Photos | coming soon |
| LinkedIn | coming soon |

## Tech Stack

- **Framework:** React 18 + Vite
- **Routing:** React Router DOM v6
- **Styling:** Vanilla CSS with custom CSS variables (Dark Glassmorphic Theme)
- **Animations:** GSAP (GreenSock) & Framer Motion
- **API Communication:** Axios
- **Markdown Parsing:** React Markdown & Remark GFM
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A running instance of the [NexFlow Backend](https://github.com/MuditGarg007/NexFlow-2.0-backend)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MuditGarg007/NexFlow-2.0-frontend.git
   cd frontend2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env.local
   ```

   | Variable | Required | Description |
   |---|---|---|
   | `VITE_API_URL` | ✅ | Backend origin **without** a trailing slash or `/api/v1` — the client appends that itself. Defaults to `http://localhost:8000`. |
   | `VITE_DEMO_EMAIL` | | Credentials for the shared read-only demo account. When both are set, the landing page shows a "Try the live demo" button that signs visitors in directly. When unset, it shows "Create an account" instead. |
   | `VITE_DEMO_PASSWORD` | | |

   `.env.production` holds the deployed backend URL and is committed; it contains no secrets. The demo variables are set in the Vercel dashboard.

   > These values are baked into the client bundle at build time, so the demo password is public by design. That is safe only because the demo account is flagged read-only server-side — see the backend README.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173` to view the application in action.

## Deployment (Vercel)

`vercel.json` already configures the Vite build, SPA rewrites, and asset
caching, so no build settings need to be entered by hand. The SPA rewrite is
what keeps a hard refresh on `/chat` or `/integrations` from 404ing.

```bash
npm i -g vercel
vercel login
vercel link          # or import the repo from the Vercel dashboard
vercel --prod
```

**Project settings** — if importing through the dashboard, set the root
directory to the repository root and leave the framework as Vite.

**Environment variables** (Settings → Environment Variables, Production):

| Variable | Value |
|---|---|
| `VITE_API_URL` | Backend origin, e.g. `https://nexflow-2-0-backend.onrender.com`. Already in `.env.production`; set it here too if you want to override per-environment. |
| `VITE_DEMO_EMAIL` | Demo account email |
| `VITE_DEMO_PASSWORD` | Demo account password |

Vite inlines `VITE_*` variables at build time, so **redeploy after adding
them** — changing them without a rebuild has no effect.

### Backend side

Two backend env vars must reference the deployed frontend origin, or the app
will load but every request will fail:

- `ALLOWED_ORIGINS` must contain the Vercel origin exactly — scheme included,
  no trailing slash — otherwise every API call fails CORS preflight.
- `FRONTEND_URL` must point at it, or completing an OAuth connection redirects
  the user to the wrong host.

### First load is slow

Render's free tier sleeps after inactivity, so the first request after an idle
period takes roughly 30 seconds. The demo button and the Integrations page both
surface a "waking up" message instead of failing silently, but it is worth
loading the demo link once yourself before sending it to anyone.

## Project Structure

```text
src/
├── components/      # Reusable UI components (Sidebar, ChatInput, MessageBubble)
├── context/         # React Context for global state (AuthContext)
├── pages/           # Landing, Login, Register, Chat, Integrations, OAuthCallback
├── services/        # API and external service integrations (Axios config, SSE handling)
├── styles/          # Page-scoped stylesheets (landing.css)
├── App.jsx          # Root component and Routing configuration
├── index.css        # Global styles and design system tokens
└── main.jsx         # Application entry point
```

`ChatPage` and `IntegrationsPage` are lazy-loaded, and the animation and markdown
libraries are split into their own chunks, so the landing page does not download
code it never uses.

## Design System

The application utilizes a custom CSS-variable based design system (`index.css`) optimized for a dark theme. The primary accent color is Emerald Green (`#10B981`) paired with deep blacks and subtle glassmorphic (`backdrop-filter`) paneling to create a premium, modern aesthetic.

## Authentication Flow

1. User registers or logs in via the Auth pages.
2. The backend returns Access and Refresh tokens.
3. Tokens are securely stored in `localStorage`.
4. Axios interceptors automatically attach the Access token to outgoing requests.
5. If the Access token expires, the interceptor automatically uses the Refresh token to request a new one without interrupting the user's session.

## License

[Add your license here, e.g., MIT]
