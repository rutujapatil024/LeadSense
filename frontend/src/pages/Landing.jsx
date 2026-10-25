import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { GlassCard } from '../components/Glass';
import StatCard from '../components/StatCard';
import Reveal from '../components/Reveal';
import LazySection from '../components/LazySection';
import LeadSenseMark from '../components/LeadSenseMark';

const loadFeatures = () => import('./LandingFeatures.jsx');
const loadProcess = () => import('./LandingProcess.jsx');
const loadChatDemo = () => import('./LandingChatDemo.jsx');
const loadFinalCta = () => import('./LandingFinalCta.jsx');

function ProductPreview() {
  return (
    <div className="product-preview-wrap" aria-label="LeadSense dashboard preview">
      <GlassCard className="product-preview">
        <div className="preview-topline">
          <div>
            <span className="preview-overline">PIPELINE OVERVIEW</span>
            <h2>Pipeline snapshot</h2>
          </div>
          <span className="preview-period">Last 30 days</span>
        </div>
        <div className="preview-stats">
          <StatCard label="Active leads" value={248} detail="Across 5 statuses" animate={false} />
          <StatCard label="Follow-ups due" value={18} detail="6 need attention" animate={false} />
        </div>
        <div className="preview-chart-row">
          <div className="preview-chart-copy"><span>Buyer intent trend</span><strong>+28% this month</strong></div>
          <svg className="preview-line-chart" viewBox="0 0 320 142" role="img" aria-label="Buyer intent rises steadily over the last 30 days">
            <path className="preview-chart-gridline" d="M30 22H312 M30 62H312 M30 102H312 M30 122H312" />
            <path className="preview-chart-axis" d="M30 18V122H312" />
            <path className="preview-chart-reference" d="M30 106 C55 105 64 99 84 101 S119 96 140 96 S174 92 193 92 S226 84 246 83 S280 77 312 73" />
            <path className="preview-chart-growth" pathLength="1" strokeDasharray="1" strokeDashoffset="1" d="M30 108 C48 107 55 98 73 98 S96 91 113 94 S141 82 157 84 S183 72 201 73 S225 59 241 62 S267 45 281 48 S300 29 312 24" />
            <circle className="preview-chart-endpoint" cx="312" cy="24" r="4" />
            <text x="4" y="26">100</text><text x="10" y="66">50</text><text x="18" y="125">0</text>
          </svg>
          <div className="preview-chart-labels"><span>30 days ago</span><span>Today</span></div>
        </div>
        <div className="preview-lead-row">
          <div className="avatar-monogram">AM</div>
          <div className="preview-lead-info"><strong>Ananya Mehta</strong><span>Mumbai · Instagram ad</span></div>
          <span className="status-pill status-follow-up">Follow up</span>
          <span className="preview-score">82</span>
        </div>
      </GlassCard>
      <div className="preview-float-note"><span className="signal-dot" /> 3 new signals</div>
    </div>
  );
}

export default function Landing({ themeChoice, onThemeChange }) {
  const [activeSection, setActiveSection] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const sections = ['features', 'how-it-works', 'about']
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!('IntersectionObserver' in window) || sections.length === 0) return undefined;

    const observer = new IntersectionObserver((entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (current) setActiveSection(current.target.id);
    }, { rootMargin: '-88px 0px -62% 0px', threshold: 0 });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const linkClass = (section) => `landing-nav-link${activeSection === section ? ' is-active' : ''}`;

  return (
    <div className="landing-page">
      <header className="landing-nav-wrap">
        <nav className="landing-nav" aria-label="Main navigation">
          <a className="brand-lockup" href="#top" aria-label="LeadSense home"><span className="brand-mark"><LeadSenseMark /></span><span>LeadSense</span></a>
          <div className="landing-nav-links">
            <a className={linkClass('how-it-works')} aria-current={activeSection === 'how-it-works' ? 'location' : undefined} href="#how-it-works">How it works</a>
            <a className={linkClass('features')} aria-current={activeSection === 'features' ? 'location' : undefined} href="#features">Features</a>
            <a className={linkClass('about')} aria-current={activeSection === 'about' ? 'location' : undefined} href="#about">About</a>
          </div>
          <div className="landing-nav-actions">
            <ThemeToggle value={themeChoice} onChange={onThemeChange} compact />
            <Link className="glass-button glass-button-primary nav-open-dashboard" to="/dashboard">Open dashboard <ArrowUpRight size={16} /></Link>
            <button className="landing-menu-toggle" type="button" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>
              {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
          {mobileMenuOpen && <div className="landing-mobile-menu">
            <a className={linkClass('how-it-works')} href="#how-it-works" onClick={closeMobileMenu}>How it works</a>
            <a className={linkClass('features')} href="#features" onClick={closeMobileMenu}>Features</a>
            <a className={linkClass('about')} href="#about" onClick={closeMobileMenu}>About</a>
            <ThemeToggle value={themeChoice} onChange={onThemeChange} />
            <Link className="glass-button glass-button-primary" to="/dashboard" onClick={closeMobileMenu}>Open dashboard <ArrowUpRight size={16} /></Link>
          </div>}
        </nav>
      </header>

      <main id="top">
        <section className="landing-hero page-width">
          <div className="hero-copy">
            <Reveal>
              <p className="eyebrow"><span className="eyebrow-rule" /> Lead intelligence for growing teams</p>
              <h1>Turn new enquiries into <span>clear next steps.</span></h1>
              <p className="hero-description">LeadSense brings your pipeline, follow-ups and lead signals into one calm workspace.</p>
              <div className="hero-actions">
                <Link className="glass-button glass-button-primary" to="/dashboard">Open dashboard <ArrowRight size={17} /></Link>
                <a className="text-link" href="#how-it-works">See how it works <ArrowDown size={15} /></a>
              </div>
              <div className="hero-footnote"><span className="avatar-stack"><i>AM</i><i>RS</i><i>PK</i></span><span>Built for the people following up</span></div>
            </Reveal>
          </div>
          <ProductPreview />
        </section>

        <Reveal>
          <section className="proof-strip page-width" aria-label="Product overview">
            <div className="proof-label">A clearer view of every enquiry</div>
            <div className="proof-item"><strong>1</strong><span>shared pipeline</span></div>
            <div className="proof-item"><strong>5</strong><span>lead statuses</span></div>
            <div className="proof-item"><strong>4</strong><span>views into performance</span></div>
          </section>
        </Reveal>

        <div id="how-it-works"><LazySection load={loadProcess} minHeight={440} /></div>
        <div id="features"><LazySection load={loadFeatures} minHeight={720} /></div>
        <div><LazySection load={loadChatDemo} minHeight={440} /></div>
        <div><LazySection load={loadFinalCta} minHeight={320} /></div>
      </main>

      <footer className="landing-footer page-width" id="about">
        <a className="brand-lockup" href="#top"><span className="brand-mark"><LeadSenseMark /></span><span>LeadSense</span></a>
        <p>LeadSense, a Somaiya project.</p>
        <div className="footer-links">
          <a href="https://github.com/rutujapatil024/LeadSense" target="_blank" rel="noreferrer">Source code <ArrowUpRight size={13} /></a>
          <Link to="/dashboard">Open dashboard <ArrowRight size={13} /></Link>
        </div>
        <span className="footer-year">© {new Date().getFullYear()} LeadSense</span>
      </footer>
    </div>
  );
}
