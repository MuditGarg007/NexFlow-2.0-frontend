import { useState, useRef, useEffect, useCallback } from 'react';
import { SendIcon, Loader2 } from 'lucide-react';

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '50px';
    const newH = Math.min(el.scrollHeight, 200);
    el.style.height = `${Math.max(50, newH)}px`;
  }, []);

  const resetHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) el.style.height = '50px';
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
    resetHeight();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="chat-input-box">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          adjustHeight();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Send a message..."
        disabled={disabled}
        rows={1}
      />
      <div className="chat-input-actions">
        <button
          className={`send-btn ${canSend ? 'active' : 'inactive'}`}
          onClick={handleSend}
          disabled={!canSend}
        >
          {disabled ? <Loader2 size={16} className="spin-icon" /> : <SendIcon size={16} />}
          Send
        </button>
      </div>
    </div>
  );
}
