const OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function ThemeToggle({ value, onChange, compact = false }) {
  const selectedIndex = Math.max(0, OPTIONS.findIndex((option) => option.value === value));
  return (
    <div className={`theme-toggle${compact ? ' theme-toggle-compact' : ''}`} data-selected-index={selectedIndex} role="group" aria-label="Color theme">
      <span className="theme-toggle-indicator" aria-hidden="true" />
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'selected' : ''}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
