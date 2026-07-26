export class TextureRenderer {
  // Lightweight, self-contained styles for rasterizing the page sheet exactly as it appears
  private static getPageSheetCSS(): string {
    return `
      .paper-sheet {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: #FDFCF8;
        box-sizing: border-box;
      }
      .paper-grain {
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.042;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
      }
      .book-spine-left {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 15px;
        background: linear-gradient(to left, rgba(0,0,0,0.08), rgba(0,0,0,0));
      }
      .book-spine-right {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 15px;
        background: linear-gradient(to right, rgba(0,0,0,0.08), rgba(0,0,0,0));
      }
      .p-8 { padding: 2rem; }
      .p-10 { padding: 2.5rem; }
      .flex { display: flex; }
      .flex-col { flex-direction: column; }
      .justify-between { justify-content: space-between; }
      .items-center { align-items: center; }
      .border-b { border-bottom: 1px solid rgba(120, 53, 4, 0.1); }
      .pb-4 { padding-bottom: 1rem; }
      .mb-3 { margin-bottom: 0.75rem; }
      .text-xs { font-size: 0.75rem; }
      .text-stone-400 { color: #a8a29e; }
      .text-amber-900\/60 { color: rgba(120, 53, 4, 0.6); }
      .font-sans { font-family: sans-serif; }
      .font-serif { font-family: "Times New Roman", Times, serif; }
      .columns-1 { column-count: 1; }
      .columns-2 { column-count: 2; }
      .gap-10 { column-gap: 2.5rem; }
      .text-justify { text-align: justify; }
      .leading-\\[1\\.8\\] { line-height: 1.8; }
      
      /* Book Print Styling */
      .font-serif {
        font-family: "Times New Roman", Times, serif;
        color: #2C2621;
      }
    `;
  }

  /**
   * Rasterizes a native React DOM element onto an HTML Canvas texture.
   * Preserves styles, typography, columns, and margins.
   */
  public static capture(element: HTMLElement, canvas: HTMLCanvasElement): Promise<void> {
    return new Promise((resolve) => {
      const width = canvas.width;
      const height = canvas.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve();
        return;
      }

      // Read innerHTML to avoid outer container styling issues
      const htmlContent = element.innerHTML;
      const cssRules = this.getPageSheetCSS();

      // Bundle stylesheets, fonts, and DOM inside SVG foreignObject
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%; box-sizing:border-box; background-color:#FDFCF8; position:relative;">
              <style>
                ${cssRules}
              </style>
              ${htmlContent}
            </div>
          </foreignObject>
        </svg>
      `;

      const img = new Image();
      
      // Safety timeout: Auto-resolve after 120ms to prevent Indefinite deadlocks due to CSP or image load failures
      const timeoutId = setTimeout(() => {
        console.warn('TextureRenderer capture timed out. Resolving fallback cream texture.');
        img.onload = null;
        img.onerror = null;
        ctx.fillStyle = '#FDFCF8';
        ctx.fillRect(0, 0, width, height);
        resolve();
      }, 120);

      img.onload = () => {
        clearTimeout(timeoutId);
        // Fill canvas with solid cream color before drawing the SVG
        // This guarantees the captured texture has no transparent background,
        // making the turning page mesh opaque and covering the pages underneath!
        ctx.fillStyle = '#FDFCF8';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve();
      };

      img.onerror = (err) => {
        clearTimeout(timeoutId);
        console.error('TextureRenderer rasterization failed:', err);
        ctx.fillStyle = '#FDFCF8';
        ctx.fillRect(0, 0, width, height);
        resolve();
      };

      // Load using ObjectURL or Blob to prevent cross-origin issues
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      // Cleanup ObjectURL after setting src
      img.src = url;
      setTimeout(() => URL.revokeObjectURL(url), 100);
    });
  }
}
