/**
 * Sidebar.jsx — Neumorphic Navigation Sidebar
 * ============================================
 * Left sidebar with navigation links, branding, and theme toggle.
 * Clean layout without authentication widgets.
 */

import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  UserPlus,
  Users,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
  { path: '/add-lead', label: 'Add Lead', icon: UserPlus },
  { path: '/leads', label: 'All Leads', icon: Users },
];

export default function Sidebar({ theme, toggleTheme }) {
  const location = useLocation();

  return (
    <aside style={styles.sidebar}>
      {/* ── Brand Logo ──────────────────────────────── */}
      <div style={styles.brand}>
        <div style={styles.logoIcon}>
          <Sparkles size={22} />
        </div>
        <div>
          <h1 style={styles.brandName}>LeadSense</h1>
          <p style={styles.brandTag}>AI Lead Intelligence</p>
        </div>
      </div>

      {/* ── Navigation Links ────────────────────────── */}
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              }}
            >
              <Icon size={19} color={isActive ? 'var(--accent-purple)' : 'var(--text-secondary)'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Theme Toggle Button ──────────────────────── */}
      <button
        className="theme-toggle-btn"
        onClick={toggleTheme}
        title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
      >
        <div style={styles.toggleKnob}>
          {theme === 'light' ? (
            <Sun size={16} color="var(--accent-amber)" />
          ) : (
            <Moon size={16} color="var(--accent-purple)" />
          )}
        </div>
        <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
      </button>

      {/* ── Footer ──────────────────────────────────── */}
      <div style={styles.footer}>
        <p style={styles.footerText}>LeadSense v1.0</p>
        {/* <p style={styles.footerSubtext}></p> */}
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    background: 'var(--bg-card)',
    boxShadow: 'var(--neu-shadow-flat)',
    display: 'flex',
    flexDirection: 'column',
    padding: 'var(--space-lg) var(--space-md)',
    zIndex: 100,
    borderRight: '1px solid var(--border-subtle)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-xs) var(--space-xs)',
    marginBottom: 'var(--space-xl)',
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent-gradient-primary)',
    boxShadow: 'var(--accent-gradient-glow)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0,
  },
  brandName: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  brandTag: {
    fontSize: '0.72rem',
    color: 'var(--text-tertiary)',
    fontWeight: 600,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 200ms ease',
    background: 'transparent',
  },
  navLinkActive: {
    background: 'var(--bg-card)',
    boxShadow: 'var(--neu-shadow-flat-sm)',
    color: 'var(--accent-purple)',
    fontWeight: 800,
  },
  toggleKnob: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'var(--bg-card)',
    boxShadow: 'var(--neu-shadow-flat-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingTop: 'var(--space-md)',
    borderTop: '1px solid var(--border-default)',
    marginTop: 'var(--space-md)',
  },
  footerText: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    fontWeight: 600,
  },
  footerSubtext: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    marginTop: 2,
  },
};
