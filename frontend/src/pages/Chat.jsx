/**
 * Chat.jsx — AI Chat Page
 * ========================
 * Full-page chat interface for querying lead data conversationally.
 * Features Excel-compatible "Export Chat" functionality.
 */

import { Download } from 'lucide-react';
import ChatBox from '../components/ChatBox';
import { cleanText } from '../utils/formatText';
import { downloadCsvForExcel } from '../utils/exportToExcel';

export default function Chat({ messages, setMessages }) {
  function handleExportChat() {
    if (!messages || messages.length === 0) return;

    const headers = ['Timestamp', 'Sender', 'Message', 'Sources'];
    const now = new Date().toLocaleString('en-IN');
    
    const rows = messages.map((m) => [
      now,
      m.role === 'assistant' ? 'LeadSense AI' : 'User',
      cleanText(m.content),
      m.sources && m.sources.length ? m.sources.join('; ') : 'N/A',
    ]);

    const filename = `LeadSense_Chat_Transcript_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCsvForExcel(filename, headers, rows);
  }

  const MAX_TOKENS = 8192;
  const totalTokensUsed = (messages || []).reduce((acc, m) => acc + (m.tokensUsed || 0), 0);
  const tokensPercentage = Math.min(((totalTokensUsed / MAX_TOKENS) * 100), 100).toFixed(1);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Chat</h1>
          <p>Ask questions about your leads using natural language</p>
        </div>

        {/* Export Chat History Button and Token Usage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {totalTokensUsed > 0 && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {tokensPercentage}% of tokens used
            </span>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExportChat}
            disabled={!messages || messages.length <= 1}
            title="Export conversation transcript for Excel"
          >
            <Download size={16} /> Export Chat
          </button>
        </div>
      </div>

      <ChatBox messages={messages} setMessages={setMessages} />
    </div>
  );
}
