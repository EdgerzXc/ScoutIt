import ChapterSubtitle from "@/components/property/ChapterSubtitle";

export default function PropertyChapterHeader({
  chapterNumber,
  chapterLabel,
  subtitle,
}) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--text-muted)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "6px",
        }}
      >
        {chapterNumber} · {chapterLabel}
      </div>
      <ChapterSubtitle text={subtitle} />
      <div style={{ height: "1px", background: "var(--border)" }} />
    </div>
  );
}
