import React, { useRef, useEffect } from 'react';
import { animate } from 'animejs';
import { useMotion } from '../context/MotionContext';
import { Durations, Easings } from '../config';

interface MotionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  motion?: 'appear' | 'hover' | 'both' | 'none';
  yOffset?: number;
}

export const MotionCard: React.FC<MotionCardProps> = ({
  children,
  motion = 'both',
  yOffset = -3,
  className = '',
  ...props
}) => {
  const { reducedMotion, speedMultiplier, enabled } = useMotion();
  const ref = useRef<HTMLDivElement>(null);
  const hoverAnimRef = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || reducedMotion) return;

    // 1. Mount entrance animation
    if (motion === 'appear' || motion === 'both') {
      animate(el, {
        y: [15, 0],
        opacity: [0, 1],
        scale: [0.99, 1],
        duration: Durations.standard * speedMultiplier,
        ease: Easings.vercelOut
      });
    }

    // 2. Hover transitions setup
    if (motion === 'hover' || motion === 'both') {
      const handleMouseEnter = () => {
        if (hoverAnimRef.current) hoverAnimRef.current.revert();
        hoverAnimRef.current = animate(el, {
          y: yOffset,
          duration: Durations.fast * speedMultiplier,
          ease: Easings.easeOut
        });
      };

      const handleMouseLeave = () => {
        if (hoverAnimRef.current) hoverAnimRef.current.revert();
        hoverAnimRef.current = animate(el, {
          y: 0,
          duration: Durations.fast * speedMultiplier,
          ease: Easings.easeOut
        });
      };

      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
        if (hoverAnimRef.current) hoverAnimRef.current.revert();
      };
    }
  }, [motion, yOffset, speedMultiplier, reducedMotion, enabled]);

  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  );
};
export default MotionCard;
