export function GlassCard({ as: Element = 'section', className = '', children, ...props }) {
  return <Element className={`glass-card${className ? ` ${className}` : ''}`} {...props}>{children}</Element>;
}

export function GlassButton({ as: Element = 'button', variant = 'primary', className = '', children, ...props }) {
  return <Element className={`glass-button glass-button-${variant}${className ? ` ${className}` : ''}`} {...props}>{children}</Element>;
}

export function SectionHeading({ eyebrow, title, body, className = '' }) {
  return (
    <div className={`section-heading${className ? ` ${className}` : ''}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  );
}
