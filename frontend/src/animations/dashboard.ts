import { animate } from 'animejs';
import { Durations, Easings } from './config';
import { getSafeOptions } from './utils';

// Counter Numbers
export const counterAnimation = (
  targetObj: { value: number },
  endVal: number,
  onUpdate: (val: number) => void,
  options?: any
) => {
  return animate(targetObj, getSafeOptions({
    value: endVal,
    duration: Durations.delicate,
    ease: Easings.vercelInOut,
    onUpdate: () => {
      onUpdate(Math.round(targetObj.value));
    },
    ...options
  }));
};

// SVG Progress Scale
export const progressBarScaleX = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scaleX: [0, 1],
    duration: Durations.standard,
    ease: Easings.vercelOut,
    ...options
  }));
};

// Chart Animations
export const chartBarScaleY = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scaleY: [0, 1],
    duration: Durations.delicate,
    ease: Easings.apple,
    ...options
  }));
};

export const chartPathDraw = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    strokeDashoffset: [2000, 0],
    duration: Durations.delicate * 1.5,
    ease: Easings.stripeInOut,
    ...options
  }));
};

export const gaugeDraw = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    strokeDashoffset: [360, 0],
    duration: Durations.delicate,
    ease: Easings.vercelInOut,
    ...options
  }));
};

export const aiInsightReveal = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    y: [12, 0],
    opacity: [0, 1],
    duration: Durations.standard,
    ease: Easings.vercelOut,
    ...options
  }));
};

// Table Row Animations
export const tableRowEnter = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    opacity: [0, 1],
    y: [8, 0],
    duration: Durations.fast,
    ease: Easings.vercelOut,
    ...options
  }));
};

export const tableRowRemove = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    opacity: 0,
    y: -8,
    duration: Durations.fast,
    ease: Easings.easeOut,
    ...options
  }));
};

export const tableRowUpdate = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    backgroundColor: ['rgba(15, 118, 110, 0.08)', 'rgba(0,0,0,0)'],
    duration: Durations.slow,
    ease: Easings.easeOut,
    ...options
  }));
};
