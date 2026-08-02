import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook returning a function that checks if the component is currently mounted.
 * Prevents calling setState on unmounted components after async promises resolve.
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}
