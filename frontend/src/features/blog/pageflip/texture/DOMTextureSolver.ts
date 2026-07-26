export class DOMTextureSolver {
  private static cachedCSS: string | null = null;

  // Retrieve and cache all active document CSS rules to embed inside the SVG
  private static getDocumentCSS(): string {
    if (this.cachedCSS !== null) return this.cachedCSS;

    let css = '';
    try {
      for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i];
        try {
          const rules = sheet.cssRules || sheet.rules;
          for (let j = 0; j < rules.length; j++) {
            css += rules[j].cssText + '\n';
          }
        } catch (e) {
          // Ignore cross-origin stylesheet errors
        }
      }
    } catch (err) {
      console.warn('Failed to extract document stylesheets:', err);
    }

    this.cachedCSS = css;
    return css;
  }

  // Captures a native HTML element into a canvas texture
  public static capture(element: HTMLElement, canvas: HTMLCanvasElement): Promise<void> {
    return new Promise((resolve) => {
      const width = canvas.width;
      const height = canvas.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve();
        return;
      }

      const htmlContent = element.outerHTML;
      const cssRules = this.getDocumentCSS();

      // Bundle stylesheets, fonts, and DOM inside SVG foreignObject
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%; box-sizing:border-box;">
              <style>
                ${cssRules}
                /* Custom corrections for Canvas rendering */
                .paper-sheet {
                  box-shadow: none !important;
                  border: none !important;
                }
              </style>
              ${htmlContent}
            </div>
          </foreignObject>
        </svg>
      `;

      const img = new Image();
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve();
      };

      img.onerror = (err) => {
        console.error('SVG foreignObject rasterization failed:', err);
        // Fallback: draw warm color rectangle
        ctx.fillStyle = '#FDFCF8';
        ctx.fillRect(0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve();
      };

      img.src = url;
    });
  }
}
