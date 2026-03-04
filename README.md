# NexFlow 2.0 - Frontend

NexFlow is an AI-powered agentic chatbot designed to seamlessly integrate with your favorite applications and provide a powerful, unified ChatGPT-like interface to orchestrate complex workflows.

This repository contains the **Frontend** application built with React, Vite, and GSAP. 

**Backend Repository:** [NexFlow-2.0-backend](https://github.com/MuditGarg007/NexFlow-2.0-backend)

## Features

- **Agentic Chat Interface:** A sleek, ChatGPT-like chat experience with markdown support, code highlighting, and beautifully rendered tool call cards.
- **Real-time SSE Streaming:** Experience fluid, real-time responses from the AI, complete with "thinking" states and immediate tool execution feedback.
- **Multi-App Orchestration:** Connect and interact with multiple OAuth applications from a single chat window.
- **Premium UI/UX:** A bespoke black and emerald green glassmorphic design system.
- **Fluid Animations:** Powered by GSAP and Framer Motion for buttery-smooth page transitions, hero-to-docked chat inputs, and micro-interactions.
- **Secure Authentication:** JWT-based authentication with automatic token refreshing and protected routes.

## Supported Integrations

NexFlow currently supports OAuth integration with the following platforms:
- GitHub
- Gmail
- Google Calendar
- Google Drive
- Google Photos
- LinkedIn

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
   Create a `.env` file in the root directory (or use `.env.local`) and configure your backend endpoint (`VITE_API_URL`) if it's different from the default proxy.
   *(Note: The `api.js` currently defaults to the production Render URL: `https://nexflow-2-0-backend.onrender.com/api/v1` or `http://localhost:8000/api/v1` for local development if configured.)*

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173` to view the application in action.

## Project Structure

```text
src/
├── components/      # Reusable UI components (Sidebar, ChatInput, MessageBubble)
├── context/         # React Context for global state (AuthContext)
├── pages/           # Main page views (Login, Register, Chat, Integrations, OAuthCallback)
├── services/        # API and external service integrations (Axios config, SSE handling)
├── App.jsx          # Root component and Routing configuration
├── index.css        # Global styles and design system tokens
└── main.jsx         # Application entry point
```

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
