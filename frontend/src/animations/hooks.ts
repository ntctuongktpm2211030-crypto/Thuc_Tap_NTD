import { useState, useEffect, useRef } from 'react';
import { animate, createTimeline, stagger as animeStagger } from 'animejs';
import { Durations, Easings } from './config';
import { getSafeOptions, AnimationCollector } from './utils';

// Programmatically trigger animations on a target ref
export const useAnimate = (options?: any) => {
  const elementRef = useRef<any>(null);
  const animRef = useRef<any>(null);

  const start = (overrideOptions?: any) => {
    if (elementRef.current) {
      if (animRef.current) animRef.current.revert();
      animRef.current = animate(elementRef.current, getSafeOptions({
        ...options,
        ...overrideOptions
      }));
    }
    return animRef.current;
  };

  useEffect(() => {
    return () => {
      if (animRef.current) animRef.current.revert();
    };
  }, []);

  return { ref: elementRef, start, animation: animRef };
};

// Orchestrate complex sequential/parallel timelines
export const useTimeline = (timelineOptions?: any) => {
  const tlRef = useRef<any>(null);

  useEffect(() => {
    tlRef.current = createTimeline(getSafeOptions({
      defaults: { duration: Durations.standard, ease: Easings.vercelOut },
      ...timelineOptions
    }));

    return () => {
      if (tlRef.current) tlRef.current.revert();
    };
  }, [timelineOptions]);

  return tlRef;
};

// Count-up numeric hooks
export const useCounter = (endVal: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);
  const targetObjRef = useRef({ value: 0 });
  const animRef = useRef<any>(null);

  useEffect(() => {
    if (animRef.current) animRef.current.revert();
    targetObjRef.current.value = 0;
    animRef.current = animate(targetObjRef.current, getSafeOptions({
      value: endVal,
      duration,
      ease: Easings.vercelInOut,
      onUpdate: () => {
        setCount(Math.round(targetObjRef.current.value));
      }
    }));

    return () => {
      if (animRef.current) animRef.current.revert();
    };
  }, [endVal, duration]);

  return count;
};

// Scroll Reveal
export const useScrollReveal = (options?: any) => {
  const elementRef = useRef<any>(null);

  useEffect(() => {
    if (!elementRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        animate(elementRef.current, getSafeOptions({
          y: [20, 0],
          opacity: [0, 1],
          duration: Durations.slow,
          ease: Easings.vercelOut,
          ...options
        }));
        observer.unobserve(elementRef.current);
      }
    }, { threshold: 0.05 });

    observer.observe(elementRef.current);
    return () => {
      observer.disconnect();
    };
  }, [options]);

  return elementRef;
};

// Stagger child elements inside a parent node
export const useStagger = (selector: string, options?: any) => {
  const elementRef = useRef<any>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    if (!elementRef.current) return;
    animRef.current = animate(elementRef.current, getSafeOptions({
      targets: selector,
      y: [12, 0],
      opacity: [0, 1],
      delay: animeStagger(50),
      duration: Durations.slow,
      ease: Easings.vercelOut,
      ...options
    }));

    return () => {
      if (animRef.current) animRef.current.revert();
    };
  }, [selector, options]);

  return elementRef;
};

// Bind hover state triggers
export const useHover = (scaleAmt = 1.015, duration = Durations.micro) => {
  const elementRef = useRef<any>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const onMouseEnter = () => {
      if (animRef.current) animRef.current.revert();
      animRef.current = animate(el, getSafeOptions({
        scale: scaleAmt,
        duration,
        ease: Easings.easeOut
      }));
    };

    const onMouseLeave = () => {
      if (animRef.current) animRef.current.revert();
      animRef.current = animate(el, getSafeOptions({
        scale: 1.0,
        duration,
        ease: Easings.easeOut
      }));
    };

    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', onMouseLeave);
      if (animRef.current) animRef.current.revert();
    };
  }, [scaleAmt, duration]);

  return elementRef;
};

// Bind press state triggers
export const usePress = (scaleAmt = 0.97, duration = 80) => {
  const elementRef = useRef<any>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const onMouseDown = () => {
      if (animRef.current) animRef.current.revert();
      animRef.current = animate(el, getSafeOptions({
        scale: scaleAmt,
        duration,
        ease: Easings.easeOut
      }));
    };

    const onMouseUp = () => {
      if (animRef.current) animRef.current.revert();
      animRef.current = animate(el, getSafeOptions({
        scale: 1.0,
        duration,
        ease: Easings.easeOut
      }));
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseup', onMouseUp);
      if (animRef.current) animRef.current.revert();
    };
  }, [scaleAmt, duration]);

  return elementRef;
};

// Loading shimmer loop wrapper
export const useLoading = (loop = true) => {
  const elementRef = useRef<any>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    if (!elementRef.current || !loop) return;
    animRef.current = animate(elementRef.current, getSafeOptions({
      opacity: [0.4, 0.8, 0.4],
      duration: 1200,
      ease: Easings.easeInOut,
      loop: true
    }));

    return () => {
      if (animRef.current) animRef.current.revert();
    };
  }, [loop]);

  return elementRef;
};

// Custom viewport intersection callbacks
export const useIntersection = (onIntersect: () => void, threshold = 0.1) => {
  const elementRef = useRef<any>(null);

  useEffect(() => {
    if (!elementRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        onIntersect();
      }
    }, { threshold });

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [onIntersect, threshold]);

  return elementRef;
};

// Scroll parallax translation mapping
export const useParallax = (speed = 0.1) => {
  const elementRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      if (!elementRef.current) return;
      const scrolled = window.scrollY;
      elementRef.current.style.transform = `translateY(${scrolled * speed}px)`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return elementRef;
};
