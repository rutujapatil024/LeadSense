/**
 * CustomDatePicker.jsx — Neumorphic Custom Calendar Component
 * =============================================================
 * Replaces native OS date inputs with a Soft UI Neumorphic DatePicker
 * that perfectly matches Light and Dark themes.
 */

import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  required = false,
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse existing value or default to current date
  const parsedDate = value ? new Date(value) : null;
  const initialYear = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.getFullYear() : new Date().getFullYear();
  const initialMonth = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.getMonth() : new Date().getMonth();

  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  function prevMonth(e) {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth(e) {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function handleSelectDay(day) {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formatted = `${viewYear}-${monthStr}-${dayStr}`;
    onChange(formatted);
    setIsOpen(false);
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  }

  function handleToday(e) {
    e.stopPropagation();
    const today = new Date();
    const monthStr = String(today.getMonth() + 1).padStart(2, '0');
    const dayStr = String(today.getDate()).padStart(2, '0');
    const formatted = `${today.getFullYear()}-${monthStr}-${dayStr}`;
    onChange(formatted);
    setIsOpen(false);
  }

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  // Adjust so Monday is 0
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const formattedDisplay = value && !isNaN(new Date(value).getTime())
    ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* ── Input Trigger Box ─────────────────────────── */}
      <div
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className="form-input"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{ color: formattedDisplay ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: formattedDisplay ? 600 : 400 }}>
          {formattedDisplay || placeholder}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}
              title="Clear date"
            >
              <X size={14} />
            </button>
          )}
          <CalendarIcon size={16} color="var(--accent-purple)" />
        </div>
      </div>

      {/* ── Neumorphic Calendar Popover ─────────────────── */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: 290,
            background: 'var(--bg-card)',
            boxShadow: 'var(--neu-shadow-flat-lg)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            zIndex: 9999,
            border: '1px solid var(--border-subtle)',
            animation: 'fadeIn 150ms ease',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button
              type="button"
              className="modal-close"
              onClick={prevMonth}
              style={{ width: 28, height: 28 }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>

            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              className="modal-close"
              onClick={nextMonth}
              style={{ width: 28, height: 28 }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Names */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center', marginBottom: 6 }}>
            {DAYS_OF_WEEK.map((d) => (
              <span key={d} style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {/* Empty padding slots */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day Numbers */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const monthStr = String(viewMonth + 1).padStart(2, '0');
              const dayStr = String(day).padStart(2, '0');
              const dateStr = `${viewYear}-${monthStr}-${dayStr}`;
              const isSelected = value === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-sm)',
                    border: isToday && !isSelected ? '1px solid var(--accent-purple)' : 'none',
                    background: isSelected ? 'var(--accent-gradient-primary)' : 'var(--bg-card)',
                    boxShadow: isSelected ? 'var(--accent-gradient-glow)' : 'var(--neu-shadow-flat-sm)',
                    color: isSelected ? 'white' : 'var(--text-primary)',
                    fontWeight: isSelected || isToday ? 800 : 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--bg-sunken)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--bg-card)';
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-default)' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleClear}
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleToday}
              style={{ fontSize: '0.75rem', padding: '4px 8px', color: 'var(--accent-purple)' }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
