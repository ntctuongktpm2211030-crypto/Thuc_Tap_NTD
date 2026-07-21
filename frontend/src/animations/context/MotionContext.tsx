import React, { createContext, useContext, useState, useEffect } from 'react';
import { prefersReducedMotion } from '../utils';
import { Easings } from '../config';

interface MotionContextProps {
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  speedMultiplier: number; // e.g. 1.0 (default), 0.5 (slow-mo), 2.0 (fast)
  setSpeedMultiplier: (val: number) => void;
  enabled: boolean;
  setEnabled: (val: boolean) => void;
  debug: boolean;
  setDebug: (val: boolean) => void;
  defaultEasing: string;
  setDefaultEasing: (val: string) => void;
}

const MotionContext = createContext<MotionContextProps | undefined>(undefined);

export const MotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [enabled, setEnabled] = useState(true);
  const [debug, setDebug] = useState(false);
  const [defaultEasing, setDefaultEasing] = useState(Easings.vercelOut);

  // Read system prefers-reduced-motion automatically on load
  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  return (
    <MotionContext.Provider value={{
      reducedMotion,
      setReducedMotion,
      speedMultiplier,
      setSpeedMultiplier,
      enabled,
      setEnabled,
      debug,
      setDebug,
      defaultEasing,
      setDefaultEasing
    }}>
      {children}
    </MotionContext.Provider>
  );
};

export const useMotion = () => {
  const context = useContext(MotionContext);
  if (!context) {
    throw new Error('useMotion must be used within a MotionProvider');
  }
  return context;
};
