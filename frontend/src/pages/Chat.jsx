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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Chat</h1>
          <p>Ask questions about your leads using natural language</p>
        </div>

        {/* Export Chat History Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleExportChat}
          disabled={!messages || messages.length <= 1}
          title="Export conversation transcript for Excel"
        >
          <Download size={16} /> Export Chat
        </button>
      </div>

      <ChatBox messages={messages} setMessages={setMessages} />
    </div>
  );
}
