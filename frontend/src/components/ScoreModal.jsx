/**
 * ScoreModal.jsx — Lead Score Explanation Modal
 * ===============================================
 * Shows a neumorphic score gauge ring and AI-generated explanation
 * rendered cleanly without raw ** markdown tags.
 */

import { X } from 'lucide-react';
import { renderFormattedText } from '../utils/formatText';

function getScoreColor(score) {
  if (score >= 70) return 'var(--accent-green)';
  if (score >= 40) return 'var(--accent-amber)';
  return 'var(--accent-red)';
}

function getScoreLabel(score) {
  if (score >= 70) return 'Hot Lead 🔥';
  if (score >= 40) return 'Warm Lead ☀️';
  return 'Cold Lead ❄️';
}

export default function ScoreModal({ lead, scoreData, loading, onClose }) {
  const color = scoreData ? getScoreColor(scoreData.score) : 'var(--text-tertiary)';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📊 Lead Score: {lead?.name}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Analyzing lead score...</p>
          </div>
        ) : scoreData ? (
          <div>
            {/* Score Gauge */}
            <div className="score-gauge" style={{
              background: `conic-gradient(${color} ${scoreData.score * 3.6}deg, var(--bg-sunken) 0deg)`,
            }}>
              <div className="score-value" style={{ color }}>
                {scoreData.score}
              </div>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color }}>
                {getScoreLabel(scoreData.score)}
              </span>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 4, fontWeight: 600 }}>
                out of 100
              </span>
            </div>

            {/* Explanation rendered cleanly without raw ** tags */}
            <div style={{
              padding: 'var(--space-md)',
              background: 'var(--bg-card)',
              boxShadow: 'var(--neu-shadow-pressed-sm)',
              borderRadius: 'var(--radius-md)',
              lineHeight: 1.7,
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
            }}>
              {renderFormattedText(scoreData.explanation)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
