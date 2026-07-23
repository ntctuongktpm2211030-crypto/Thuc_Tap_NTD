let scriptPromise: Promise<void> | null = null;

export function loadGoogleMaps(apiKey?: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google && window.google.maps) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const keyParam = apiKey ? `&key=${apiKey}` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?v=weekly${keyParam}&libraries=places,visualization`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
  return scriptPromise;
}
