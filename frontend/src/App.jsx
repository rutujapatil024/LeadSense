/**
 * App.jsx — Root Application Component
 * =====================================
 * Sets up the app layout: sidebar + main content area with routing.
 * Manages light/dark theme state and persistent AI chat messages across tabs.
 */

import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import AddLead from './pages/AddLead';
import Leads from './pages/Leads';

const initialChatMessages = [
  {
    role: 'assistant',
    content: "Hi! I'm LeadSense AI. Ask me anything about your leads — for example:\n\n• Which high-priority leads from Mumbai have not been contacted?\n• How many leads came from Instagram ads?\n• Show me all converted leads from referrals",
    sources: [],
  },
];

export default function App() {
  // ── Theme State ─────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('leadsense_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('leadsense_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // ── Persistent Chat Messages State ───────────────────────
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('leadsense_chat_history');
      return saved ? JSON.parse(saved) : initialChatMessages;
    } catch {
      return initialChatMessages;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('leadsense_chat_history', JSON.stringify(chatMessages));
    } catch {
      // Ignore
    }
  }, [chatMessages]);

  return (
    <div className="app-layout">
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/chat"
            element={
              <Chat
                messages={chatMessages}
                setMessages={setChatMessages}
              />
            }
          />
          <Route path="/add-lead" element={<AddLead />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
