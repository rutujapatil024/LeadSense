/**
 * Sidebar.jsx — Responsive Navigation System
 * ============================================
 * Provides:
 *  1. Desktop Neumorphic Sidebar (fixed left for screens > 860px)
 *  2. Mobile Top Bar with Logo, Theme toggle & Hamburger menu
 *  3. Mobile Slide-out Drawer with backdrop blur
 *  4. Mobile Bottom Tab Bar for effortless one-handed thumb navigation
 */

import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  UserPlus,
  Users,
  Sparkles,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
  { path: '/add-lead', label: 'Add Lead', icon: UserPlus },
  { path: '/leads', label: 'All Leads', icon: Users },
];

export default function Sidebar({ theme, toggleTheme }) {
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Auto-close mobile drawer on route transition
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

  return (
    <>
      {/* ── Mobile Top Header (<= 860px) ────────────────── */}
      <header className="mobile-topbar">
        <Link to="/" className="mobile-brand" onClick={() => setMobileDrawerOpen(false)}>
          <div className="mobile-logo-icon">
            <Sparkles size={18} />
          </div>
          <span className="mobile-brand-name">LeadSense</span>
        </Link>

        <div className="mobile-topbar-actions">
          {/* Quick theme toggle */}
          <button
            className="mobile-action-btn"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <Sun size={17} color="var(--accent-amber)" />
            ) : (
              <Moon size={17} color="var(--accent-purple)" />
            )}
          </button>

          {/* Hamburger Drawer Toggle */}
          <button
            className="mobile-action-btn"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileDrawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer Backdrop ────────────────────── */}
      {mobileDrawerOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar (Desktop Fixed / Mobile Slide-out Drawer) ── */}
      <aside className={`app-sidebar ${mobileDrawerOpen ? 'mobile-open' : ''}`}>
        {/* Mobile Drawer Close Header */}
        <div className="mobile-drawer-header">
          <div className="sidebar-brand-inner">
            <div className="sidebar-logo-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="sidebar-brand-name">LeadSense</div>
              <div className="sidebar-brand-tag">AI Lead Intelligence</div>
            </div>
          </div>
          <button
            className="modal-close mobile-drawer-close-btn"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Desktop Brand Header */}
        <div className="sidebar-desktop-brand">
          <div className="sidebar-logo-icon">
            <Sparkles size={22} />
          </div>
          <div>
            <h1 className="sidebar-brand-name">LeadSense</h1>
            <p className="sidebar-brand-tag">AI Lead Intelligence</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileDrawerOpen(false)}
              >
                <Icon
                  size={19}
                  color={isActive ? 'var(--accent-purple)' : 'var(--text-secondary)'}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle Button */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          <div className="toggle-knob">
            {theme === 'light' ? (
              <Sun size={16} color="var(--accent-amber)" />
            ) : (
              <Moon size={16} color="var(--accent-purple)" />
            )}
          </div>
          <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Footer */}
        <div className="sidebar-footer">
          <p className="sidebar-footer-text">LeadSense v1.0</p>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation Bar (<= 860px) ───── */}
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-bottom-tab ${isActive ? 'active' : ''}`}
            >
              <div className="mobile-tab-icon-wrap">
                <Icon size={20} />
              </div>
              <span className="mobile-tab-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
