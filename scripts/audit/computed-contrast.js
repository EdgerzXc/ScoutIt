/** Run inside a browser page. No server or Node dependencies. */
export function auditVisibleText(rootSelector = "body") {
  const root = document.querySelector(rootSelector);
  if (!root) throw new Error(`Contrast audit root not found: ${rootSelector}`);

  const parseColor = (value) => {
    const parts = value?.match(/[\d.]+/g)?.map(Number);
    if (!parts || parts.length < 3) return null;
    return [parts[0], parts[1], parts[2], parts[3] ?? 1];
  };
  const over = (front, back) => front.slice(0, 3).map((part, i) =>
    part * front[3] + back[i] * (1 - front[3])
  );
  const luminance = (color) => {
    const [r, g, b] = color.map((part) => {
      const value = part / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
  };
  const styles = new Map();
  const styleOf = (element) => {
    if (!styles.has(element)) styles.set(element, getComputedStyle(element));
    return styles.get(element);
  };
  const paintedBackground = (element) => {
    const ancestors = [];
    for (let current = element; current; current = current.parentElement) ancestors.push(current);
    let color = [255, 255, 255]; // transparent canvas defaults to the browser's white
    let image = false;
    for (const ancestor of ancestors.reverse()) {
      const style = styleOf(ancestor);
      const layer = parseColor(style.backgroundColor);
      if (layer) {
        color = over(layer, color);
        if (layer[3] >= 0.999) image = false; // an opaque child covers an ancestor's image
      }
      if (style.backgroundImage !== "none") image = true;
    }
    return { color, image };
  };
  const isVisible = (node) => {
    for (let element = node.parentElement; element; element = element.parentElement) {
      const style = styleOf(element);
      if (style.display === "none" || style.visibility !== "visible" ||
          Number(style.opacity) <= 0.01 || element.getAttribute("aria-hidden") === "true") return false;
    }
    const range = document.createRange();
    range.selectNodeContents(node);
    return [...range.getClientRects()].some((rect) => rect.width > 1 && rect.height > 1);
  };

  let checked = 0;
  let uncertain = 0;
  const failures = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.replace(/\s+/g, " ").trim();
    const element = node.parentElement;
    if (!text || !element || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(element.tagName) ||
        !isVisible(node)) continue;
    const style = styleOf(element);
    const background = paintedBackground(element);
    if (background.image || style.filter !== "none" || style.mixBlendMode !== "normal") {
      uncertain += 1;
      continue;
    }
    const ink = parseColor(style.color);
    if (!ink) {
      uncertain += 1;
      continue;
    }
    const foreground = over(ink, background.color);
    const size = Number.parseFloat(style.fontSize);
    const weight = Number.parseInt(style.fontWeight, 10) || 400;
    // WCAG's 18pt / bold 14pt thresholds are 24px / about 18.67px.
    const required = size >= 24 || (size >= 18.67 && weight >= 700) ? 3 : 4.5;
    const measured = contrast(foreground, background.color);
    checked += 1;
    if (measured + 0.001 < required) {
      const selector = element.tagName.toLowerCase() +
        (element.id ? `#${element.id}` : "") +
        [...element.classList].slice(0, 2).map((name) => `.${name}`).join("");
      failures.push({ text: text.slice(0, 90), selector, ratio: Number(measured.toFixed(2)),
        required, color: style.color, background: background.color.map(Math.round) });
    }
  }
  return { checked, uncertain, failures };
}
