/**
 * AddLead.jsx — Add Lead Page
 * =============================
 * Two tabs: single lead form and CSV bulk upload.
 */

import { useState } from 'react';
import AddLeadForm from '../components/AddLeadForm';
import CsvUpload from '../components/CsvUpload';

export default function AddLead() {
  const [activeTab, setActiveTab] = useState('single');

  return (
    <div>
      <div className="page-header">
        <h1>Add Lead</h1>
        <p>Add new leads individually or upload a CSV file</p>
      </div>

      {/* Tab Switcher */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'single' ? 'active' : ''}`}
          onClick={() => setActiveTab('single')}
        >
          Single Entry
        </button>
        <button
          className={`tab ${activeTab === 'csv' ? 'active' : ''}`}
          onClick={() => setActiveTab('csv')}
        >
          CSV Upload
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'single' ? <AddLeadForm /> : <CsvUpload />}
    </div>
  );
}
