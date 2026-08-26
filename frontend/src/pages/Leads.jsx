/**
 * Leads.jsx — Lead Management Page
 * ==================================
 * Shows all leads in a table with search, status/priority filtering,
 * inline status/priority updates, full row edit modal, and row deletion.
 */

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import LeadTable from '../components/LeadTable';
import EmailModal from '../components/EmailModal';
import ScoreModal from '../components/ScoreModal';
import { getLeads, generateEmail, getScoreExplanation, updateLead, deleteLead } from '../api';
import { downloadCsvForExcel } from '../utils/exportToExcel';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Email modal state
  const [emailModal, setEmailModal] = useState({ show: false, lead: null, email: null, loading: false });
  
  // Score modal state
  const [scoreModal, setScoreModal] = useState({ show: false, lead: null, scoreData: null, loading: false });

  useEffect(() => {
    async function fetchLeads() {
      try {
        const data = await getLeads();
        setLeads(data);
      } catch (err) {
        console.error('Failed to fetch leads:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  // ── Handle Lead Update (Inline & Full Edit Modal) ─────
  async function handleUpdateLead(leadId, updateFields) {
    const updated = await updateLead(leadId, updateFields);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, ...updated } : l))
    );
    return updated;
  }

  // ── Handle Lead Deletion ──────────────────────────────
  async function handleDeleteLead(leadId) {
    await deleteLead(leadId);
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
  }

  // Export all leads to Excel CSV
  function handleExportLeadsToExcel() {
    if (!leads || leads.length === 0) return;

    const headers = [
      'ID', 'Name', 'Contact', 'Location', 'Source', 'Status', 'Priority', 'Enquiry Date', 'Last Contacted Date', 'Notes'
    ];

    const rows = leads.map((l) => [
      l.id,
      l.name || '',
      l.contact || '',
      l.location || '',
      l.source || '',
      l.status || '',
      l.priority || '',
      l.enquiry_date ? l.enquiry_date.split('T')[0] : '',
      l.last_contacted_date ? l.last_contacted_date.split('T')[0] : '',
      l.notes || '',
    ]);

    const filename = `LeadSense_All_Leads_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCsvForExcel(filename, headers, rows);
  }

  // ── Handle Email Generation ──────────────────────
  async function handleGenerateEmail(lead) {
    setEmailModal({ show: true, lead, email: null, loading: true });
    try {
      const email = await generateEmail(lead.id);
      setEmailModal({ show: true, lead, email, loading: false });
    } catch (err) {
      setEmailModal({ show: true, lead, email: { subject: 'Error', body: err.message }, loading: false });
    }
  }

  // ── Handle Score Explanation ─────────────────────
  async function handleScoreExplanation(lead) {
    setScoreModal({ show: true, lead, scoreData: null, loading: true });
    try {
      const scoreData = await getScoreExplanation(lead.id);
      setScoreModal({ show: true, lead, scoreData, loading: false });
    } catch (err) {
      setScoreModal({
        show: true,
        lead,
        scoreData: { score: 0, explanation: `Error: ${err.message}` },
        loading: false,
      });
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>All Leads</h1>
          <p>View, search, filter, update, and manage your leads</p>
        </div>

        {/* Export to Excel Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleExportLeadsToExcel}
          disabled={loading || leads.length === 0}
          title="Export all leads to Excel CSV format"
        >
          <Download size={16} /> Export to Excel
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading leads...</p>
        </div>
      ) : (
        <LeadTable
          leads={leads}
          onGenerateEmail={handleGenerateEmail}
          onScoreExplanation={handleScoreExplanation}
          onUpdateLead={handleUpdateLead}
          onDeleteLead={handleDeleteLead}
        />
      )}

      {/* Email Modal */}
      {emailModal.show && (
        <EmailModal
          lead={emailModal.lead}
          email={emailModal.email}
          loading={emailModal.loading}
          onClose={() => setEmailModal({ show: false, lead: null, email: null, loading: false })}
        />
      )}

      {/* Score Modal */}
      {scoreModal.show && (
        <ScoreModal
          lead={scoreModal.lead}
          scoreData={scoreModal.scoreData}
          loading={scoreModal.loading}
          onClose={() => setScoreModal({ show: false, lead: null, scoreData: null, loading: false })}
        />
      )}
    </div>
  );
}
