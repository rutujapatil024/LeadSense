import { ArrowUpRight, BarChart3, Download, MessageSquareText, ShieldAlert, Target } from 'lucide-react';
import { GlassCard, SectionHeading } from '../components/Glass';
import LeadSenseMark from '../components/LeadSenseMark';

function FeatureCard({ className = '', icon: Icon, eyebrow, title, children }) {
  return (
    <GlassCard className={`feature-card ${className}`}>
      <div className="feature-card-head"><span className="feature-icon"><Icon size={18} strokeWidth={1.7} /></span><span>{eyebrow}</span><ArrowUpRight size={15} /></div>
      <h3>{title}</h3>
      <div className="feature-snippet">{children}</div>
    </GlassCard>
  );
}

export default function LandingFeatures() {
  return (
    <section className="landing-section page-width">
      <SectionHeading eyebrow="One working view" title="Everything that moves a lead forward." body="Keep the daily work close to the signals that help your team decide what comes next." />
      <div className="feature-grid">
        <FeatureCard className="feature-chat" icon={MessageSquareText} eyebrow="Ask your pipeline" title="Answers from the leads you already have.">
          <div className="snippet-question">Which Pune leads need a follow-up?</div>
          <div className="snippet-answer"><span className="snippet-avatar"><LeadSenseMark /></span><span><strong>3 leads need a follow-up</strong><small>2 came from referrals this week</small></span></div>
          <div className="snippet-input">Ask about your leads <span>↗</span></div>
        </FeatureCard>
        <FeatureCard className="feature-score" icon={Target} eyebrow="Lead scoring" title="Know where to begin.">
          <div className="score-snippet"><strong>82</strong><span>/ 100</span><i>High priority</i></div>
          <div className="score-line"><span style={{ width: '82%' }} /></div>
          <p>Recent enquiry and a complete contact profile.</p>
        </FeatureCard>
        <FeatureCard className="feature-anomaly" icon={ShieldAlert} eyebrow="Anomaly detection" title="Catch changes early.">
          <div className="anomaly-snippet"><span className="anomaly-mark">!</span><span><strong>Referral volume is up</strong><small>18% above the weekly average</small></span></div>
          <div className="sparkline" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
        </FeatureCard>
        <FeatureCard className="feature-regions" icon={BarChart3} eyebrow="Regional insights" title="See where enquiries come from.">
          <div className="region-row"><span>Mumbai</span><i><b style={{ width: '86%' }} /></i><strong>42</strong></div>
          <div className="region-row"><span>Pune</span><i><b style={{ width: '63%' }} /></i><strong>31</strong></div>
          <div className="region-row"><span>Nashik</span><i><b style={{ width: '38%' }} /></i><strong>18</strong></div>
        </FeatureCard>
        <FeatureCard className="feature-export" icon={Download} eyebrow="Excel export" title="Take your pipeline with you.">
          <div className="export-snippet"><span className="export-file">XLS</span><span><strong>LeadSense report</strong><small>Leads, scores and enquiry dates</small></span><span className="export-check">✓</span></div>
          <p>Download a clean CSV for your next review.</p>
        </FeatureCard>
      </div>
    </section>
  );
}
