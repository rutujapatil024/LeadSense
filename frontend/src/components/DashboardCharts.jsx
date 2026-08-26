/**
 * DashboardCharts.jsx — Recharts Dashboard Visuals
 * ==================================================
 * Neumorphism styled analytics charts with safe date parsing.
 * Handles invalid or malformed enquiry dates safely.
 */

import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#7b61ff', '#4f80ff', '#06b6d4', '#f59e0b', '#ef4444',
  '#ec4899', '#10b981', '#a78bfa',
];

const tooltipStyle = {
  backgroundColor: 'var(--chart-tooltip-bg)',
  border: '1px solid var(--border-default)',
  borderRadius: '12px',
  boxShadow: 'var(--neu-shadow-flat-sm)',
  fontSize: '12px',
  fontWeight: '600',
  color: 'var(--text-primary)',
};

export default function DashboardCharts({ leads }) {
  if (!leads || leads.length === 0) {
    return (
      <div className="empty-state card">
        <div className="empty-icon">📊</div>
        <h3>No Lead Data Found</h3>
        <p>Add new leads to populate your soft UI analytics dashboard.</p>
      </div>
    );
  }

  // ── Compute chart datasets ──────────────────────

  // 1. Leads by Status
  const statusCounts = {};
  leads.forEach((l) => {
    const s = l.status || 'unknown';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  const statusData = Object.entries(statusCounts).map(([name, count]) => ({
    name: name.replace('_', ' '),
    count,
  }));

  // 2. Leads by Region (top 8)
  const regionCounts = {};
  leads.forEach((l) => {
    const r = l.location || 'Unknown';
    regionCounts[r] = (regionCounts[r] || 0) + 1;
  });
  const regionData = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // 3. Leads by Source
  const sourceCounts = {};
  leads.forEach((l) => {
    const s = l.source || 'Unknown';
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  });
  const sourceData = Object.entries(sourceCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // 4. Weekly Lead Trend (with safe date validation)
  const weekCounts = {};
  leads.forEach((l) => {
    if (l.enquiry_date) {
      const date = new Date(l.enquiry_date);
      if (!isNaN(date.getTime())) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        if (!isNaN(monday.getTime())) {
          const weekKey = monday.toISOString().split('T')[0];
          weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
        }
      }
    }
  });

  const trendData = Object.entries(weekCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, count]) => {
      const d = new Date(week);
      const label = !isNaN(d.getTime())
        ? d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
        : week;
      return {
        week: label,
        leads: count,
      };
    });

  return (
    <div className="charts-grid">
      {/* 1. Leads by Status */}
      <div className="chart-card">
        <h3>Leads by Status</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }} />
            <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {statusData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Top Regions */}
      <div className="chart-card">
        <h3>Top Lead Regions</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={regionData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }} width={85} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="var(--accent-purple)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Leads by Source */}
      <div className="chart-card">
        <h3>Lead Sources</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={sourceData}
              cx="50%"
              cy="50%"
              outerRadius={95}
              innerRadius={55}
              paddingAngle={4}
              dataKey="value"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={{ stroke: 'var(--text-tertiary)' }}
            >
              {sourceData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Lead Trend */}
      <div className="chart-card">
        <h3>Weekly Acquisition Trend</h3>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="week" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="leads"
                stroke="var(--accent-purple)"
                strokeWidth={3}
                fill="url(#colorLeads)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            No valid date trends available
          </div>
        )}
      </div>
    </div>
  );
}
