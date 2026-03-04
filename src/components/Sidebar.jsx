import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  MessageSquare,
  Trash2,
  LogOut,
  Blocks,
  X,
} from 'lucide-react';

export default function Sidebar({ conversations, activeId, onSelect, onNewChat, onDelete, isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isIntegrationsActive = location.pathname === '/integrations';
  const userInitial = (user?.display_name || user?.email || 'U')[0].toUpperCase();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <span className="sidebar-logo">NexFlow</span>
        <button className="new-chat-btn" onClick={onNewChat}>
          <Plus size={14} />
          New chat
        </button>
      </div>

      <div className="sidebar-nav">
        <button
          className={`sidebar-nav-btn ${!isIntegrationsActive ? 'active' : ''}`}
          onClick={() => { navigate('/chat'); onClose?.(); }}
        >
          <MessageSquare size={14} />
          Chats
        </button>
        <button
          className={`sidebar-nav-btn ${isIntegrationsActive ? 'active' : ''}`}
          onClick={() => { navigate('/integrations'); onClose?.(); }}
        >
          <Blocks size={14} />
          Apps
        </button>
      </div>

      <div className="conversation-list">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`conversation-item ${conv.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(conv.id)}
          >
            <MessageSquare size={14} />
            <span className="conv-title">{conv.title || 'Untitled'}</span>
            <button
              className="conv-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {conversations.length === 0 && (
          <div style={{ padding: '20px 12px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
            No conversations yet
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="user-avatar">{userInitial}</div>
        <div className="user-info">
          <div className="user-name">{user?.display_name || 'User'}</div>
          <div className="user-email">{user?.email}</div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
