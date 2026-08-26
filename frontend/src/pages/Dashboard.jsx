/**
 * Dashboard.jsx — Main Dashboard Page
 * =====================================
 * Shows: compact anomaly banner with toggle & 2-column grid export, stat cards,
 * 4 analytics charts, and an Excel-compatible Export Dashboard Report button.
 */

import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, TrendingUp, Download } from 'lucide-react';
import AnomalyBanner from '../components/AnomalyBanner';
import DashboardCharts from '../components/DashboardCharts';
import { getLeads } from '../api';
import { downloadCsvForExcel } from '../utils/exportToExcel';

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Compute stats
  const totalLeads = leads.length;
  const converted = leads.filter((l) => l.status === 'converted').length;
  const notContacted = leads.filter((l) => l.status === 'not_contacted').length;
  const highPriority = leads.filter((l) => l.priority === 'high').length;
  const conversionRate = totalLeads ? ((converted / totalLeads) * 100).toFixed(1) : 0;

  // Export Dashboard Report as Excel-compatible CSV
  function handleExportDashboardReport() {
    if (!leads.length) return;

    const headers = [
      'ID', 'Name', 'Contact', 'Location', 'Source', 'Status', 'Priority', 'Enquiry Date', 'Last Contacted', 'Notes'
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

    const filename = `LeadSense_Dashboard_Report_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCsvForExcel(filename, headers, rows);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Your lead intelligence at a glance</p>
        </div>

        {/* Export Dashboard Report Button */}
        <button
          className="btn btn-primary btn-sm"
          onClick={handleExportDashboardReport}
          disabled={loading || leads.length === 0}
          title="Export complete lead analytics report for Excel"
        >
          <Download size={16} /> Export Report
        </button>
      </div>

      {/* Anomaly Alerts */}
      <AnomalyBanner />

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Leads</div>
          <div className="stat-value">{loading ? '—' : totalLeads}</div>
          <div className="stat-icon"><Users size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Converted ({conversionRate}%)</div>
          <div className="stat-value">{loading ? '—' : converted}</div>
          <div className="stat-icon"><UserCheck size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Not Contacted</div>
          <div className="stat-value">{loading ? '—' : notContacted}</div>
          <div className="stat-icon"><UserX size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">High Priority</div>
          <div className="stat-value">{loading ? '—' : highPriority}</div>
          <div className="stat-icon"><TrendingUp size={24} /></div>
        </div>
      </div>

      {/* Charts */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard data...</p>
        </div>
      ) : (
        <DashboardCharts leads={leads} />
      )}
    </div>
  );
}
