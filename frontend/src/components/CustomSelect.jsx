/**
 * CustomSelect.jsx — Neumorphic Custom Dropdown Component
 * =========================================================
 * Replaces native OS <select> boxes with custom Soft UI Neumorphic dropdown menus
 * that perfectly match Light and Dark mode themes.
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select option',
  badgeClass = '',
  style = {},
  variant = 'default', // 'default' | 'badge'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  function handleSelect(optionValue) {
    onChange(optionValue);
    setIsOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style,
      }}
    >
      {/* ── Dropdown Trigger Button ─────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={variant === 'badge' ? `badge ${badgeClass}` : 'form-input'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
          padding: variant === 'badge' ? '5px 10px' : '10px 14px',
          fontWeight: 700,
          textAlign: 'left',
          width: '100%',
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          size={14}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
            opacity: 0.8,
            flexShrink: 0,
          }}
        />
      </button>

      {/* ── Dropdown Menu Popup ───────────────────────── */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: '100%',
            width: 'max-content',
            maxHeight: 220,
            overflowY: 'auto',
            background: 'var(--bg-card)',
            boxShadow: 'var(--neu-shadow-flat)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 6,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? 'var(--accent-purple)' : 'var(--text-primary)',
                  background: isSelected ? 'var(--bg-sunken)' : 'transparent',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--bg-sunken)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={14} color="var(--accent-purple)" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
