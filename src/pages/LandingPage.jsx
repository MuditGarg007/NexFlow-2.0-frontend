import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Github,
  Mail,
  Calendar,
  HardDrive,
  Image as ImageIcon,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import '../styles/landing.css';

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD;
const SOURCE_URL = 'https://github.com/MuditGarg007/NexFlow-2.0-backend';

/* The hero replays one real turn through the agent loop. The event names are the
   same ones the backend streams over SSE: thinking, tool_call, tool_result, response. */
const TRACE = [
  { kind: 'prompt', text: 'Did I get anything from the recruiter at Zerodha this week?' },
  { kind: 'thinking', text: 'Planning to call 1 tool' },
  {
    kind: 'tool_call',
    tool: 'gmail.list_emails',
    args: '{ "query": "zerodha newer_than:7d", "max_results": 5 }',
  },
  { kind: 'tool_result', tool: 'gmail.list_emails', text: '2 messages · 412 ms' },
  {
    kind: 'response',
    text: 'Two, both Tuesday. Aarti Rao sent an interview slot for Thursday 3pm and a systems-design prep sheet. Neither is answered yet.',
  },
];

const INTEGRATIONS = [
  { name: 'Gmail', icon: Mail, color: '#EA4335', tools: 3, detail: 'Search, read, send' },
  { name: 'Google Calendar', icon: Calendar, color: '#4285F4', tools: 2, detail: 'List and create events' },
  { name: 'Google Drive', icon: HardDrive, color: '#0F9D58', tools: 2, detail: 'List and search files' },
  { name: 'GitHub', icon: Github, color: '#E6EDF3', tools: 4, detail: 'Repos, issues, pull requests' },
  { name: 'Google Photos', icon: ImageIcon, color: '#FBBC04', tools: 0, detail: 'Awaiting Picker API' },
];

const LOOP_STEPS = [
  {
    title: 'You ask in plain English',
    body: 'No command syntax, no picking a tool from a menu. The message goes to the supervisor agent as-is.',
  },
  {
    title: 'The supervisor picks the tools',
    body: 'Only tools from apps you have actually connected are put in front of the model, so it cannot reach for something it has no token for.',
  },
  {
    title: 'The tool runs against the real API',
    body: 'Your OAuth token is decrypted for that one call, the request goes out, and the result comes back into the transcript.',
  },
  {
    title: 'The agent reads the result and answers',
    body: 'If it needs more, it loops — up to five tool calls per turn — then writes the reply. You watch every step stream in.',
  },
];

const STACK = [
  ['FastAPI', 'async Python 3.12'],
  ['LangGraph', 'supervisor + tool executor'],
  ['PostgreSQL', 'SQLAlchemy 2 async, Alembic'],
  ['Redis', 'rate limits, token revocation'],
  ['Fernet', 'OAuth tokens encrypted at rest'],
  ['SSE', 'token-by-token streaming'],
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

const PROMPT = TRACE[0].text;

/* Replays TRACE one line at a time. Under reduced motion the whole trace is
   present from the first frame — progress is derived at render, so the effect
   only ever schedules timers. */
function AgentTrace() {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState({ typedLength: 0, shown: 0 });

  const typedLength = reduced ? PROMPT.length : progress.typedLength;
  const shown = reduced ? TRACE.length : progress.shown;
  const typed = PROMPT.slice(0, typedLength);
  const isTyping = typedLength < PROMPT.length;

  useEffect(() => {
    if (reduced) return;

    const timers = [];
    let i = 0;

    const typeNext = () => {
      i += 1;
      setProgress({ typedLength: i, shown: 0 });
      if (i < PROMPT.length) {
        timers.push(setTimeout(typeNext, 26));
        return;
      }
      TRACE.slice(1).forEach((_, idx) => {
        timers.push(
          setTimeout(
            () => setProgress({ typedLength: PROMPT.length, shown: idx + 2 }),
            620 * (idx + 1)
          )
        );
      });
    };

    timers.push(setTimeout(typeNext, 500));
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  return (
    <div className="trace" aria-label="Example agent transcript">
      <div className="trace-chrome">
        <span className="trace-dot" />
        <span className="trace-dot" />
        <span className="trace-dot" />
        <span className="trace-chrome-label">agent session</span>
      </div>

      <div className="trace-body">
        <div className="trace-line trace-prompt">
          <span className="trace-caret">›</span>
          <span>
            {typed}
            {isTyping && <span className="trace-cursor" />}
          </span>
        </div>

        {TRACE.slice(1).map((step, i) => (
          <div
            key={step.kind + i}
            className={`trace-line trace-${step.kind} ${shown > i + 1 ? 'is-in' : ''}`}
            aria-hidden={shown > i + 1 ? undefined : 'true'}
          >
            {step.kind === 'thinking' && (
              <>
                <span className="trace-tag tag-thinking">thinking</span>
                <span className="trace-text">{step.text}</span>
              </>
            )}
            {step.kind === 'tool_call' && (
              <>
                <span className="trace-tag tag-call">tool_call</span>
                <span className="trace-text">
                  <span className="trace-tool">{step.tool}</span>
                  <span className="trace-args">{step.args}</span>
                </span>
              </>
            )}
            {step.kind === 'tool_result' && (
              <>
                <span className="trace-tag tag-result">tool_result</span>
                <span className="trace-text">
                  <span className="trace-tool">{step.tool}</span>
                  <span className="trace-meta">{step.text}</span>
                </span>
              </>
            )}
            {step.kind === 'response' && (
              <p className="trace-answer">{step.text}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    document.body.classList.add('landing-open');
    return () => {
      mounted.current = false;
      document.body.classList.remove('landing-open');
    };
  }, []);

  const hasDemo = Boolean(DEMO_EMAIL && DEMO_PASSWORD);

  const startDemo = useCallback(async () => {
    setDemoError('');
    setDemoLoading(true);
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD);
      navigate('/chat');
    } catch {
      if (mounted.current) {
        setDemoError('The demo backend is waking up. Give it about 30 seconds and try again.');
        setDemoLoading(false);
      }
    }
  }, [login, navigate]);

  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden="true">
        <div className="landing-glow landing-glow-1" />
        <div className="landing-glow landing-glow-2" />
      </div>

      <header className="landing-nav">
        <span className="landing-logo">
          <svg viewBox="0 0 64 64" width="26" height="26" aria-hidden="true">
            <path
              d="M18 46V18l28 28V18"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          NexFlow
        </span>
        <nav className="landing-nav-links">
          <a href={SOURCE_URL} target="_blank" rel="noreferrer">Source</a>
          {isAuthenticated ? (
            <Link className="nav-cta" to="/chat">Open app</Link>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link className="nav-cta" to="/register">Get started</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Agentic workflow assistant</p>
            <h1>
              Your apps,<br />behind one chat box.
            </h1>
            <p className="hero-sub">
              NexFlow connects Gmail, Calendar, Drive and GitHub to a LangGraph
              supervisor agent. Ask for something in plain English and watch it
              choose the tool, call the real API, and answer.
            </p>

            <div className="hero-actions">
              {hasDemo ? (
                <button className="btn btn-primary" onClick={startDemo} disabled={demoLoading}>
                  {demoLoading ? (
                    <><Loader2 size={16} className="spin-icon" /> Signing in…</>
                  ) : (
                    <>Try the live demo <ArrowRight size={16} /></>
                  )}
                </button>
              ) : (
                <Link className="btn btn-primary" to="/register">
                  Create an account <ArrowRight size={16} />
                </Link>
              )}
              <a className="btn btn-ghost" href={SOURCE_URL} target="_blank" rel="noreferrer">
                <Github size={16} /> Read the code
              </a>
            </div>

            {hasDemo && (
              <p className="hero-note">
                Read-only demo account. Tools that would send mail or change your
                data are switched off.
              </p>
            )}
            {demoError && <p className="hero-error" role="alert">{demoError}</p>}
          </div>

          <div className="hero-demo">
            <AgentTrace />
          </div>
        </section>

        <section className="section" id="loop">
          <div className="section-head">
            <h2>What happens after you hit enter</h2>
            <p>
              Four stages, streamed to the browser as they run. Nothing is hidden
              behind a spinner.
            </p>
          </div>
          <ol className="loop">
            {LOOP_STEPS.map((step, i) => (
              <li className="loop-step" key={step.title}>
                <span className="loop-index">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" id="integrations">
          <div className="section-head">
            <h2>Connect each app on its own terms</h2>
            <p>
              Every service is a separate OAuth connection with only the scopes it
              needs. Connecting Calendar does not hand over your inbox.
            </p>
          </div>
          <div className="int-grid">
            {INTEGRATIONS.map((app) => (
              <div className={`int-card ${app.tools === 0 ? 'is-pending' : ''}`} key={app.name}>
                <span className="int-icon" style={{ color: app.color }}>
                  <app.icon size={20} />
                </span>
                <div className="int-meta">
                  <h3>{app.name}</h3>
                  <p>{app.detail}</p>
                </div>
                <span className="int-count">
                  {app.tools > 0 ? `${app.tools} tools` : 'Coming soon'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="stack">
          <div className="section-head">
            <h2>Under the hood</h2>
            <p>
              Tokens are encrypted at rest, refreshed automatically, and scoped per
              service. The whole thing ships from GitHub Actions to a container on Render.
            </p>
          </div>
          <dl className="stack">
            {STACK.map(([name, note]) => (
              <div className="stack-row" key={name}>
                <dt>{name}</dt>
                <dd>{note}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="cta">
          <h2>See it run</h2>
          <p>
            The demo is signed in to a real Google account with real mail and a real
            calendar. Ask it something.
          </p>
          <div className="hero-actions">
            {hasDemo ? (
              <button className="btn btn-primary" onClick={startDemo} disabled={demoLoading}>
                {demoLoading ? (
                  <><Loader2 size={16} className="spin-icon" /> Signing in…</>
                ) : (
                  <>Try the live demo <ArrowRight size={16} /></>
                )}
              </button>
            ) : (
              <Link className="btn btn-primary" to="/register">
                Create an account <ArrowRight size={16} />
              </Link>
            )}
            <Link className="btn btn-ghost" to="/login">Sign in</Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <span>NexFlow — built by Mudit Garg</span>
        <a href={SOURCE_URL} target="_blank" rel="noreferrer">GitHub</a>
      </footer>
    </div>
  );
}
