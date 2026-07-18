// Branded fallback for cards/articles that have no image yet. Fills its
// container with a deep-black + gold-glow surface and a "space" glyph so an
// imageless listing still reads as intentional ScoutIt design — never a broken
// black void. Pass the image's own class via `className` so it inherits the
// same sizing as the <img> it replaces.
//
// `minimal` renders just the branded surface with no glyph/label — use it for
// overlay-style cards where content already sits on top of the image slot (so a
// centred glyph would collide with the text).
export default function ImagePlaceholder({ className = "", label = "ScoutIt", minimal = false }) {
  return (
    <div
      className={`scoutit-img-ph ${className}`.trim()}
      role="img"
      aria-label={`${label} — image coming soon`}
    >
      {!minimal && (
        <>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 21h18" />
            <path d="M5 21V8l7-5 7 5v13" />
            <path d="M9 21v-6h6v6" />
          </svg>
          <span className="scoutit-img-ph-text">Image coming soon</span>
        </>
      )}
    </div>
  );
}
