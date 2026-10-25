import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, UserPlus, Users, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LeadSenseMark from './LeadSenseMark';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
  { path: '/add-lead', label: 'Add Lead', icon: UserPlus },
  { path: '/leads', label: 'All Leads', icon: Users },
];

export default function Sidebar({ themeChoice, onThemeChange }) {
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = mobileDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileDrawerOpen]);

  return (
    <>
      <header className="mobile-topbar">
        <Link to="/" className="mobile-brand" onClick={() => setMobileDrawerOpen(false)}>
          <span className="brand-mark"><LeadSenseMark /></span><span className="mobile-brand-name">LeadSense</span>
        </Link>
        <button className="mobile-action-btn" onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)} aria-label={mobileDrawerOpen ? 'Close navigation menu' : 'Open navigation menu'}>
          {mobileDrawerOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </header>

      {mobileDrawerOpen && <button className="sidebar-backdrop" aria-label="Close navigation menu" onClick={() => setMobileDrawerOpen(false)} />}
      <aside className={`app-sidebar${mobileDrawerOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-brand-wrap">
          <Link to="/" className="sidebar-brand-lockup">
            <span className="brand-mark"><LeadSenseMark /></span>
            <span><strong>LeadSense</strong><small>Lead intelligence</small></span>
          </Link>
          <button className="mobile-action-btn mobile-drawer-close-btn" onClick={() => setMobileDrawerOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <p className="sidebar-section-label">Workspace</p>
        <nav className="sidebar-nav" aria-label="Workspace navigation">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return <Link key={path} to={path} className={`sidebar-nav-link${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => setMobileDrawerOpen(false)}><Icon size={18} /><span>{label}</span></Link>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <ThemeToggle value={themeChoice} onChange={onThemeChange} />
          <Link to="/" className="sidebar-footer-link">LeadSense <span>Project workspace</span></Link>
        </div>
      </aside>
      <nav className="mobile-bottom-nav" aria-label="Main navigation">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return <Link key={path} to={path} className={`mobile-bottom-tab${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => setMobileDrawerOpen(false)}><Icon size={19} /><span>{label === 'Dashboard' ? 'Home' : label}</span></Link>;
        })}
      </nav>
    </>
  );
}
