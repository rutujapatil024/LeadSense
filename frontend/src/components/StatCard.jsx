import { useEffect, useState } from 'react';

export default function StatCard({ label, value, detail, icon: Icon, delay = 0, animate = true, className = '' }) {
  const target = Number(value) || 0;
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!animate || reducedMotion) return undefined;

    let frame;
    const start = performance.now() + delay;
    const duration = 520;
    const tick = (now) => {
      const progress = Math.max(0, Math.min(1, (now - start) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, delay, reducedMotion, target]);

  const displayedValue = !animate || reducedMotion ? target : shown;

  return (
    <article className={`stat-card glass-card${className ? ` ${className}` : ''}`} style={{ '--stat-delay': `${delay}ms` }}>
      <div className="stat-card-heading">
        <span className="stat-label">{label}</span>
        {Icon && <span className="stat-icon"><Icon size={18} strokeWidth={1.7} /></span>}
      </div>
      <strong className="stat-value">{displayedValue.toLocaleString('en-IN')}</strong>
      {detail && <span className="stat-detail">{detail}</span>}
    </article>
  );
}
