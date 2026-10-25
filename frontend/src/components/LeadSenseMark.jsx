export default function LeadSenseMark({ className = '' }) {
  return (
    <svg
      className={`leadsense-mark${className ? ` ${className}` : ''}`}
      viewBox="0 0 28 28"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="16" width="5" height="9" fill="currentColor" />
      <rect x="11.5" y="10" width="5" height="15" fill="currentColor" />
      <rect x="20" y="3" width="5" height="22" fill="currentColor" />
    </svg>
  );
}
