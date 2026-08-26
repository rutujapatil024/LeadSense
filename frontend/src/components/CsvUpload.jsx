/**
 * CsvUpload.jsx — Neumorphic CSV Bulk Upload Component
 * ====================================================
 * Drag-and-drop or click-to-upload CSV file with high-contrast Soft UI.
 * Includes a "Download Sample Template" button and upload results.
 */

import { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle, Download, FileSpreadsheet } from 'lucide-react';
import { bulkUpload } from '../api';
import { downloadCsvForExcel } from '../utils/exportToExcel';

export default function CsvUpload() {
  const [file, setFile] = useState(null);
  const [dragover, setDragover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    setDragover(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith('.csv')) {
      setFile(droppedFile);
    }
  }

  function handleFileSelect(e) {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  }

  async function handleUpload() {
    if (!file || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const data = await bulkUpload(file);
      setResult(data);
      setFile(null);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadSample() {
    const headers = ['name', 'contact', 'location', 'source', 'status', 'priority', 'enquiry_date', 'last_contacted_date', 'notes'];
    const sampleRows = [
      ['Aarav Sharma', 'aarav.sharma@example.com', 'Mumbai', 'Instagram ad', 'not_contacted', 'high', '2026-08-20', '', 'Interested in master franchise'],
      ['Priya Patel', '9876543210', 'Ahmedabad', 'referral', 'contacted', 'medium', '2026-08-18', '2026-08-19', 'Requested pitch deck'],
    ];
    downloadCsvForExcel('LeadSense_Sample_Template.csv', headers, sampleRows);
  }

  return (
    <div className="card" style={{ maxWidth: 750, margin: '0 auto' }}>
      {/* ── Top Helper Toolbar ─────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Bulk Lead Upload</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Upload multiple leads via CSV to generate embeddings automatically</p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={handleDownloadSample}
          title="Download Sample CSV Template"
        >
          <Download size={15} /> Sample Template
        </button>
      </div>

      {/* ── Drag & Drop Zone ───────────────────────── */}
      <div
        className={`upload-zone ${dragover ? 'dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          background: 'var(--bg-card)',
          boxShadow: dragover ? 'var(--neu-shadow-pressed)' : 'var(--neu-shadow-flat)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-xl)',
          textAlign: 'center',
          border: '2px dashed var(--border-default)',
          cursor: 'pointer',
          transition: 'all 200ms ease',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="csv-file-input"
        />

        <div className="upload-icon" style={{ margin: '0 auto 16px' }}>
          <Upload size={32} color="var(--accent-purple)" />
        </div>

        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', padding: '12px 18px', background: 'var(--bg-card)', boxShadow: 'var(--neu-shadow-pressed-sm)', borderRadius: 'var(--radius-md)', display: 'inline-flex' }}>
            <FileText size={20} color="var(--accent-purple)" />
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{file.name}</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem', fontWeight: 600 }}>
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
        ) : (
          <>
            <p style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
              Drop your CSV file here, or click to browse
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
              Required columns: <code style={{ background: 'var(--bg-sunken)', padding: '2px 6px', borderRadius: 4, color: 'var(--accent-purple)' }}>name, contact, location, source, status, priority, enquiry_date</code>
            </p>
          </>
        )}
      </div>

      {/* ── Upload & Process Button ────────────────── */}
      {file && (
        <button
          className="btn btn-primary btn-lg"
          onClick={handleUpload}
          disabled={loading}
          style={{ marginTop: 'var(--space-lg)', width: '100%' }}
        >
          {loading ? (
            <><div className="spinner"></div> Ingesting Leads &amp; Generating Embeddings...</>
          ) : (
            <><Upload size={18} /> Upload &amp; Ingest Leads</>
          )}
        </button>
      )}

      {/* ── Results Summary ────────────────────────── */}
      {result && !result.error && (
        <div style={{
          marginTop: 'var(--space-lg)',
          padding: 'var(--space-lg)',
          background: 'var(--bg-card)',
          boxShadow: 'var(--neu-shadow-pressed)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Check size={20} color="var(--accent-green)" />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>Bulk Ingestion Complete</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{
              padding: 16,
              background: 'var(--bg-card)',
              boxShadow: 'var(--neu-shadow-flat-sm)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                {result.success_count}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: 2 }}>Leads Ingested &amp; Embedded</div>
            </div>

            <div style={{
              padding: 16,
              background: 'var(--bg-card)',
              boxShadow: 'var(--neu-shadow-flat-sm)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: result.fail_count > 0 ? 'var(--accent-red)' : 'var(--text-tertiary)' }}>
                {result.fail_count}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: 2 }}>Errors</div>
            </div>
          </div>

          {result.errors?.length > 0 && (
            <div style={{ marginTop: 14, fontSize: '0.8rem', color: 'var(--accent-red)' }}>
              {result.errors.map((err, i) => (
                <div key={i} style={{ padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} />
                  <span>Row {err.row} ({err.name}): {err.error}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {result?.error && (
        <div style={{
          marginTop: 'var(--space-md)',
          padding: 'var(--space-md)',
          background: 'var(--bg-card)',
          boxShadow: 'var(--neu-shadow-pressed-sm)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--accent-red)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <AlertCircle size={18} /> {result.error}
        </div>
      )}
    </div>
  );
}
