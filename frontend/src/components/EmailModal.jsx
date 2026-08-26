/**
 * EmailModal.jsx — Follow-Up Email Display Modal
 * ================================================
 * Shows the AI-generated follow-up email draft in a neumorphic modal,
 * cleaned of raw markdown asterisks.
 */

import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cleanText, renderFormattedText } from '../utils/formatText';

export default function EmailModal({ lead, email, loading, onClose }) {
  const [copied, setCopied] = useState(false);

  const cleanSubject = email ? cleanText(email.subject) : '';
  const cleanBody = email ? cleanText(email.body) : '';

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`Subject: ${cleanSubject}\n\n${cleanBody}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📧 Follow-Up Email for {lead?.name}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Generating personalized email...</p>
          </div>
        ) : email ? (
          <div>
            {/* Subject Line */}
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Subject
              </label>
              <div style={{
                padding: '12px 16px',
                background: 'var(--bg-card)',
                boxShadow: 'var(--neu-shadow-pressed-sm)',
                borderRadius: 'var(--radius-md)',
                marginTop: 6,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}>
                {cleanSubject}
              </div>
            </div>

            {/* Email Body */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Body
              </label>
              <div style={{
                padding: '16px',
                background: 'var(--bg-card)',
                boxShadow: 'var(--neu-shadow-pressed-sm)',
                borderRadius: 'var(--radius-md)',
                marginTop: 6,
                lineHeight: 1.7,
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
              }}>
                {renderFormattedText(cleanBody)}
              </div>
            </div>

            {/* Copy Button */}
            <button className="btn btn-primary" onClick={handleCopy} style={{ width: '100%' }}>
              {copied ? <><Check size={16} /> Copied to Clipboard!</> : <><Copy size={16} /> Copy Email Draft</>}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
