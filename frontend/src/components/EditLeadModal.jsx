/**
 * EditLeadModal.jsx — Neumorphic Edit Lead Modal
 * ===============================================
 * Allows updating all fields of a lead with CustomSelect and CustomDatePicker.
 */

import { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';

const statusOptions = [
  { value: 'not_contacted', label: 'Not Contacted' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'converted', label: 'Converted' },
  { value: 'dropped', label: 'Dropped' },
];

const priorityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function EditLeadModal({ lead, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: lead.name || '',
    contact: lead.contact || '',
    location: lead.location || '',
    source: lead.source || '',
    status: lead.status || 'not_contacted',
    priority: lead.priority || 'medium',
    enquiry_date: lead.enquiry_date ? lead.enquiry_date.split('T')[0] : '',
    last_contacted_date: lead.last_contacted_date ? lead.last_contacted_date.split('T')[0] : '',
    notes: lead.notes || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSelectChange(name, val) {
    setFormData((prev) => ({ ...prev, [name]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSave(lead.id, formData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <h2>✏️ Edit Lead Details</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: '0.85rem' }}>
            <AlertCircle size={16} style={{ verticalAlign: 'middle' }} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-name">Full Name</label>
              <input
                id="edit-name"
                name="name"
                type="text"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-contact">Contact Info</label>
              <input
                id="edit-contact"
                name="contact"
                type="text"
                className="form-input"
                value={formData.contact}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-location">Location</label>
              <input
                id="edit-location"
                name="location"
                type="text"
                className="form-input"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-source">Source</label>
              <input
                id="edit-source"
                name="source"
                type="text"
                className="form-input"
                value={formData.source}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-status">Status</label>
              <CustomSelect
                options={statusOptions}
                value={formData.status}
                onChange={(val) => handleSelectChange('status', val)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-priority">Priority</label>
              <CustomSelect
                options={priorityOptions}
                value={formData.priority}
                onChange={(val) => handleSelectChange('priority', val)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-enquiry">Enquiry Date</label>
              <CustomDatePicker
                id="edit-enquiry"
                value={formData.enquiry_date}
                onChange={(val) => handleSelectChange('enquiry_date', val)}
                placeholder="Select date"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-last-contact">Last Contacted</label>
              <CustomDatePicker
                id="edit-last-contact"
                value={formData.last_contacted_date}
                onChange={(val) => handleSelectChange('last_contacted_date', val)}
                placeholder="Select date"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-notes">Notes</label>
            <textarea
              id="edit-notes"
              name="notes"
              className="form-input"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? <><div className="spinner"></div> Saving...</> : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
