/**
 * AddLeadForm.jsx — Single Lead Entry Form with Comprehensive Validation
 * =====================================================================
 * Includes strict 10-digit numeric contact limit, real-time validation,
 * Neumorphic CustomSelect, CustomDatePicker, and accessible error states.
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

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

const initialForm = {
  name: '',
  contact: '',
  location: '',
  source: 'Instagram ad',
  status: 'not_contacted',
  priority: 'medium',
  enquiry_date: getTodayString(),
  last_contacted_date: '',
  notes: '',
};

export default function AddLeadForm() {
  const [form, setForm] = useState({ ...initialForm });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  /**
   * Validate a single field by name against business rules.
   */
  function validateField(name, value, currentForm = form) {
    const today = getTodayString();

    switch (name) {
      case 'name': {
        const trimmed = (value || '').trim();
        if (!trimmed) return 'Full Name is required.';
        if (trimmed.length < 2) return 'Full Name must be at least 2 characters.';
        if (!/^[A-Za-z\s.'-]+$/.test(trimmed)) {
          return 'Full Name should only contain letters and spaces.';
        }
        if (trimmed.length > 60) return 'Full Name cannot exceed 60 characters.';
        return '';
      }

      case 'contact': {
        const digits = (value || '').replace(/\D/g, '');
        if (!digits) return 'Contact number is required.';
        if (digits.length < 10) {
          return `Contact must be exactly 10 digits (${digits.length}/10 entered).`;
        }
        if (digits.length > 10) {
          return 'Contact cannot exceed 10 digits.';
        }
        if (/^(\d)\1{9}$/.test(digits)) {
          return 'Please enter a valid 10-digit mobile number.';
        }
        return '';
      }

      case 'location': {
        const trimmed = (value || '').trim();
        if (!trimmed) return 'Location is required.';
        if (trimmed.length < 2) return 'Location must be at least 2 characters (e.g. Mumbai).';
        if (!/^[A-Za-z\s,.'-]+$/.test(trimmed)) {
          return 'Location should only contain letters and city names.';
        }
        if (trimmed.length > 50) return 'Location cannot exceed 50 characters.';
        return '';
      }

      case 'enquiry_date': {
        if (!value) return 'Enquiry Date is required.';
        if (value > today) return 'Enquiry Date cannot be in the future.';
        return '';
      }

      case 'last_contacted_date': {
        if (!value) return '';
        if (value > today) return 'Last Contacted Date cannot be in the future.';
        if (currentForm.enquiry_date && value < currentForm.enquiry_date) {
          return 'Last Contacted Date cannot be earlier than Enquiry Date.';
        }
        return '';
      }

      case 'notes': {
        if (value && value.length > 500) {
          return 'Notes cannot exceed 500 characters.';
        }
        return '';
      }

      default:
        return '';
    }
  }

  /**
   * Handle text inputs, with strict 10-digit numeric filtering for contact.
   */
  function handleChange(e) {
    const { name, value } = e.target;
    let sanitizedValue = value;

    // Contact: Strictly allow ONLY digits, up to maximum 10 digits
    if (name === 'contact') {
      sanitizedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    const updatedForm = { ...form, [name]: sanitizedValue };
    setForm(updatedForm);

    // If the field has already been touched or had an error, re-validate live
    if (touched[name] || errors[name]) {
      const errorMsg = validateField(name, sanitizedValue, updatedForm);
      setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    }

    // Cross-validation: If enquiry_date changes, revalidate last_contacted_date
    if (name === 'enquiry_date' && form.last_contacted_date) {
      const contactErr = validateField('last_contacted_date', form.last_contacted_date, updatedForm);
      setErrors((prev) => ({ ...prev, last_contacted_date: contactErr }));
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errorMsg = validateField(name, value, form);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  }

  function handleSelectChange(name, val) {
    const updatedForm = { ...form, [name]: val };
    setForm(updatedForm);
    setTouched((prev) => ({ ...prev, [name]: true }));

    const errorMsg = validateField(name, val, updatedForm);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));

    // Cross-validation for dates
    if (name === 'enquiry_date' && updatedForm.last_contacted_date) {
      const contactErr = validateField('last_contacted_date', updatedForm.last_contacted_date, updatedForm);
      setErrors((prev) => ({ ...prev, last_contacted_date: contactErr }));
    }
  }

  /**
   * Validate all fields across the entire form.
   */
  function validateAll() {
    const newErrors = {};
    const allTouched = {};

    ['name', 'contact', 'location', 'enquiry_date', 'last_contacted_date', 'notes'].forEach((key) => {
      allTouched[key] = true;
      const err = validateField(key, form[key], form);
      if (err) newErrors[key] = err;
    });

    setTouched(allTouched);
    setErrors(newErrors);
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Run full validation check
    const validationErrors = validateAll();
    const errorKeys = Object.keys(validationErrors);

    if (errorKeys.length > 0) {
      setToast({
        type: 'error',
        message: validationErrors[errorKeys[0]] || 'Please fix the errors in the form before submitting.',
      });

      // Focus first erroneous input element
      const firstErrorElement = document.getElementById(`lead-${errorKeys[0]}`);
      if (firstErrorElement) {
        firstErrorElement.focus();
      }
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      const data = { ...form };
      if (!data.last_contacted_date) delete data.last_contacted_date;
      if (!data.notes) delete data.notes;

      await addLead(data);
      setToast({ type: 'success', message: `Lead "${form.name}" added successfully!` });
      setForm({ ...initialForm, enquiry_date: getTodayString() });
      setTouched({});
      setErrors({});
    } catch (err) {
      setToast({ type: 'error', message: `Failed to add lead: ${err.message}` });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 6000);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 720 }} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="lead-name">
              Full Name *
            </label>
            <input
              id="lead-name"
              className={`form-input ${touched.name && errors.name ? 'is-invalid' : ''}`}
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g., Priya Sharma"
              maxLength={60}
              required
            />
            {touched.name && errors.name && (
              <div className="form-error-msg">
                <AlertCircle size={14} />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          {/* Contact (Strict 10 Digits Max) */}
          <div className="form-group">
            <label className="form-label" htmlFor="lead-contact">
              Contact (10-Digit Mobile) *
            </label>
            <input
              id="lead-contact"
              className={`form-input ${touched.contact && errors.contact ? 'is-invalid' : ''}`}
              name="contact"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.contact}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g., 9876543210"
              required
            />
            <div className="form-hint">
              <span>{touched.contact && errors.contact ? '' : 'Numbers only, max 10 digits'}</span>
              <span style={{ fontWeight: 600, color: form.contact.length === 10 ? 'var(--accent-green)' : 'inherit' }}>
                {form.contact.length}/10 digits
              </span>
            </div>
            {touched.contact && errors.contact && (
              <div className="form-error-msg">
                <AlertCircle size={14} />
                <span>{errors.contact}</span>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label" htmlFor="lead-location">
              Location *
            </label>
            <input
              id="lead-location"
              className={`form-input ${touched.location && errors.location ? 'is-invalid' : ''}`}
              name="location"
              value={form.location}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g., Mumbai"
              maxLength={50}
              required
            />
            {touched.location && errors.location && (
              <div className="form-error-msg">
                <AlertCircle size={14} />
                <span>{errors.location}</span>
              </div>
            )}
          </div>

          {/* Source */}
          <div className="form-group">
            <label className="form-label" htmlFor="lead-source">
              Source *
            </label>
            <CustomSelect
              options={sourceOptions}
              value={form.source}
              onChange={(val) => handleSelectChange('source', val)}
            />
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label" htmlFor="lead-status">
              Status
            </label>
            <CustomSelect
              options={statusOptions}
              value={form.status}
              onChange={(val) => handleSelectChange('status', val)}
            />
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label" htmlFor="lead-priority">
              Priority
            </label>
            <CustomSelect
              options={priorityOptions}
              value={form.priority}
              onChange={(val) => handleSelectChange('priority', val)}
            />
          </div>

          {/* Custom Neumorphic Enquiry Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="lead-enquiry_date">
              Enquiry Date *
            </label>
            <CustomDatePicker
              id="lead-enquiry_date"
              value={form.enquiry_date}
              isInvalid={Boolean(touched.enquiry_date && errors.enquiry_date)}
              onChange={(val) => handleSelectChange('enquiry_date', val)}
              placeholder="Select enquiry date"
              required
            />
            {touched.enquiry_date && errors.enquiry_date && (
              <div className="form-error-msg">
                <AlertCircle size={14} />
                <span>{errors.enquiry_date}</span>
              </div>
            )}
          </div>

          {/* Custom Neumorphic Last Contacted Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="lead-last_contacted_date">
              Last Contacted
            </label>
            <CustomDatePicker
              id="lead-last_contacted_date"
              value={form.last_contacted_date}
              isInvalid={Boolean(touched.last_contacted_date && errors.last_contacted_date)}
              onChange={(val) => handleSelectChange('last_contacted_date', val)}
              placeholder="Select last contacted date"
            />
            {touched.last_contacted_date && errors.last_contacted_date && (
              <div className="form-error-msg">
                <AlertCircle size={14} />
                <span>{errors.last_contacted_date}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes — full width */}
        <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" htmlFor="lead-notes" style={{ marginBottom: 4 }}>
              Notes
            </label>
            <span style={{ fontSize: '0.75rem', color: form.notes.length > 450 ? 'var(--accent-red)' : 'var(--text-tertiary)' }}>
              {form.notes.length}/500
            </span>
          </div>
          <textarea
            id="lead-notes"
            className={`form-textarea ${touched.notes && errors.notes ? 'is-invalid' : ''}`}
            name="notes"
            value={form.notes}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Any additional notes about the lead..."
            maxLength={500}
            rows={3}
          />
          {touched.notes && errors.notes && (
            <div className="form-error-msg">
              <AlertCircle size={14} />
              <span>{errors.notes}</span>
            </div>
          )}
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
