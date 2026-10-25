import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/Glass';

export default function LandingFinalCta() {
  return (
    <section className="landing-section page-width final-cta-section">
      <GlassCard className="final-cta-card">
        <div><p className="eyebrow">Your next follow-up starts here</p><h2>Give every enquiry a clear next step.</h2><p>Open your pipeline and see what needs attention today.</p></div>
        <Link className="glass-button glass-button-primary" to="/dashboard">Open dashboard <ArrowRight size={17} /></Link>
        <span className="cta-check"><Check size={17} /></span>
      </GlassCard>
    </section>
  );
}
