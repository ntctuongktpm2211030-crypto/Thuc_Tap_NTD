import React, { useRef, useEffect } from 'react';
import { animate, stagger as animeStagger } from 'animejs';
import { useMotion } from '../context/MotionContext';
import { Durations, Easings } from '../config';

interface MotionStaggerProps extends React.HTMLAttributes<HTMLDivElement> {
  selector: string;
  delay?: number;
  yOffset?: number;
}

export const MotionStagger: React.FC<MotionStaggerProps> = ({
  children,
  selector,
  delay = 50,
  yOffset = 12,
  className = '',
  ...props
}) => {
  const { reducedMotion, speedMultiplier, enabled } = useMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || reducedMotion) return;

    animate(el, {
      targets: selector,
      y: [yOffset, 0],
      opacity: [0, 1],
      delay: animeStagger(delay * speedMultiplier),
      duration: Durations.slow * speedMultiplier,
      ease: Easings.vercelOut
    });
  }, [selector, delay, yOffset, speedMultiplier, reducedMotion, enabled]);

  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  );
};
export default MotionStagger;
