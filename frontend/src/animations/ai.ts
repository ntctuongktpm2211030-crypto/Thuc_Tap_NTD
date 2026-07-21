import { animate } from 'animejs';
import { Durations, Easings } from './config';
import { getSafeOptions } from './utils';

export const cursorBlink = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    opacity: [1, 0],
    duration: 800,
    ease: 'steps(2)',
    loop: true,
    ...options
  }));
};

export const thinkingPulse = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: [1, 1.04, 1],
    opacity: [0.6, 1, 0.6],
    duration: 1000,
    ease: Easings.easeInOut,
    loop: true,
    ...options
  }));
};

export const messageBubblePop = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: [0.94, 1],
    opacity: [0, 1],
    y: [8, 0],
    duration: Durations.standard,
    ease: Easings.apple,
    ...options
  }));
};

export const avatarReveal = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: [0.85, 1],
    opacity: [0, 1],
    duration: Durations.standard,
    ease: Easings.apple,
    ...options
  }));
};

export const streamingTextReveal = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    opacity: [0, 1],
    y: [4, 0],
    duration: Durations.micro,
    ease: Easings.easeOut,
    ...options
  }));
};

export const voiceIndicatorPulse = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: [1, 1.3, 1],
    opacity: [1, 0.4, 1],
    duration: 800,
    ease: Easings.easeInOut,
    loop: true,
    ...options
  }));
};
