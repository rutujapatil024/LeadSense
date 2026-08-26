/**
 * AddLeadForm.jsx — Single Lead Entry Form
 * ==========================================
 * Form with all lead fields using Neumorphic CustomSelect and CustomDatePicker.
 */

import { useState } from 'react';
import { UserPlus, Check, AlertCircle } from 'lucide-react';
import { addLead } from '../api';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';

const sourceOptions = [
  { value: 'Instagram ad', label: 'Instagram ad' },
  { value: 'Facebook ad', label: 'Facebook ad' },
  { value: 'Google search', label: 'Google search' },
  { value: 'walk-in', label: 'Walk-in' },
  { value: 'referral', label: 'Referral' },
  { value: 'trade show', label: 'Trade show' },
  { value: 'website form', label: 'Website form' },
];

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

const initialForm = {
  name: '',
  contact: '',
  location: '',
  source: 'Instagram ad',
  status: 'not_contacted',
  priority: 'medium',
  enquiry_date: new Date().toISOString().split('T')[0],
  last_contacted_date: '',
  notes: '',
};

export default function AddLeadForm() {
  const [form, setForm] = useState({ ...initialForm });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSelectChange(name, val) {
    setForm({ ...form, [name]: val });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      const data = { ...form };
      if (!data.last_contacted_date) delete data.last_contacted_date;
      if (!data.notes) delete data.notes;

      await addLead(data);
      setToast({ type: 'success', message: `Lead "${form.name}" added successfully!` });
      setForm({ ...initialForm });
    } catch (err) {
      setToast({ type: 'error', message: `Failed: ${err.message}` });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 5000);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 700 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="lead-name">Full Name *</label>
            <input
              id="lead-name"
              className="form-input"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Priya Sharma"
              required
            />
          </div>

          {/* Contact */}
          <div className="form-group">
            <label className="form-label" htmlFor="lead-contact">Contact *</label>
            <input
              id="lead-contact"
              className="form-input"
              name="contact"
              value={form.contact}
              onChange={handleChange}
              placeholder="Phone or email"
              required
            />
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label" htmlFor="lead-location">Location *</label>
            <input
              id="lead-location"
              className="form-input"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g., Mumbai"
              required
            />
          </div>

          {/* Source */}
          <div className="form-group">
            <label className="form-label" htmlFor="lead-source">Source *</label>
            <CustomSelect
              options={sourceOptions}
              value={form.source}
              onChange={(val) => handleSelectChange('source', val)}
            />
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label" htmlFor="lead-status">Status</label>
            <CustomSelect
              options={statusOptions}
              value={form.status}
              onChange={(val) => handleSelectChange('status', val)}
            />
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label" htmlFor="lead-priority">Priority</label>
            <CustomSelect
              options={priorityOptions}
              value={form.priority}
              onChange={(val) => handleSelectChange('priority', val)}
            />
          </div>

          {/* Custom Neumorphic Enquiry Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="lead-enquiry-date">Enquiry Date *</label>
            <CustomDatePicker
              id="lead-enquiry-date"
              value={form.enquiry_date}
              onChange={(val) => handleSelectChange('enquiry_date', val)}
              placeholder="Select enquiry date"
              required
            />
          </div>

          {/* Custom Neumorphic Last Contacted Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="lead-last-contacted">Last Contacted</label>
            <CustomDatePicker
              id="lead-last-contacted"
              value={form.last_contacted_date}
              onChange={(val) => handleSelectChange('last_contacted_date', val)}
              placeholder="Select last contacted date"
            />
          </div>
        </div>

        {/* Notes — full width */}
        <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
          <label className="form-label" htmlFor="lead-notes">Notes</label>
          <textarea
            id="lead-notes"
            className="form-textarea"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Any additional notes about the lead..."
            rows={3}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={loading}
          style={{ marginTop: 'var(--space-md)', width: '100%' }}
        >
          {loading ? (
            <><div className="spinner"></div> Adding Lead...</>
          ) : (
            <><UserPlus size={18} /> Add Lead</>
          )}
        </button>
      </form>

      {/* Toast notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {' '}{toast.message}
        </div>
      )}
    </div>
  );
}
