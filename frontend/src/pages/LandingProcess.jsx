import { useEffect, useState } from 'react';
import { SectionHeading } from '../components/Glass';
import LeadSenseMark from '../components/LeadSenseMark';

const inboundPaths = [
  'M 205 43 C 296 43 314 135 405 135',
  'M 205 101 C 296 101 321 135 405 135',
  'M 205 159 C 296 159 321 135 405 135',
  'M 205 217 C 296 217 314 135 405 135',
];
const outboundPaths = [
  'M 600 135 C 667 135 665 62 735 62',
  'M 600 135 C 667 135 665 135 735 135',
  'M 600 135 C 667 135 665 208 735 208',
];

function SignalFlowDiagram() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setAnimate(!preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  return (
    <div className="lead-flow-panel">
      <svg className="lead-flow-diagram" viewBox="0 0 1000 270" role="img" aria-labelledby="flow-title flow-description">
        <title id="flow-title">LeadSense turns activity signals into follow-up actions</title>
        <desc id="flow-description">Website visits, referrals, hiring and product activity are scored, then routed to prioritized sales actions.</desc>
        <g className="flow-connections" fill="none">
          {inboundPaths.map((path) => <path key={path} d={path} />)}
          {outboundPaths.map((path) => <path key={path} d={path} />)}
        </g>
        <g className="flow-labels">
          <text x="26" y="47">Website activity</text>
          <text x="26" y="105">Referral activity</text>
          <text x="26" y="163">Hiring signals</text>
          <text x="26" y="221">Product activity</text>
          <circle className="flow-source-dot" cx="205" cy="43" r="3" />
          <circle className="flow-source-dot" cx="205" cy="101" r="3" />
          <circle className="flow-source-dot" cx="205" cy="159" r="3" />
          <circle className="flow-source-dot" cx="205" cy="217" r="3" />
        </g>
        <rect className="flow-engine" x="405" y="82" width="195" height="106" />
        <foreignObject x="405" y="82" width="195" height="106">
          <div xmlns="http://www.w3.org/1999/xhtml" className="flow-engine-content">
            <LeadSenseMark />
            <strong>LeadSense</strong>
            <span>Score intent, rank accounts</span>
          </div>
        </foreignObject>
        <g className="flow-results">
          <rect x="735" y="37" width="238" height="50" />
          <text x="752" y="57" className="flow-result-title">Ready to contact</text>
          <text x="752" y="75" className="flow-result-detail">High intent · book a meeting</text>
          <rect x="735" y="110" width="238" height="50" />
          <text x="752" y="130" className="flow-result-title">Follow-up due</text>
          <text x="752" y="148" className="flow-result-detail">Referral · send an introduction</text>
          <rect x="735" y="183" width="238" height="50" />
          <text x="752" y="203" className="flow-result-title">Account showing intent</text>
          <text x="752" y="221" className="flow-result-detail">Product activity · review lead</text>
        </g>
        {animate && <g className="flow-particles" aria-hidden="true">
          {inboundPaths.map((path, index) => <circle key={`in-${path}`} r="4" className="flow-particle">
            <animateMotion dur="3.8s" begin={`${index * 0.55}s`} repeatCount="indefinite" path={path} />
          </circle>)}
          {outboundPaths.map((path, index) => <circle key={`out-${path}`} r="4" className="flow-particle">
            <animateMotion dur="3.2s" begin={`${index * 0.7}s`} repeatCount="indefinite" path={path} />
          </circle>)}
        </g>}
      </svg>
      <div className="lead-flow-mobile" aria-label="Lead flow from signals to sales actions">
        <div><strong>Signals in</strong><span>Website activity · Referrals · Hiring · Product use</span></div>
        <div className="lead-flow-mobile-engine"><LeadSenseMark /><strong>LeadSense</strong><span>Scores intent and ranks accounts</span></div>
        <div><strong>Next actions</strong><span>Book a meeting · Send an introduction · Review the account</span></div>
      </div>
    </div>
  );
}

export default function LandingProcess() {
  return (
    <section className="landing-section page-width process-section">
      <SectionHeading eyebrow="From signal to action" title="Know which lead deserves attention." body="LeadSense connects activity across your pipeline, ranks intent, and points to a useful next step." />
      <SignalFlowDiagram />
    </section>
  );
}
