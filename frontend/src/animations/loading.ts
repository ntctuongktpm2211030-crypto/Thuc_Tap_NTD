import { animate, stagger as animeStagger } from 'animejs';
import { Durations, Easings } from './config';
import { getSafeOptions } from './utils';

export const spinnerRotate = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    rotate: '1turn',
    duration: 850,
    ease: Easings.linear,
    loop: true,
    ...options
  }));
};

export const shimmerWave = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    backgroundPosition: ['-200% 0', '200% 0'],
    duration: 1600,
    ease: Easings.linear,
    loop: true,
    ...options
  }));
};

export const dotLoading = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    y: [0, -5, 0],
    delay: animeStagger(120),
    duration: 750,
    ease: Easings.easeInOut,
    loop: true,
    ...options
  }));
};

export const pageProgressLoader = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    width: ['0%', '100%'],
    duration: 3000,
    ease: Easings.easeOut,
    ...options
  }));
};

export const circularLoaderDraw = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    strokeDashoffset: [280, 0],
    rotate: '1turn',
    duration: 1400,
    ease: Easings.vercelInOut,
    loop: true,
    ...options
  }));
};
