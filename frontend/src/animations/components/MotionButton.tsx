import React, { useRef, useEffect } from 'react';
import { animate } from 'animejs';
import { useMotion } from '../context/MotionContext';
import { Durations, Easings } from '../config';

interface MotionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  motion?: 'hover' | 'press' | 'both' | 'none';
  scaleHover?: number;
  scalePress?: number;
}

export const MotionButton: React.FC<MotionButtonProps> = ({
  children,
  motion = 'both',
  scaleHover = 1.015,
  scalePress = 0.97,
  className = '',
  ...props
}) => {
  const { reducedMotion, speedMultiplier, enabled } = useMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || reducedMotion || motion === 'none') return;

    const handleMouseEnter = () => {
      if (motion === 'hover' || motion === 'both') {
        if (animRef.current) animRef.current.revert();
        animRef.current = animate(el, {
          scale: scaleHover,
          duration: Durations.micro * speedMultiplier,
          ease: Easings.easeOut
        });
      }
    };

    const handleMouseLeave = () => {
      if (animRef.current) animRef.current.revert();
      animRef.current = animate(el, {
        scale: 1.0,
        duration: Durations.micro * speedMultiplier,
        ease: Easings.easeOut
      });
    };

    const handleMouseDown = () => {
      if (motion === 'press' || motion === 'both') {
        if (animRef.current) animRef.current.revert();
        animRef.current = animate(el, {
          scale: scalePress,
          duration: 80 * speedMultiplier,
          ease: Easings.easeOut
        });
      }
    };

    const handleMouseUp = () => {
      if (animRef.current) animRef.current.revert();
      animRef.current = animate(el, {
        scale: motion === 'hover' || motion === 'both' ? scaleHover : 1.0,
        duration: Durations.micro * speedMultiplier,
        ease: Easings.easeOut
      });
    };

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mouseup', handleMouseUp);

    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mouseup', handleMouseUp);
      if (animRef.current) animRef.current.revert();
    };
  }, [motion, scaleHover, scalePress, speedMultiplier, reducedMotion, enabled]);

  return (
    <button ref={ref} className={className} {...props}>
      {children}
    </button>
  );
};
export default MotionButton;
