import React, { useState, useRef, useEffect } from 'react';
import { animate } from 'animejs';
import { useMotion } from '../context/MotionContext';
import { Durations, Easings } from '../config';

interface MotionTooltipProps {
  text: string;
  children: React.ReactNode;
}

export const MotionTooltip: React.FC<MotionTooltipProps> = ({ text, children }) => {
  const { reducedMotion, speedMultiplier, enabled } = useMotion();
  const [show, setShow] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show || !enabled || reducedMotion || !tooltipRef.current) return;

    animate(tooltipRef.current, {
      scale: [0.92, 1],
      opacity: [0, 1],
      duration: Durations.micro * speedMultiplier,
      ease: Easings.easeOut
    });
  }, [show, speedMultiplier, reducedMotion, enabled]);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div 
          ref={tooltipRef}
          className="absolute bottom-6 right-0 bg-slate-900 text-slate-300 text-[8px] font-semibold p-2 rounded-lg w-48 leading-relaxed shadow-xl border border-slate-700 z-50 pointer-events-none"
        >
          {text}
        </div>
      )}
    </div>
  );
};
export default MotionTooltip;
