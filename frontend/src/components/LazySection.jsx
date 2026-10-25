import { useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';

export default function LazySection({ load, minHeight = 220, className = '' }) {
  const ref = useRef(null);
  const [Section, setSection] = useState(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    let active = true;
    const reveal = () => load().then((module) => {
      if (active) setSection(() => module.default);
    });
    if (!('IntersectionObserver' in window)) {
      reveal();
      return () => { active = false; };
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      reveal();
    }, { rootMargin: '320px 0px' });
    observer.observe(node);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [load]);

  return (
    <div ref={ref} className={className} style={{ minHeight: Section ? undefined : minHeight }}>
      {Section && <Reveal><Section /></Reveal>}
    </div>
  );
}
