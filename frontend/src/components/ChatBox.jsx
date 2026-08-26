/**
 * ChatBox.jsx — Conversational AI Chat Interface
 * ================================================
 * Chat-style UI for querying lead data with natural language.
 * Preserves message history across tabs and formats text cleanly without ** tags.
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { askQuestion } from '../api';
import { renderFormattedText } from '../utils/formatText';

export default function ChatBox({ messages, setMessages }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    try {
      const response = await askQuestion(question);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.answer,
          sources: response.sources || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, something went wrong: ${err.message}. Please try again.`,
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-container">
      {/* ── Messages Area ─────────────────────────── */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              {msg.role === 'assistant' ? (
                <Bot size={14} style={{ opacity: 0.7 }} />
              ) : (
                <User size={14} style={{ opacity: 0.7 }} />
              )}
              <span style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 700 }}>
                {msg.role === 'assistant' ? 'LeadSense AI' : 'You'}
              </span>
            </div>
            
            {/* Render formatted text without raw ** markdown tags */}
            <div style={{ lineHeight: 1.6 }}>
              {renderFormattedText(msg.content)}
            </div>

            {msg.sources && msg.sources.length > 0 && (
              <div className="sources">
                📎 Sources: {msg.sources.join(', ')}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="chat-message assistant">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={14} style={{ opacity: 0.7 }} />
              <span style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 600 }}>Analyzing lead data...</span>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ────────────────────────────── */}
      <div className="chat-input-area">
        <input
          id="chat-input"
          type="text"
          placeholder="Ask about your leads (e.g. Which high-priority leads haven't been contacted?)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className="btn btn-primary"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{ borderRadius: 'var(--radius-full)', padding: '12px 20px' }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
