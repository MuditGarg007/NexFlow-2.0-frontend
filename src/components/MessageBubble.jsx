import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import gsap from 'gsap';

export default function MessageBubble({ message, userInitial }) {
  const ref = useRef(null);
  const [expandedTools, setExpandedTools] = useState({});

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, []);

  const isUser = message.role === 'user';
  const toolCalls = message.tool_calls_list || [];

  const toggleTool = (idx) => {
    setExpandedTools((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className={`message ${message.role} visible`} ref={ref}>
      <div className="message-avatar">
        {isUser ? userInitial : <Bot size={16} />}
      </div>
      <div className="message-body">
        <div className="message-sender">{isUser ? 'You' : 'NexFlow'}</div>

        {toolCalls.length > 0 &&
          toolCalls.map((tc, i) => (
            <div className="tool-call-card" key={i}>
              <div className="tool-call-header" onClick={() => toggleTool(i)}>
                <Wrench size={13} className="tool-icon" />
                <span>{tc.tool}</span>
                <span className={`tool-status ${tc.status === 'done' ? 'done' : 'executing'}`}>
                  {tc.status === 'done' ? 'Completed' : 'Running...'}
                </span>
                {expandedTools[i] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </div>
              {expandedTools[i] && tc.result && (
                <div className="tool-call-body">
                  <pre>{typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}

        {message.content && (
          <div className="message-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
