/**
 * AnomalyBanner.jsx — Neumorphic Anomaly Insights Widget
 * =======================================================
 * Displays a compact alert header with a toggle button ("View Anomaly Insights")
 * to expand 2-column grid bullet points. Includes an Excel-compatible "Export Report" button.
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { getAnomalies } from '../api';
import { renderFormattedText, cleanText } from '../utils/formatText';
import { downloadCsvForExcel } from '../utils/exportToExcel';

export default function AnomalyBanner() {
  const [anomalies, setAnomalies] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnomalies() {
      try {
        const data = await getAnomalies();
        setAnomalies(data.anomalies || []);
      } catch (err) {
        console.error('Failed to fetch anomalies:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnomalies();
  }, []);

  // Export anomalies report as Excel-compatible CSV file
  function handleExportAnomalies() {
    if (!anomalies.length) return;

    const headers = ['Type', 'Severity', 'Title', 'Description'];
    const rows = anomalies.map((a) => [
      a.type,
      a.severity,
      cleanText(a.title),
      cleanText(a.description),
    ]);

    const filename = `LeadSense_Anomalies_Report_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCsvForExcel(filename, headers, rows);
  }

  if (loading || anomalies.length === 0) return null;

  return (
    <div className="anomaly-banner card">
      {/* ── Compact Bar Header ─────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            boxShadow: 'var(--neu-shadow-flat-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-amber)',
          }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.98rem' }}>
              {anomalies.length} Anomal{anomalies.length === 1 ? 'y' : 'ies'} Detected
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
              Conversion patterns &amp; volume alerts
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Export Report Button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExportAnomalies}
            title="Export Anomalies Report for Excel"
          >
            <Download size={15} /> Export Report
          </button>

          {/* Toggle Button */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setExpanded(!expanded)}
            style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {expanded ? (
              <><ChevronUp size={16} /> Hide Insights</>
            ) : (
              <><ChevronDown size={16} /> View Anomaly Insights</>
            )}
          </button>
        </div>
      </div>

      {/* ── Collapsible 2-Column Grid Section ──────── */}
      {expanded && (
        <div style={{
          marginTop: 'var(--space-md)',
          paddingTop: 'var(--space-md)',
          borderTop: '1px solid var(--border-default)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-md)',
        }}>
          {anomalies.map((anomaly, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 14px',
              background: 'var(--bg-card)',
              boxShadow: 'var(--neu-shadow-pressed-sm)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span style={{
                color: anomaly.severity === 'high' ? 'var(--accent-red)' : 'var(--accent-amber)',
                fontSize: '1.2rem',
                lineHeight: 1,
                marginTop: 2,
              }}>
                •
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                  {cleanText(anomaly.title)}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                  {renderFormattedText(cleanText(anomaly.description))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
