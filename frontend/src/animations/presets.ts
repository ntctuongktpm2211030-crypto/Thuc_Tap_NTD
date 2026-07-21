import { animate, createTimeline, stagger as animeStagger } from 'animejs';
import { Durations, Easings } from './config';
import { getSafeOptions } from './utils';

export const fadeIn = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    opacity: [0, 1],
    duration: Durations.standard,
    ease: Easings.easeOut,
    ...options
  }));
};

export const fadeOut = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    opacity: [1, 0],
    duration: Durations.fast,
    ease: Easings.easeOut,
    ...options
  }));
};

export const slideUp = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    y: [20, 0],
    opacity: [0, 1],
    duration: Durations.slow,
    ease: Easings.vercelOut,
    ...options
  }));
};

export const slideDown = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    y: [-20, 0],
    opacity: [0, 1],
    duration: Durations.slow,
    ease: Easings.vercelOut,
    ...options
  }));
};

export const slideLeft = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    x: [25, 0],
    opacity: [0, 1],
    duration: Durations.slow,
    ease: Easings.vercelOut,
    ...options
  }));
};

export const slideRight = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    x: [-25, 0],
    opacity: [0, 1],
    duration: Durations.slow,
    ease: Easings.vercelOut,
    ...options
  }));
};

export const zoomIn = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: [0.96, 1],
    opacity: [0, 1],
    duration: Durations.standard,
    ease: Easings.apple,
    ...options
  }));
};

export const zoomOut = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: [1, 0.96],
    opacity: [1, 0],
    duration: Durations.fast,
    ease: Easings.easeOut,
    ...options
  }));
};

export const bounce = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    y: [0, -10, 0],
    duration: 500,
    ease: Easings.apple,
    ...options
  }));
};

export const pulse = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: [1, 1.02, 1],
    duration: 1000,
    ease: Easings.easeInOut,
    loop: true,
    ...options
  }));
};

export const float = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    y: [0, -5, 0],
    duration: 1800,
    ease: Easings.easeInOut,
    loop: true,
    ...options
  }));
};

export const shake = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    x: [0, -5, 5, -5, 5, 0],
    duration: 350,
    ease: Easings.linear,
    ...options
  }));
};

export const staggerList = (targets: any, selector: string, options?: any) => {
  return animate(targets, getSafeOptions({
    targets: selector,
    y: [12, 0],
    opacity: [0, 1],
    delay: animeStagger(40),
    duration: Durations.slow,
    ease: Easings.vercelOut,
    ...options
  }));
};

// Advanced Timeline Builder
export const createMotionTimeline = (timelineOptions?: any) => {
  return createTimeline(getSafeOptions({
    defaults: {
      duration: Durations.standard,
      ease: Easings.vercelOut
    },
    ...timelineOptions
  }));
};
