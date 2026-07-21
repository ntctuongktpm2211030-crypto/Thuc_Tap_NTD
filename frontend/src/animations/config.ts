export const Durations = {
  instant: 0,
  micro: 120,      // Micro-interactions (like checkbox or switch toggle)
  fast: 220,       // Hover, press states, and button updates
  standard: 320,   // Modals, dropdowns, and card entrances
  slow: 550,       // Large scale layout slides, scroll reveals
  delicate: 800    // AI insight panels, chart sweeps, map path draws
};

export const Easings = {
  // Apple HIG Spring-like curve (smooth back-out)
  apple: 'outElastic(1, .85)',
  
  // Vercel / Linear clean curves
  vercelOut: 'outCubic',
  vercelInOut: 'inOutCubic',
  
  // Stripe-style ease curves
  stripeOut: 'outQuint',
  stripeInOut: 'inOutQuint',
  
  // Standard css curves
  easeOut: 'outQuad',
  easeInOut: 'inOutQuad',
  linear: 'linear'
};

export const GlobalConfig = {
  fps: 60,
  useTransforms: true,
  batchDOM: true
};
