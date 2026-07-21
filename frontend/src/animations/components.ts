import { animate } from 'animejs';
import { Durations, Easings } from './config';
import { getSafeOptions } from './utils';

// Button Micro-interactions
export const buttonHover = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: 1.015,
    duration: Durations.micro,
    ease: Easings.easeOut,
    ...options
  }));
};

export const buttonPress = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: 0.97,
    duration: 80,
    ease: Easings.easeOut,
    ...options
  }));
};

export const buttonReset = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: 1.0,
    duration: Durations.micro,
    ease: Easings.easeOut,
    ...options
  }));
};

export const buttonLoading = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    rotate: '1turn',
    duration: 800,
    ease: Easings.linear,
    loop: true,
    ...options
  }));
};

// Card Animations
export const cardAppear = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    y: [15, 0],
    opacity: [0, 1],
    scale: [0.99, 1],
    duration: Durations.standard,
    ease: Easings.vercelOut,
    ...options
  }));
};

export const cardHover = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    y: -3,
    duration: Durations.fast,
    ease: Easings.easeOut,
    ...options
  }));
};

export const cardReset = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    y: 0,
    duration: Durations.fast,
    ease: Easings.easeOut,
    ...options
  }));
};

// Form Controls
export const inputFocus = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    borderColor: '#0F766E',
    boxShadow: '0 0 0 2px rgba(15, 118, 110, 0.15)',
    duration: Durations.fast,
    ease: Easings.easeOut,
    ...options
  }));
};

export const inputReset = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    borderColor: '#E2E8F0',
    boxShadow: '0 0 0 0px rgba(0, 0, 0, 0)',
    duration: Durations.fast,
    ease: Easings.easeOut,
    ...options
  }));
};

export const inputValidationError = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    x: [0, -6, 6, -6, 6, 0],
    borderColor: '#EF4444',
    duration: 350,
    ease: Easings.linear,
    ...options
  }));
};

export const checkboxCheck = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: [0.8, 1.05, 1],
    duration: Durations.fast,
    ease: Easings.apple,
    ...options
  }));
};

export const switchToggle = (targets: any, active: boolean, options?: any) => {
  return animate(targets, getSafeOptions({
    x: active ? [0, 18] : [18, 0],
    duration: Durations.micro,
    ease: Easings.easeOut,
    ...options
  }));
};

// Overlay Panels & Dialogs
export const modalEnter = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: [0.95, 1],
    y: [20, 0],
    opacity: [0, 1],
    duration: Durations.standard,
    ease: Easings.apple,
    ...options
  }));
};

export const modalExit = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: 0.97,
    y: 15,
    opacity: 0,
    duration: Durations.fast,
    ease: Easings.easeOut,
    ...options
  }));
};

export const drawerEnter = (targets: any, side: 'left' | 'right' = 'right', options?: any) => {
  const startX = side === 'right' ? 350 : -350;
  return animate(targets, getSafeOptions({
    x: [startX, 0],
    opacity: [0.9, 1],
    duration: Durations.slow,
    ease: Easings.vercelOut,
    ...options
  }));
};

export const drawerExit = (targets: any, side: 'left' | 'right' = 'right', options?: any) => {
  const endX = side === 'right' ? 350 : -350;
  return animate(targets, getSafeOptions({
    x: endX,
    opacity: 0,
    duration: Durations.fast,
    ease: Easings.easeOut,
    ...options
  }));
};

export const bottomSheetEnter = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    y: ['100%', '0%'],
    duration: Durations.slow,
    ease: Easings.vercelOut,
    ...options
  }));
};

export const bottomSheetExit = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    y: '100%',
    duration: Durations.fast,
    ease: Easings.easeOut,
    ...options
  }));
};

// Tooltips & Toast Notification Cards
export const tooltipEnter = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    scale: [0.92, 1],
    opacity: [0, 1],
    duration: Durations.micro,
    ease: Easings.easeOut,
    ...options
  }));
};

export const toastEnter = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    x: [100, 0],
    opacity: [0, 1],
    duration: Durations.standard,
    ease: Easings.apple,
    ...options
  }));
};

export const toastExit = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    x: 50,
    opacity: 0,
    duration: Durations.fast,
    ease: Easings.easeOut,
    ...options
  }));
};

// Accordion Expand/Collapse
export const accordionToggle = (targets: any, expand: boolean, options?: any) => {
  return animate(targets, getSafeOptions({
    height: expand ? ['0px', 'auto'] : '0px',
    opacity: expand ? [0, 1] : 0,
    duration: Durations.standard,
    ease: Easings.vercelOut,
    ...options
  }));
};

// Tab Transition
export const tabPaneEnter = (targets: any, options?: any) => {
  return animate(targets, getSafeOptions({
    opacity: [0, 1],
    x: [10, 0],
    duration: Durations.standard,
    ease: Easings.vercelOut,
    ...options
  }));
};
