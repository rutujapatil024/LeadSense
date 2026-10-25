import { useEffect, useRef, useState } from 'react';
import { PredictiveArcCanvas } from '../shaders/predictive-arc/PredictiveArcCanvas';

function StaticSignalFrame({ mode }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const draw = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(bounds.width * ratio));
      canvas.height = Math.max(1, Math.round(bounds.height * ratio));
      const context = canvas.getContext('2d');
      if (!context) return;
      context.scale(ratio, ratio);
      const width = bounds.width;
      const height = bounds.height;
      const dark = mode === 'dark';
      context.fillStyle = dark ? '#121714' : '#f8faf8';
      context.fillRect(0, 0, width, height);
      const step = width < 600 ? 44 : 56;
      const points = [];
      for (let y = 24; y < height; y += step) {
        for (let x = 24; x < width; x += step) {
          points.push({ x: x + Math.sin(x * 0.01 + y * 0.02) * 5, y: y + Math.cos(y * 0.01 + x * 0.02) * 5 });
        }
      }
      const stroke = dark ? '151, 177, 162' : '93, 124, 108';
      context.lineWidth = 0.7;
      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const distance = Math.hypot(dx, dy);
          if (distance > step * 1.55) continue;
          context.strokeStyle = `rgba(${stroke}, ${0.09 * (1 - distance / (step * 1.55))})`;
          context.beginPath();
          context.moveTo(points[i].x, points[i].y);
          context.lineTo(points[j].x, points[j].y);
          context.stroke();
        }
      }
      for (const point of points) {
        context.beginPath();
        context.fillStyle = dark ? 'rgba(182, 207, 190, 0.38)' : 'rgba(76, 113, 91, 0.24)';
        context.arc(point.x, point.y, 1.35, 0, Math.PI * 2);
        context.fill();
      }
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [mode]);

  return <canvas className="static-signal-frame" aria-hidden="true" ref={canvasRef} />;
}

export default function ParticleBackground({ mode }) {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(() => !document.hidden);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(motion.matches);
    const updateVisibility = () => setVisible(!document.hidden);
    motion.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      motion.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  return (
    <div className="particle-background" aria-hidden="true">
      {reducedMotion || !visible
        ? <StaticSignalFrame mode={mode} />
        : <div className="particle-background-frame"><PredictiveArcCanvas variant="signal-particles" mode={mode} speed={1} hue={-82} saturation={0.7} brightness={0.92} /></div>}
    </div>
  );
}
