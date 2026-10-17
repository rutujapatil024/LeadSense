/**
 * Dashboard.jsx — Main Dashboard Page
 * =====================================
 * Shows: compact anomaly banner with toggle & 2-column grid export, stat cards,
 * 4 analytics charts, and an Excel-compatible Export Dashboard Report button.
 */

import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, TrendingUp, Download, Loader2 } from 'lucide-react';
import AnomalyBanner from '../components/AnomalyBanner';
import DashboardCharts from '../components/DashboardCharts';
import { getLeads } from '../api';
import { downloadCsvForExcel } from '../utils/exportToExcel';

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anomaliesLoading, setAnomaliesLoading] = useState(true);
  const [wakingUpNotice, setWakingUpNotice] = useState(false);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => setWakingUpNotice(true), 3500);
    } else {
      setWakingUpNotice(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

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

        <div className="page-header-actions">
          {anomaliesLoading && (
            <div className="loading-anomalies-badge">
              <Loader2 size={14} className="spin-icon" />
              <span>Loading Anomalies...</span>
            </div>
          )}

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
      </div>

      {/* Anomaly Alerts */}
      <AnomalyBanner onLoadingChange={setAnomaliesLoading} />

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
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-md)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading dashboard data...</p>
          {wakingUpNotice && (
            <div style={{
              marginTop: 14,
              fontSize: '0.84rem',
              color: 'var(--accent-amber)',
              background: 'var(--bg-card)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              boxShadow: 'var(--neu-shadow-flat-sm)',
              display: 'inline-block',
              animation: 'fadeIn 300ms ease'
            }}>
              ☕ Waking up cloud server (Render free tier takes ~30s on first load)...
            </div>
          )}
        </div>
      ) : (
        <DashboardCharts leads={leads} />
      )}
    </div>
  );
}
