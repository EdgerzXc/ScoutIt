const VARIANT_GLOW = {
  dashboard: { "--glow-x": "88%", "--glow-y": "-8%" },
  hero: { "--glow-x": "50%", "--glow-y": "-10%" },
  default: { "--glow-x": "88%", "--glow-y": "-8%" },
};

/**
 * Layered dark/gold ambient background (base tone + gold light source + vignette).
 * Purely decorative — drop it as the first child of a `position: relative` wrapper.
 * `variant` repositions the glow so it reads as sourced from a natural corner
 * per screen (see globals.css .atmosphere-bg for the layer definitions).
 */
export default function AtmosphereBackground({ variant = "default" }) {
  const style = VARIANT_GLOW[variant] || VARIANT_GLOW.default;
  return <div className="atmosphere-bg" style={style} aria-hidden="true" />;
}
