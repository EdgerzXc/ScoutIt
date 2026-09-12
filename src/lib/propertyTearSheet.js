import { MARK_PATH, MARK_VIEWBOX } from '@/components/brand/markPath';

function cssColorTuple(variableName, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  const match = /^#([0-9a-f]{6})$/i.exec(raw);
  if (!match) return fallback;

  return [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16));
}

/**
 * The mark as a PNG data URL, for jsPDF's addImage.
 *
 * jsPDF cannot draw SVG paths without a plugin, and bundling a pre-rendered
 * PNG would ship ~5kb of base64 to every visitor for a button most never
 * press. Rasterising here costs nothing until the download is actually
 * requested, and renders at 4x so the mark stays crisp when the PDF is
 * zoomed or printed.
 *
 * Returns null rather than throwing: a tear sheet without the mark is still a
 * usable tear sheet, so a canvas failure must not lose the user their download.
 */
async function renderMarkPng(fill, size = 256) {
  try {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}">` +
      `<path fill="${fill}" fill-rule="evenodd" d="${MARK_PATH}"/></svg>`;
    const url = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.getContext('2d').drawImage(image, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

function safeFilenamePart(value) {
  return String(value || 'Property')
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '') || 'Property';
}

function visibleText(element, selector, fallback = '') {
  return element.querySelector(selector)?.textContent?.trim() || fallback;
}

export async function downloadPropertyTearSheet({ element, title }) {
  if (!element) return false;

  const { jsPDF } = await import('jspdf');
  const documentTitle = String(title || visibleText(element, '.hero-title', 'ScoutIt Property')).trim();
  const location = visibleText(element, '.hero-location', 'Philippines');
  const hook = visibleText(element, '.hero-hook', 'A verified ScoutIt space briefing.');
  const briefLabel = visibleText(element, '.hero-label', 'ScoutIt · Space Intelligence');
  const canonicalUrl = `${window.location.origin}${window.location.pathname}`;

  const background = cssColorTuple('--bg', [13, 13, 13]);
  const accent = cssColorTuple('--accent', [232, 174, 60]);
  const primary = cssColorTuple('--text-primary', [245, 241, 232]);
  const secondary = cssColorTuple('--text-secondary', [178, 171, 157]);

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'letter',
    compress: true,
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setFillColor(...background);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  pdf.setDrawColor(...accent);
  pdf.setLineWidth(1.25);
  pdf.line(52, 56, pageWidth - 52, 56);

  const markPng = await renderMarkPng(`rgb(${accent.join(",")})`);
  const MARK_PT = 26;
  if (markPng) pdf.addImage(markPng, 'PNG', 52, 20, MARK_PT, MARK_PT);
  const eyebrowX = markPng ? 52 + MARK_PT + 12 : 52;

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  pdf.setCharSpace(2.2);
  pdf.setTextColor(...accent);
  pdf.text(briefLabel.toUpperCase(), eyebrowX, 42);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(32);
  pdf.setCharSpace(0);
  pdf.setTextColor(...primary);
  const titleLines = pdf.splitTextToSize(documentTitle.toUpperCase(), pageWidth - 104).slice(0, 3);
  pdf.text(titleLines, 52, 126);

  const titleBottom = 126 + Math.max(0, titleLines.length - 1) * 38;
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(11);
  pdf.setCharSpace(1.4);
  pdf.setTextColor(...accent);
  pdf.text(location.toUpperCase(), 52, titleBottom + 40);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(15);
  pdf.setCharSpace(0);
  pdf.setTextColor(...secondary);
  const hookLines = pdf.splitTextToSize(hook, pageWidth - 104).slice(0, 6);
  pdf.text(hookLines, 52, titleBottom + 88);

  pdf.setDrawColor(...accent);
  pdf.setLineWidth(0.5);
  pdf.line(52, pageHeight - 72, pageWidth - 52, pageHeight - 72);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...secondary);
  pdf.text(canonicalUrl, 52, pageHeight - 48);
  pdf.text('SCOUTIT · SPACE INTELLIGENCE', pageWidth - 52, pageHeight - 48, { align: 'right' });

  pdf.save(`ScoutIt_${safeFilenamePart(documentTitle)}.pdf`);
  return true;
}
