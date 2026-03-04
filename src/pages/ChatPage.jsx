import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chat } from '../services/api';
import Sidebar from '../components/Sidebar';
import ChatInput from '../components/ChatInput';
import MessageBubble from '../components/MessageBubble';
import gsap from 'gsap';
import {
  MessageSquare,
  Menu,
  Sparkles,
  Github,
  Mail,
  Calendar,
  HardDrive,
  Image as ImageIcon,
  Linkedin,
} from 'lucide-react';

const SUGGESTIONS = [
  { icon: <Github size={14} />, label: 'List my repos', text: 'List my GitHub repositories' },
  { icon: <Mail size={14} />, label: 'Read emails', text: 'Show my recent unread emails' },
  { icon: <Calendar size={14} />, label: "Today's events", text: "What are my events for today?" },
  { icon: <Sparkles size={14} />, label: 'Draft a post', text: 'Draft a LinkedIn post about my latest project' },
];

export default function ChatPage() {
  const { id: conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingText, setThinkingText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const messagesEndRef = useRef(null);
  const heroRef = useRef(null);
  const heroInputRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      setHeroVisible(false);
      loadMessages(conversationId);
    } else {
      setHeroVisible(true);
      setMessages([]);
      hasAnimated.current = false;
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinkingText]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const { data } = await chat.listConversations();
      setConversations(data);
    } catch {}
  };

  const loadMessages = async (id) => {
    try {
      const { data } = await chat.getConversation(id);
      setMessages(data.messages || []);
    } catch {}
  };

  const handleSend = async (text) => {
    if (!text.trim() || isStreaming) return;

    let activeConvId = conversationId;

    if (heroVisible && heroRef.current && !hasAnimated.current) {
      hasAnimated.current = true;
      const heroContent = heroRef.current.querySelector('.hero-content');
      const chips = heroRef.current.querySelector('.suggestion-chips');
      const tl = gsap.timeline({
        onComplete: () => setHeroVisible(false),
      });
      if (heroContent) {
        tl.to(heroContent, { opacity: 0, y: -30, duration: 0.3, ease: 'power2.in' }, 0);
      }
      if (chips) {
        tl.to(chips, { opacity: 0, y: 20, duration: 0.25, ease: 'power2.in' }, 0);
      }
      tl.to(heroRef.current, { opacity: 0, duration: 0.2 }, 0.25);
    } else {
      setHeroVisible(false);
    }

    if (!activeConvId) {
      try {
        const { data } = await chat.createConversation(text.slice(0, 50));
        activeConvId = data.id;
        setConversations((prev) => [data, ...prev]);
        navigate(`/chat/${data.id}`, { replace: true });
      } catch {
        return;
      }
    }

    const userMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setThinkingText('Thinking...');

    let assistantContent = '';
    const toolCalls = [];

    try {
      await chat.sendMessage(activeConvId, text, ({ event, data }) => {
        switch (event) {
          case 'thinking':
            setThinkingText(typeof data === 'string' ? data : 'Thinking...');
            break;
          case 'tool_call':
            toolCalls.push({ ...data, status: 'executing' });
            setMessages((prev) => {
              const updated = [...prev];
              const existing = updated.find((m) => m.id === 'assistant-streaming');
              if (existing) {
                existing.tool_calls_list = [...toolCalls];
              }
              return [...updated];
            });
            break;
          case 'tool_result':
            const idx = toolCalls.findIndex((t) => t.tool === data.tool);
            if (idx >= 0) {
              toolCalls[idx] = { ...toolCalls[idx], status: 'done', result: data.result };
            }
            setMessages((prev) => {
              const updated = [...prev];
              const existing = updated.find((m) => m.id === 'assistant-streaming');
              if (existing) {
                existing.tool_calls_list = [...toolCalls];
              }
              return [...updated];
            });
            break;
          case 'response':
            setThinkingText('');
            if (typeof data === 'string') {
              assistantContent += data;
            } else if (data?.content) {
              assistantContent += data.content;
            }
            setMessages((prev) => {
              const updated = prev.filter((m) => m.id !== 'assistant-streaming');
              return [
                ...updated,
                {
                  id: 'assistant-streaming',
                  role: 'assistant',
                  content: assistantContent,
                  tool_calls_list: [...toolCalls],
                  created_at: new Date().toISOString(),
                },
              ];
            });
            break;
          default:
            if (typeof data === 'string' && data.length > 0) {
              assistantContent += data;
              setMessages((prev) => {
                const updated = prev.filter((m) => m.id !== 'assistant-streaming');
                return [
                  ...updated,
                  {
                    id: 'assistant-streaming',
                    role: 'assistant',
                    content: assistantContent,
                    tool_calls_list: [...toolCalls],
                    created_at: new Date().toISOString(),
                  },
                ];
              });
            }
        }
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'assistant-streaming'),
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${err.message || 'Failed to get response'}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
      setThinkingText('');
      loadConversations();
      if (activeConvId) loadMessages(activeConvId);
    }
  };

  const handleNewChat = () => {
    navigate('/chat');
    setMessages([]);
    setHeroVisible(true);
    hasAnimated.current = false;
  };

  const handleDeleteConversation = async (id) => {
    try {
      await chat.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) {
        navigate('/chat');
      }
    } catch {}
  };

  const handleSelectConversation = (id) => {
    navigate(`/chat/${id}`);
    setSidebarOpen(false);
  };

  const userInitial = (user?.display_name || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="chat-layout">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar
        conversations={conversations}
        activeId={conversationId}
        onSelect={handleSelectConversation}
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
          <MessageSquare size={16} style={{ color: 'var(--text-muted)' }} />
          <span className="chat-header-title">
            {conversationId
              ? conversations.find((c) => c.id === conversationId)?.title || 'Chat'
              : 'New Chat'}
          </span>
        </div>

        {heroVisible ? (
          <div className="chat-empty" ref={heroRef}>
            <div className="hero-glow hero-glow-1" />
            <div className="hero-glow hero-glow-2" />
            <div className="hero-glow hero-glow-3" />
            <div className="hero-content">
              <h1>How can I help today?</h1>
              <p>Ask me to work with your connected apps</p>
            </div>
            <div className="hero-input-wrapper" ref={heroInputRef}>
              <ChatInput onSend={handleSend} disabled={isStreaming} />
            </div>
            <div className="suggestion-chips">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => handleSend(s.text)}
                >
                  {s.icon}
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="messages-area">
              <div className="messages-container">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    userInitial={userInitial}
                  />
                ))}
                {thinkingText && (
                  <div className="thinking-indicator">
                    <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                    <span>{thinkingText}</span>
                    <div className="thinking-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div className="chat-input-docked">
              <ChatInput onSend={handleSend} disabled={isStreaming} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
