import React, { useRef, useEffect } from 'react';
import { animate } from 'animejs';
import { useMotion } from '../context/MotionContext';
import { Durations, Easings } from '../config';

interface MotionInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const MotionInput: React.FC<MotionInputProps> = ({
  hasError = false,
  className = '',
  ...props
}) => {
  const { reducedMotion, speedMultiplier, enabled } = useMotion();
  const ref = useRef<HTMLInputElement>(null);

  // Trigger shake on validation error change
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || reducedMotion || !hasError) return;

    animate(el, {
      x: [0, -5, 5, -5, 5, 0],
      borderColor: '#EF4444',
      duration: 350 * speedMultiplier,
      ease: Easings.linear
    });
  }, [hasError, speedMultiplier, reducedMotion, enabled]);

  // Handle focus effects programmatically
  const handleFocus = () => {
    const el = ref.current;
    if (!el || !enabled || reducedMotion || hasError) return;

    animate(el, {
      borderColor: '#0F766E',
      boxShadow: '0 0 0 2px rgba(15, 118, 110, 0.15)',
      duration: Durations.fast * speedMultiplier,
      ease: Easings.easeOut
    });
  };

  const handleBlur = () => {
    const el = ref.current;
    if (!el || !enabled || reducedMotion || hasError) return;

    animate(el, {
      borderColor: '#E2E8F0',
      boxShadow: '0 0 0 0px rgba(0, 0, 0, 0)',
      duration: Durations.fast * speedMultiplier,
      ease: Easings.easeOut
    });
  };

  return (
    <input 
      ref={ref}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none transition-all ${className}`}
      {...props}
    />
  );
};
export default MotionInput;
