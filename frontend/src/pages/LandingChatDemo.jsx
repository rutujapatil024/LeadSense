import { Bot, Send } from 'lucide-react';
import { GlassCard, SectionHeading } from '../components/Glass';

export default function LandingChatDemo() {
  return (
    <section className="landing-section page-width demo-section">
      <div className="demo-copy"><SectionHeading eyebrow="Ask in plain language" title="A useful answer starts with a useful question." body="Ask about a city, source or status. LeadSense keeps the answer tied to the leads in your workspace." /></div>
      <GlassCard className="chat-demo-card">
        <div className="chat-demo-header"><span className="demo-avatar"><Bot size={18} /></span><span><strong>LeadSense AI</strong><small>Lead workspace</small></span><span className="demo-live"><i /> Ready</span></div>
        <div className="demo-user-message">Which high-priority leads from Pune need a follow-up?</div>
        <div className="demo-assistant-message"><p>3 high-priority leads in Pune have not been contacted.</p><ul><li>Aditi Kulkarni, referral</li><li>Rohan Shah, Instagram ad</li><li>Neha Joshi, website form</li></ul><small>Based on lead status and priority</small></div>
        <div className="chat-demo-input"><span>Ask about your leads</span><button type="button" aria-label="Demo send button"><Send size={15} /></button></div>
      </GlassCard>
    </section>
  );
}
