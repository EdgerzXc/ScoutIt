/** Browser-only credit check, including the pill's opacity over map imagery. */
export function auditMapCreditContrast(selector = ".spatial-canvas-root .map-credit") {
  const credit = document.querySelector(selector);
  if (!credit) throw new Error(`Map credit not found: ${selector}`);
  const parse = (value) => {
    const parts = value.match(/[\d.]+/g).map(Number);
    return [...parts.slice(0, 3), parts[3] ?? 1];
  };
  const over = (front, back) => front.slice(0, 3).map((value, i) =>
    value * front[3] + back[i] * (1 - front[3])
  );
  const luminance = (rgb) => rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
  };
  const style = getComputedStyle(credit);
  const fill = parse(style.backgroundColor);
  const opacity = Number(style.opacity);
  const samples = [credit, ...credit.querySelectorAll("a")].map((element) => {
    const ink = parse(getComputedStyle(element).color);
    // Black/white bound the photographic backdrop. Our current neutral fill
    // and ink stay on the same side of each other throughout this range.
    const minimumRatio = Math.min(...[0, 255].map((value) => {
      const backdrop = [value, value, value];
      const localBackground = over(fill, backdrop);
      const background = over([...localBackground, opacity], backdrop);
      const foreground = over([...over(ink, localBackground), opacity], backdrop);
      return ratio(foreground, background);
    }));
    return {
      label: element === credit ? "contributor text" : element.textContent,
      minimumRatio: Number(minimumRatio.toFixed(2)),
      required: 4.5,
    };
  });
  // A parent fade is not the settled map presentation this check certifies.
  let settled = true;
  for (let parent = credit.parentElement; parent; parent = parent.parentElement) {
    if (Number(getComputedStyle(parent).opacity) < 0.999) settled = false;
  }
  return { checked: samples.length, settled, opacity, samples,
    failures: samples.filter((sample) => sample.minimumRatio < sample.required) };
}
