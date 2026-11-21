import type { CanvasElement, DesignPage, DesignProject } from '../types/studio';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
  }
  return lines;
}

export async function renderPageToDataUrl(
  design: DesignProject,
  page: DesignPage,
  format: 'png' | 'jpeg',
  scale = 1,
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(design.width * scale);
  canvas.height = Math.round(design.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(scale, scale);

  // Page background
  ctx.fillStyle = page.backgroundColor || '#FFFFFF';
  ctx.fillRect(0, 0, design.width, design.height);

  for (const el of page.elements) {
    if (el.hidden) continue;
    await drawElement(ctx, el);
  }

  return canvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.94);
}

async function drawElement(ctx: CanvasRenderingContext2D, el: CanvasElement) {
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;

  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  ctx.translate(cx, cy);
  if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
  if (el.flipX || el.flipY) ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
  ctx.translate(-el.width / 2, -el.height / 2);

  if (el.type === 'shape') {
    ctx.fillStyle = el.fill || '#0F766E';
    ctx.strokeStyle = el.stroke || 'transparent';
    ctx.lineWidth = el.strokeWidth || 0;
    if (el.strokeStyle === 'dashed') ctx.setLineDash([8, 6]);

    if (el.shapeKind === 'circle' || el.shapeKind === 'oval') {
      ctx.beginPath();
      ctx.ellipse(el.width / 2, el.height / 2, el.width / 2, el.height / 2, 0, 0, Math.PI * 2);
      if (el.fill !== 'transparent') ctx.fill();
      if (el.strokeWidth) ctx.stroke();
    } else if (el.shapeKind === 'ring') {
      ctx.strokeStyle = el.fill !== 'transparent' ? el.fill || '#0F766E' : el.stroke || '#0F766E';
      ctx.lineWidth = Math.max(8, el.strokeWidth || 12);
      ctx.beginPath();
      ctx.ellipse(el.width / 2, el.height / 2, el.width * 0.38, el.height * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (el.shapeKind === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(el.width / 2, 0);
      ctx.lineTo(el.width, el.height);
      ctx.lineTo(0, el.height);
      ctx.closePath();
      if (el.fill !== 'transparent') ctx.fill();
      if (el.strokeWidth) ctx.stroke();
    } else if (el.shapeKind === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(el.width / 2, 0);
      ctx.lineTo(el.width, el.height / 2);
      ctx.lineTo(el.width / 2, el.height);
      ctx.lineTo(0, el.height / 2);
      ctx.closePath();
      if (el.fill !== 'transparent') ctx.fill();
      if (el.strokeWidth) ctx.stroke();
    } else if (el.shapeKind === 'line') {
      ctx.strokeStyle = el.fill !== 'transparent' ? el.fill || '#0F172A' : el.stroke || '#0F172A';
      ctx.lineWidth = Math.max(2, el.strokeWidth || 4);
      ctx.beginPath();
      ctx.moveTo(0, el.height / 2);
      ctx.lineTo(el.width, el.height / 2);
      ctx.stroke();
    } else if (el.shapeKind === 'curve') {
      ctx.strokeStyle = el.fill !== 'transparent' ? el.fill || '#0F172A' : el.stroke || '#0F172A';
      ctx.lineWidth = Math.max(2, el.strokeWidth || 6);
      ctx.beginPath();
      ctx.moveTo(0, el.height * 0.75);
      ctx.quadraticCurveTo(el.width / 2, el.height * 0.05, el.width, el.height * 0.75);
      ctx.stroke();
    } else {
      drawRoundedRectPath(ctx, 0, 0, el.width, el.height, el.borderRadius || 0);
      if (el.fill !== 'transparent') ctx.fill();
      if (el.strokeWidth) ctx.stroke();
    }
  } else if (el.type === 'image' && el.src) {
    try {
      const img = await loadImage(el.src);
      if (el.borderRadius) {
        drawRoundedRectPath(ctx, 0, 0, el.width, el.height, el.borderRadius);
        ctx.clip();
      }
      if (el.filters) {
        ctx.filter = `brightness(${el.filters.brightness}%) contrast(${el.filters.contrast}%) saturate(${el.filters.saturate}%) blur(${el.filters.blur}px) grayscale(${el.filters.grayscale}%) sepia(${el.filters.sepia}%)`;
      }
      ctx.drawImage(img, 0, 0, el.width, el.height);
    } catch {
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(0, 0, el.width, el.height);
    }
  } else if (el.type === 'text') {
    const fontSize = el.fontSize || 24;
    const fontWeight = el.fontWeight || 400;
    const fontStyle = el.fontStyle || 'normal';
    const fontFamily = el.fontFamily || 'DM Sans';
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
    ctx.fillStyle = el.color || '#0F172A';
    ctx.textBaseline = 'top';

    const rawText = el.textTransform === 'uppercase' ? (el.text || '').toUpperCase() : (el.text || '');
    const lines = wrapTextLines(ctx, rawText, el.width);
    const lineHeightPx = fontSize * (el.lineHeight || 1.25);

    if (el.textEffect === 'shadow') {
      ctx.shadowColor = 'rgba(15, 23, 42, 0.25)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
    }

    lines.forEach((line, idx) => {
      const metrics = ctx.measureText(line);
      let tx = 0;
      if (el.textAlign === 'center') tx = (el.width - metrics.width) / 2;
      if (el.textAlign === 'right') tx = el.width - metrics.width;
      ctx.fillText(line, tx, idx * lineHeightPx);
    });
  } else if (el.type === 'chart' && el.chartData) {
    drawRoundedRectPath(ctx, 0, 0, el.width, el.height, 12);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(el.chartTitle || 'Metrics Chart', 24, 24);

    if (el.chartKind === 'pie' || el.chartKind === 'donut') {
      const total = el.chartData.reduce((acc, d) => acc + Math.max(0, d.value), 0) || 1;
      const chartCx = el.width * 0.34;
      const chartCy = el.height * 0.56;
      const r = Math.min(el.width, el.height) * 0.28;
      let angle = -Math.PI / 2;
      el.chartData.forEach((d) => {
        const sweep = (Math.max(0, d.value) / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(chartCx, chartCy);
        ctx.arc(chartCx, chartCy, r, angle, angle + sweep);
        ctx.closePath();
        ctx.fillStyle = d.color || el.fill || '#0F766E';
        ctx.fill();
        angle += sweep;
      });
      if (el.chartKind === 'donut') {
        ctx.beginPath();
        ctx.arc(chartCx, chartCy, r * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }
    } else if (el.chartKind === 'line') {
      const maxVal = Math.max(...el.chartData.map((d) => d.value), 1);
      const areaX = 36;
      const areaY = 76;
      const areaW = el.width - 72;
      const areaH = el.height - 130;
      ctx.beginPath();
      el.chartData.forEach((d, idx) => {
        const px =
          el.chartData!.length === 1
            ? areaX + areaW / 2
            : areaX + (idx / (el.chartData!.length - 1)) * areaW;
        const py = areaY + areaH - (Math.max(0, d.value) / maxVal) * areaH;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = el.fill || '#2563EB';
      ctx.lineWidth = 4;
      ctx.stroke();
    } else {
      const maxVal = Math.max(...el.chartData.map((d) => d.value), 1);
      const areaX = 36;
      const areaY = 76;
      const areaW = el.width - 72;
      const areaH = el.height - 130;
      const barGap = 24;
      const barW = (areaW - barGap * (el.chartData.length - 1)) / el.chartData.length;

      el.chartData.forEach((d, idx) => {
        const h = (d.value / maxVal) * areaH;
        const bx = areaX + idx * (barW + barGap);
        const by = areaY + (areaH - h);
        drawRoundedRectPath(ctx, bx, by, barW, h, 6);
        ctx.fillStyle = d.color || el.fill || '#0F766E';
        ctx.fill();

        ctx.fillStyle = '#475569';
        ctx.font = '500 14px "DM Sans", sans-serif';
        ctx.fillText(d.label, bx, areaY + areaH + 14);
      });
    }
  } else if (el.type === 'qrcode') {
    ctx.fillStyle = el.fill || '#FFFFFF';
    ctx.fillRect(0, 0, el.width, el.height);
    ctx.fillStyle = el.color || '#0F172A';
    const cells = 9;
    const pad = el.width * 0.1;
    const cellSize = (el.width - pad * 2) / cells;
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        const isFinder = (r < 3 && c < 3) || (r < 3 && c >= cells - 3) || (r >= cells - 3 && c < 3);
        const hash = ((r * 13 + c * 7 + (el.qrValue?.length || 5)) % 3) === 0;
        if (isFinder || hash) {
          ctx.fillRect(pad + c * cellSize, pad + r * cellSize, cellSize - 1, cellSize - 1);
        }
      }
    }
  } else if (el.type === 'path' && el.svgPath) {
    const p = new Path2D(el.svgPath);
    ctx.scale(el.width / (el.viewBoxWidth || el.width), el.height / (el.viewBoxHeight || el.height));
    ctx.strokeStyle = el.stroke || '#0F172A';
    ctx.lineWidth = el.strokeWidth || 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(p);
  } else if (el.type === 'table' && el.tableRows) {
    drawRoundedRectPath(ctx, 0, 0, el.width, el.height, 10);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const rows = el.tableRows;
    const cols = rows[0]?.length || 1;
    const rowH = el.height / Math.max(1, rows.length);
    const colW = el.width / cols;
    rows.forEach((row, rIdx) => {
      if (rIdx === 0) {
        ctx.fillStyle = el.tableHeaderBg || el.fill || '#0F172A';
        ctx.fillRect(0, 0, el.width, rowH);
      }
      row.forEach((cell, cIdx) => {
        ctx.fillStyle = rIdx === 0 ? '#FFFFFF' : '#1E293B';
        ctx.font = `${rIdx === 0 ? 600 : 400} 13px "DM Sans", sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillText(cell, cIdx * colW + 10, rIdx * rowH + rowH / 2);
      });
    });
  } else if (el.type === 'form') {
    drawRoundedRectPath(ctx, 0, 0, el.width, el.height, 14);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#0F172A';
    ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(el.formTitle || el.name, 20, 32);
    ctx.fillStyle = el.fill || '#0F172A';
    drawRoundedRectPath(ctx, 20, el.height - 52, el.width - 40, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 13px "DM Sans", sans-serif';
    ctx.fillText(el.formCta || 'Submit', 36, el.height - 30);
  } else if (el.type === 'graphic' && el.graphicSvgPath) {
    const p = new Path2D(el.graphicSvgPath);
    ctx.scale(el.width / 100, el.height / 100);
    if (el.graphicVariant === 'svg-stroke' || (el.strokeWidth || 0) > 0) {
      ctx.strokeStyle = el.stroke || el.fill || '#0F766E';
      ctx.lineWidth = el.strokeWidth || 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(p);
    } else {
      ctx.fillStyle = el.fill || '#0F766E';
      ctx.fill(p);
    }
  } else if (el.type === 'graphic' || el.type === 'media') {
    drawRoundedRectPath(ctx, 0, 0, el.width, el.height, 16);
    ctx.fillStyle = el.fill || '#0F766E';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(el.name, 16, el.height / 2 + 5);
  } else if (el.type === 'grid') {
    const cols = el.gridCols || 2;
    const rows = el.gridRows || 2;
    const gap = 8;
    const cellW = (el.width - gap * (cols + 1)) / cols;
    const cellH = (el.height - gap * (rows + 1)) / rows;
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRectPath(ctx, 0, 0, el.width, el.height, 12);
    ctx.fill();
    for (let i = 0; i < cols * rows; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const cx0 = gap + c * (cellW + gap);
      const cy0 = gap + r * (cellH + gap);
      const src = el.gridImages?.[i];
      if (src) {
        try {
          const img = await loadImage(src);
          ctx.save();
          drawRoundedRectPath(ctx, cx0, cy0, cellW, cellH, 8);
          ctx.clip();
          ctx.drawImage(img, cx0, cy0, cellW, cellH);
          ctx.restore();
        } catch {
          ctx.fillStyle = '#2563EB';
          ctx.fillRect(cx0, cy0, cellW, cellH);
        }
      }
    }
  } else if ((el.type === 'frame' || el.type === 'mockup') && el.src) {
    try {
      const img = await loadImage(el.src);
      drawRoundedRectPath(ctx, 0, 0, el.width, el.height, el.frameKind === 'circle' ? el.width / 2 : 16);
      ctx.clip();
      ctx.drawImage(img, 0, 0, el.width, el.height);
    } catch {
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(0, 0, el.width, el.height);
    }
  }

  ctx.restore();
}

export function exportPageAsSvg(design: DesignProject, page: DesignPage): string {
  const items = page.elements
    .filter((el) => !el.hidden)
    .map((el) => {
      const transform = `translate(${el.x}, ${el.y}) rotate(${el.rotation || 0} ${el.width / 2} ${el.height / 2})`;
      if (el.type === 'shape') {
        if (el.shapeKind === 'circle') {
          return `<ellipse cx="${el.width / 2}" cy="${el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${el.fill || '#0F766E'}" opacity="${el.opacity}" transform="${transform}" />`;
        }
        return `<rect width="${el.width}" height="${el.height}" rx="${el.borderRadius || 0}" fill="${el.fill || '#0F766E'}" stroke="${el.stroke || 'none'}" stroke-width="${el.strokeWidth || 0}" opacity="${el.opacity}" transform="${transform}" />`;
      }
      if (el.type === 'text') {
        const escaped = (el.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
        return `<text x="0" y="${el.fontSize || 24}" font-family="${el.fontFamily || 'DM Sans'}" font-size="${el.fontSize || 24}" font-weight="${el.fontWeight || 400}" fill="${el.color || '#0F172A'}" opacity="${el.opacity}" transform="${transform}">${escaped}</text>`;
      }
      if (el.type === 'path' && el.svgPath) {
        return `<path d="${el.svgPath}" fill="none" stroke="${el.stroke || '#0F172A'}" stroke-width="${el.strokeWidth || 4}" stroke-linecap="round" opacity="${el.opacity}" transform="${transform}" />`;
      }
      return '';
    })
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${design.width}" height="${design.height}" viewBox="0 0 ${design.width} ${design.height}">
  <rect width="100%" height="100%" fill="${page.backgroundColor || '#FFFFFF'}" />
  ${items}
</svg>`;
}

export function triggerFileDownload(href: string, filename: string) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
