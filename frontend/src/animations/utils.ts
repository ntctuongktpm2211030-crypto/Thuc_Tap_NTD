export const isSSR = (): boolean => {
  return typeof window === 'undefined' || typeof document === 'undefined';
};

export const prefersReducedMotion = (): boolean => {
  if (isSSR()) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const isDarkMode = (): boolean => {
  if (isSSR()) return false;
  return document.documentElement.classList.contains('dark') || 
         window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Safe Animation wrapper for WCAG compliance
export const getSafeOptions = (options: any = {}) => {
  if (prefersReducedMotion()) {
    return {
      ...options,
      duration: 0,
      delay: 0,
      loop: false,
      alternate: false
    };
  }
  return options;
};

// Reusable collector to register multiple active animations and batch revert them
export class AnimationCollector {
  private activeAnimations: Set<any> = new Set();

  register(animation: any) {
    if (animation) {
      this.activeAnimations.add(animation);
    }
    return animation;
  }

  unregister(animation: any) {
    if (animation) {
      this.activeAnimations.delete(animation);
    }
  }

  revertAll() {
    this.activeAnimations.forEach(anim => {
      if (typeof anim.revert === 'function') {
        anim.revert();
      }
    });
    this.activeAnimations.clear();
  }
}
