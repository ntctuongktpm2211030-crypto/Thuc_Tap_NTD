export interface PageData {
  title: string;
  content: string;
  pageNumber: number;
  totalPages: number;
  half: 'left' | 'right' | 'full';
}

export class CanvasPageRenderer {
  static render(canvas: HTMLCanvasElement, data: PageData) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Draw warm paper background
    ctx.fillStyle = '#FDFCF8';
    ctx.fillRect(0, 0, width, height);

    // Subtle paper gradient
    const grad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, width);
    grad.addColorStop(0, 'rgba(253, 252, 248, 1)');
    grad.addColorStop(1, 'rgba(242, 239, 224, 0.8)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Paper noise pattern (Canvas-level texture)
    ctx.fillStyle = 'rgba(0,0,0,0.012)';
    for (let i = 0; i < 800; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }

    // Page border
    ctx.strokeStyle = 'rgba(120, 53, 4, 0.06)';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    // 2. Draw Book Spine Shadows if left or right half
    if (data.half === 'left') {
      const spineShadow = ctx.createLinearGradient(width - 24, 0, width, 0);
      spineShadow.addColorStop(0, 'rgba(0,0,0,0)');
      spineShadow.addColorStop(1, 'rgba(0,0,0,0.07)');
      ctx.fillStyle = spineShadow;
      ctx.fillRect(width - 24, 0, 24, height);
    } else if (data.half === 'right') {
      const spineShadow = ctx.createLinearGradient(0, 0, 24, 0);
      spineShadow.addColorStop(0, 'rgba(0,0,0,0.07)');
      spineShadow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = spineShadow;
      ctx.fillRect(0, 0, 24, height);
    }

    // 3. Draw Header Section
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'; // slate-500
    ctx.font = 'bold 24px "Outfit", Inter, sans-serif';
    ctx.fillText(data.title.toUpperCase(), 54, 70);

    ctx.fillStyle = 'rgba(120, 53, 4, 0.65)'; // amber-900/60
    ctx.font = 'bold 18px Inter, sans-serif';
    const pageStr = `Trang ${data.pageNumber} / ${data.totalPages}`;
    const pageWidth = ctx.measureText(pageStr).width;
    ctx.fillText(pageStr, width - pageWidth - 54, 70);

    // Separator line
    ctx.strokeStyle = 'rgba(120, 53, 4, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(54, 92);
    ctx.lineTo(width - 54, 92);
    ctx.stroke();

    // 4. Draw Text Columns (Multi-column wrapping)
    const content = data.content;
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.font = '500 22px Inter, sans-serif';
    
    // Split into columns
    const columns = data.half === 'full' ? 1 : 2;
    const paddingX = 54;
    const paddingY = 120;
    const colGap = 48;
    const colWidth = (width - paddingX * 2 - (columns - 1) * colGap) / columns;
    const colHeight = height - paddingY - 90;

    // Helper function to layout text into columns
    const words = content.split(' ');
    let currentColumn = 0;
    let lineY = paddingY + 32;
    let lineX = paddingX + currentColumn * (colWidth + colGap);
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i] + ' ';
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > colWidth && i > 0) {
        // Draw current line
        ctx.fillText(currentLine, lineX, lineY);
        currentLine = words[i] + ' ';
        lineY += 40; // Line spacing (leading)

        // Check if column overflow
        if (lineY > paddingY + colHeight) {
          currentColumn++;
          if (currentColumn >= columns) {
            // Text overflow, stop rendering
            break;
          }
          lineY = paddingY + 32;
          lineX = paddingX + currentColumn * (colWidth + colGap);
        }
      } else {
        currentLine = testLine;
      }
    }
    
    // Draw last line if columns remain
    if (currentColumn < columns && currentLine) {
      ctx.fillText(currentLine, lineX, lineY);
    }
  }
}
