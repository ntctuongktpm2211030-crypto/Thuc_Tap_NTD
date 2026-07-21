import React, { useRef, useEffect } from 'react';
import { animate } from 'animejs';
import { useMotion } from '../context/MotionContext';
import { Durations, Easings } from '../config';

interface MotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const MotionModal: React.FC<MotionModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer
}) => {
  const { reducedMotion, speedMultiplier, enabled } = useMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !enabled || reducedMotion) return;

    // Animate overlay backdrop fading
    if (overlayRef.current) {
      animate(overlayRef.current, {
        opacity: [0, 1],
        duration: Durations.standard * speedMultiplier,
        ease: Easings.easeOut
      });
    }

    // Animate inner modal card spring bounce
    if (cardRef.current) {
      animate(cardRef.current, {
        scale: [0.95, 1],
        y: [20, 0],
        opacity: [0, 1],
        duration: Durations.standard * speedMultiplier,
        ease: Easings.apple
      });
    }
  }, [isOpen, speedMultiplier, reducedMotion, enabled]);

  if (!isOpen) return null;

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div 
        ref={cardRef}
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title || 'Details'}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg border-none bg-transparent cursor-pointer transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/20">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-slate-200 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
export default MotionModal;
