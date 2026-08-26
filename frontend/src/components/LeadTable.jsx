/**
 * LeadTable.jsx — Lead List Table with Neumorphic Custom Dropdowns
 * ===========================================================================
 * Displays all leads with:
 *   - Natural language search
 *   - Custom Neumorphic Status & Priority filter dropdowns
 *   - Custom Neumorphic inline Status & Priority cell update dropdowns
 *   - Edit Lead modal & Delete lead row actions
 */

import { useState } from 'react';
import { Mail, HelpCircle, Search, Filter, Pencil, Trash2 } from 'lucide-react';
import EditLeadModal from './EditLeadModal';
import CustomSelect from './CustomSelect';

const statusFilterOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'not_contacted', label: 'Not Contacted' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'converted', label: 'Converted' },
  { value: 'dropped', label: 'Dropped' },
];

const inlineStatusOptions = [
  { value: 'not_contacted', label: 'Not Contacted' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'converted', label: 'Converted' },
  { value: 'dropped', label: 'Dropped' },
];

const priorityFilterOptions = [
  { value: 'all', label: 'All Priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const inlinePriorityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function LeadTable({
  leads,
  onGenerateEmail,
  onScoreExplanation,
  onUpdateLead,
  onDeleteLead,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Edit Modal State
  const [editingLead, setEditingLead] = useState(null);

  // Filter leads based on Search + Status Filter + Priority Filter
  const filtered = leads.filter((lead) => {
    const term = search.toLowerCase();
    const matchesSearch =
      lead.name?.toLowerCase().includes(term) ||
      lead.location?.toLowerCase().includes(term) ||
      lead.source?.toLowerCase().includes(term) ||
      lead.contact?.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'all' ? true : lead.status === statusFilter;

    const matchesPriority =
      priorityFilter === 'all' ? true : lead.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Handle Quick Inline Status Change
  async function handleInlineStatusChange(lead, newStatus) {
    if (lead.status === newStatus) return;
    try {
      await onUpdateLead(lead.id, { status: newStatus });
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  }

  // Handle Quick Inline Priority Change
  async function handleInlinePriorityChange(lead, newPriority) {
    if (lead.priority === newPriority) return;
    try {
      await onUpdateLead(lead.id, { priority: newPriority });
    } catch (err) {
      alert(`Failed to update priority: ${err.message}`);
    }
  }

  // Handle Delete Confirmation
  async function handleDeleteClick(lead) {
    const confirmed = window.confirm(
      `Are you sure you want to delete lead "${lead.name}"? This action cannot be undone.`
    );
    if (confirmed) {
      try {
        await onDeleteLead(lead.id);
      } catch (err) {
        alert(`Failed to delete lead: ${err.message}`);
      }
    }
  }

  return (
    <div>
      {/* ── Search & Filter Controls Toolbar ──────────────── */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 'var(--space-md)',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {/* Search Input */}
        <div className="search-bar" style={{ flex: 1, minWidth: 260, marginBottom: 0 }}>
          <Search size={18} className="search-icon" />
          <input
            id="lead-search"
            type="text"
            placeholder="Search by name, location, source, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Custom Status Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={16} color="var(--accent-purple)" />
          <CustomSelect
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            style={{ width: 160 }}
          />
        </div>

        {/* Custom Priority Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CustomSelect
            options={priorityFilterOptions}
            value={priorityFilter}
            onChange={(val) => setPriorityFilter(val)}
            style={{ width: 150 }}
          />
        </div>
      </div>

      {/* ── Leads Table ────────────────────────────────────── */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name &amp; Contact</th>
              <th>Location</th>
              <th>Source</th>
              <th>Status (Update)</th>
              <th>Priority (Update)</th>
              <th>Enquiry Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                  {search || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'No leads match your filter criteria.'
                    : 'No leads found. Add some leads first!'}
                </td>
              </tr>
            ) : (
              filtered.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{lead.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{lead.contact}</div>
                  </td>
                  <td>{lead.location}</td>
                  <td>{lead.source}</td>
                  
                  {/* Inline Neumorphic Status Dropdown */}
                  <td>
                    <CustomSelect
                      variant="badge"
                      badgeClass={`badge-status-${lead.status}`}
                      options={inlineStatusOptions}
                      value={lead.status}
                      onChange={(newStatus) => handleInlineStatusChange(lead, newStatus)}
                    />
                  </td>

                  {/* Inline Neumorphic Priority Dropdown */}
                  <td>
                    <CustomSelect
                      variant="badge"
                      badgeClass={`badge-priority-${lead.priority}`}
                      options={inlinePriorityOptions}
                      value={lead.priority}
                      onChange={(newPriority) => handleInlinePriorityChange(lead, newPriority)}
                    />
                  </td>

                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {(() => {
                      if (!lead.enquiry_date) return '—';
                      const d = new Date(lead.enquiry_date);
                      return !isNaN(d.getTime()) ? d.toLocaleDateString('en-IN') : lead.enquiry_date;
                    })()}
                  </td>

                  {/* Actions Column */}
                  <td>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => onGenerateEmail(lead)}
                        title="Generate follow-up email"
                        style={{ padding: '6px 8px' }}
                      >
                        <Mail size={14} /> Email
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => onScoreExplanation(lead)}
                        title="Why this score?"
                        style={{ padding: '6px 8px' }}
                      >
                        <HelpCircle size={14} /> Score
                      </button>
                      
                      {/* Edit Lead Button */}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditingLead(lead)}
                        title="Edit lead details"
                        style={{ padding: '6px 8px' }}
                      >
                        <Pencil size={14} color="var(--accent-purple)" />
                      </button>

                      {/* Delete Lead Button */}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDeleteClick(lead)}
                        title="Delete lead"
                        style={{ padding: '6px 8px', color: 'var(--accent-red)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
        Showing {filtered.length} of {leads.length} leads
      </div>

      {/* Edit Lead Modal */}
      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          onSave={onUpdateLead}
          onClose={() => setEditingLead(null)}
        />
      )}
    </div>
  );
}
