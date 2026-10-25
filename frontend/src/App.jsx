import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ParticleBackground from './components/ParticleBackground';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import AddLead from './pages/AddLead';
import Leads from './pages/Leads';

const initialChatMessages = [
  {
    role: 'assistant',
    content: "Hi! I'm LeadSense AI. Ask me anything about your leads. For example:\n\n• Which high-priority leads from Mumbai have not been contacted?\n• How many leads came from Instagram ads?\n• Show me all converted leads from referrals",
    sources: [],
  },
];

function resolveTheme(choice) {
  if (choice !== 'system') return choice;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const themeTransitionTimer = useRef(null);
  const [themeChoice, setThemeChoice] = useState(() => {
    const saved = localStorage.getItem('leadsense_theme');
    return ['system', 'light', 'dark'].includes(saved) ? saved : 'system';
  });
  const location = useLocation();
  const isLanding = location.pathname === '/';

  const changeTheme = (choice) => {
    document.documentElement.classList.add('theme-transitioning');
    window.clearTimeout(themeTransitionTimer.current);
    setThemeChoice(choice);
    themeTransitionTimer.current = window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      themeTransitionTimer.current = null;
    }, 420);
  };

  useEffect(() => () => {
    window.clearTimeout(themeTransitionTimer.current);
    document.documentElement.classList.remove('theme-transitioning');
  }, []);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const theme = resolveTheme(themeChoice);
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.themeChoice = themeChoice;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#121714' : '#f8faf8');
    };
    applyTheme();
    preference.addEventListener('change', applyTheme);
    localStorage.setItem('leadsense_theme', themeChoice);
    return () => preference.removeEventListener('change', applyTheme);
  }, [themeChoice]);

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
      // Ignore storage failures.
    }
  }, [chatMessages]);

  return (
    <div className={`app-layout${isLanding ? ' app-layout-landing' : ''}`}>
      <ParticleBackground mode={resolveTheme(themeChoice)} />
      {!isLanding && <Sidebar themeChoice={themeChoice} onThemeChange={changeTheme} />}
      <main className={isLanding ? 'landing-main' : 'main-content'}>
        <Routes>
          <Route path="/" element={<Landing themeChoice={themeChoice} onThemeChange={changeTheme} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<Chat messages={chatMessages} setMessages={setChatMessages} />} />
          <Route path="/add-lead" element={<AddLead />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
