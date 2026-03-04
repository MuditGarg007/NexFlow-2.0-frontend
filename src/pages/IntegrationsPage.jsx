import { useState, useEffect } from 'react';
import { integrations as intApi } from '../services/api';
import Sidebar from '../components/Sidebar';
import { chat } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Github,
  Mail,
  Calendar,
  HardDrive,
  Image as ImageIcon,
  Linkedin,
  ExternalLink,
  Unplug,
  ChevronDown,
  ChevronRight,
  Wrench,
  Menu,
  Loader2,
  Check,
} from 'lucide-react';
import gsap from 'gsap';

const INTEGRATION_META = {
  github: { icon: <Github size={22} />, color: '#fff', bg: 'rgba(255,255,255,0.08)' },
  gmail: { icon: <Mail size={22} />, color: '#EA4335', bg: 'rgba(234,67,53,0.1)' },
  google_calendar: { icon: <Calendar size={22} />, color: '#4285F4', bg: 'rgba(66,133,244,0.1)' },
  google_drive: { icon: <HardDrive size={22} />, color: '#0F9D58', bg: 'rgba(15,157,88,0.1)' },
  google_photos: { icon: <ImageIcon size={22} />, color: '#FBBC04', bg: 'rgba(251,188,4,0.1)' },
  linkedin: { icon: <Linkedin size={22} />, color: '#0A66C2', bg: 'rgba(10,102,194,0.1)' },
};

export default function IntegrationsPage() {
  const [allIntegrations, setAllIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState(null);
  const [toolsVisible, setToolsVisible] = useState({});
  const [toolsData, setToolsData] = useState({});
  const [toolsLoading, setToolsLoading] = useState({});
  const [conversations, setConversations] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      gsap.fromTo('.integration-card', { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: 'power2.out',
      });
    }
  }, [loading]);

  const loadData = async () => {
    try {
      const [intRes, convRes] = await Promise.all([
        intApi.list(),
        chat.listConversations(),
      ]);
      setAllIntegrations(intRes.data);
      setConversations(convRes.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleConnect = async (id) => {
    setConnectingId(id);
    try {
      const { data } = await intApi.authorize(id);
      window.location.href = data.authorization_url;
    } catch {
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (id) => {
    try {
      await intApi.disconnect(id);
      setAllIntegrations((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_connected: false } : i))
      );
    } catch {}
  };

  const toggleTools = async (id) => {
    const isVisible = toolsVisible[id];
    setToolsVisible((prev) => ({ ...prev, [id]: !isVisible }));

    if (!isVisible && !toolsData[id]) {
      setToolsLoading((prev) => ({ ...prev, [id]: true }));
      try {
        const { data } = await intApi.tools(id);
        setToolsData((prev) => ({ ...prev, [id]: data }));
      } catch {
        setToolsData((prev) => ({ ...prev, [id]: [] }));
      } finally {
        setToolsLoading((prev) => ({ ...prev, [id]: false }));
      }
    }
  };

  const handleNewChat = () => navigate('/chat');
  const handleDeleteConversation = async (id) => {
    try {
      await chat.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  };

  return (
    <div className="chat-layout">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar
        conversations={conversations}
        onSelect={(id) => navigate(`/chat/${id}`)}
        onNewChat={handleNewChat}
        onDelete={handleDeleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="chat-main">
        <div className="chat-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="chat-header-title">Connected Apps</span>
        </div>
        <div className="integrations-page">
          <div className="integrations-header">
            <h1>Integrations</h1>
            <p>Connect your apps to let NexFlow work with them</p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="integrations-grid">
              {allIntegrations.map((integration) => {
                const meta = INTEGRATION_META[integration.id] || {
                  icon: <ExternalLink size={22} />,
                  color: '#8B5CF6',
                  bg: 'rgba(139,92,246,0.1)',
                };
                const tools = toolsData[integration.id] || [];
                const showTools = toolsVisible[integration.id];

                return (
                  <div className="integration-card glass-card" key={integration.id}>
                    <div className="integration-card-header">
                      <div
                        className="integration-icon"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        {meta.icon}
                      </div>
                      <div className="integration-info">
                        <h3>{integration.name}</h3>
                        {integration.category && (
                          <span className="category">{integration.category}</span>
                        )}
                      </div>
                    </div>

                    <div className="integration-status">
                      <span className={`status-dot ${integration.is_connected ? 'connected' : 'disconnected'}`} />
                      <span className={`status-text ${integration.is_connected ? 'connected' : 'disconnected'}`}>
                        {integration.is_connected ? 'Connected' : 'Not connected'}
                      </span>
                    </div>

                    <div className="integration-actions">
                      {integration.is_connected ? (
                        <>
                          <button
                            className="connect-btn disconnect"
                            onClick={() => handleDisconnect(integration.id)}
                          >
                            <Unplug size={13} style={{ marginRight: 4 }} />
                            Disconnect
                          </button>
                          <button
                            className="tools-toggle"
                            onClick={() => toggleTools(integration.id)}
                            title="View tools"
                          >
                            <Wrench size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          className="connect-btn connect"
                          onClick={() => handleConnect(integration.id)}
                          disabled={connectingId === integration.id}
                        >
                          {connectingId === integration.id ? (
                            <Loader2 size={13} className="spin-icon" style={{ marginRight: 4 }} />
                          ) : (
                            <ExternalLink size={13} style={{ marginRight: 4 }} />
                          )}
                          Connect
                        </button>
                      )}
                    </div>

                    {showTools && (
                      <div className="tools-list">
                        {toolsLoading[integration.id] ? (
                          <div style={{ padding: '8px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                            Loading tools...
                          </div>
                        ) : tools.length > 0 ? (
                          tools.map((tool, i) => (
                            <div className="tool-item" key={i}>
                              <div className="tool-name">{tool.name}</div>
                              <div className="tool-desc">{tool.description}</div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '8px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                            No tools available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
