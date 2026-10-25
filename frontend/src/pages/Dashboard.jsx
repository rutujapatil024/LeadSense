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
import StatCard from '../components/StatCard';
import { getLeads } from '../api';
import { downloadCsvForExcel } from '../utils/exportToExcel';

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anomaliesLoading, setAnomaliesLoading] = useState(true);
  const [wakingUpNotice, setWakingUpNotice] = useState(false);

  useEffect(() => {
    if (!loading) return undefined;
    const timer = setTimeout(() => setWakingUpNotice(true), 3500);
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
        <StatCard label="Total leads" value={loading ? 0 : totalLeads} detail="Across your pipeline" icon={Users} />
        <StatCard label="Converted" value={loading ? 0 : converted} detail={`${conversionRate}% conversion rate`} icon={UserCheck} />
        <StatCard label="Not contacted" value={loading ? 0 : notContacted} detail="Ready for first touch" icon={UserX} />
        <StatCard label="High priority" value={loading ? 0 : highPriority} detail="Needs focused follow-up" icon={TrendingUp} />
      </div>

      {/* Charts */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-md)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading dashboard data...</p>
          {loading && wakingUpNotice && (
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
              Connecting to the lead workspace. The first request may take a moment.
            </div>
          )}
        </div>
      ) : (
        <DashboardCharts leads={leads} />
      )}
    </div>
  );
}
