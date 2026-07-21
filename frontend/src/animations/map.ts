import { animate } from 'animejs';
import { Durations, Easings } from './config';
import { getSafeOptions } from './utils';

export const markerBounce = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    y: [0, -8, 0],
    duration: 800,
    ease: Easings.easeOut,
    loop: true,
    alternate: true,
    ...options
  }));
};

export const markerPulse = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: [1, 1.8],
    opacity: [0.8, 0],
    duration: 1000,
    ease: Easings.easeOut,
    loop: true,
    ...options
  }));
};

export const markerHover = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: 1.2,
    y: -3,
    duration: Durations.micro,
    ease: Easings.easeOut,
    ...options
  }));
};

export const markerReset = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: 1.0,
    y: 0,
    duration: Durations.micro,
    ease: Easings.easeOut,
    ...options
  }));
};

export const routeDraw = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    strokeDashoffset: [800, 0],
    duration: Durations.delicate * 1.5,
    ease: Easings.vercelInOut,
    ...options
  }));
};

export const clusterExpand = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: [0.88, 1],
    opacity: [0, 1],
    duration: Durations.standard,
    ease: Easings.apple,
    ...options
  }));
};

export const locationIndicatorRipple = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: [1, 2.5],
    opacity: [0.6, 0],
    duration: 1500,
    ease: Easings.easeOut,
    loop: true,
    ...options
  }));
};
