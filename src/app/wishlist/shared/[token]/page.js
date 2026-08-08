import { decryptUserId } from "@/lib/wishlistCrypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchProperties } from "@/lib/airtable";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import { notFound } from "next/navigation";
import { ReactionBadge } from "@/components/ui/ReactionButtons";

// A tokenised share link is private by construction — it should never be
// indexed. It was previously inheriting `canonical: "/wishlist"` from the
// parent layout, which is both wrong and no protection against a crawler that
// finds the token in a referrer or a pasted link.
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function SharedWishlistPage({ params }) {
  const { token } = await params;

  // Tokens are minted by /api/wishlist/share via the same module, so this is
  // the only decode path. A null result means the token wasn't signed by this
  // server — wrong shape, tampered with, or the secret is missing — and all of
  // those should look identical to a visitor.
  const userId = decryptUserId(token);
  if (!userId) {
    return notFound();
  }

  // Fetch saved_intel for this user
  const { data: savedItems, error } = await supabaseAdmin
    .from("saved_intel")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !savedItems || savedItems.length === 0) {
    return (
      <div className="page-wrapper">
        <AtmosphereBackground variant="default" />
        <Header />
        <main className="wishlist-main">
          <header className="page-header">
            <span className="layer-label">LAYER 06 // SHARED BOARD</span>
            <h1 className="page-title">Shared Board</h1>
          </header>
          <div className="empty-state" style={{ padding: "120px 0", textAlign: "center" }}>
            <div className="empty-heading" style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "#f0ede8" }}>This board is empty.</div>
          </div>
        </main>
        <Footer />
        <style>{`
          .page-wrapper { min-height: 100vh; background: #0e0e0e; color: #f0ede8; position: relative; }
          .wishlist-main { max-width: 900px; margin: 0 auto; padding: 120px 24px 80px; position: relative; z-index: 1; }
          .page-header { margin-bottom: 48px; }
          .layer-label { display: block; font-family: system-ui, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #E8AE3C; margin-bottom: 16px; }
          .page-title { font-family: var(--font-display); font-size: 40px; font-weight: normal; color: #f0ede8; margin: 0; }
        `}</style>
      </div>
    );
  }

  // Fetch properties to get titles/cities
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const allProperties = await fetchProperties(apiKey, baseId);
  const propMap = Object.fromEntries(allProperties.map(p => [p.id, p]));

  const enrichedItems = savedItems.map(item => {
    const prop = propMap[item.property_id];
    return {
      timestamp: new Date(item.created_at).getTime(),
      property_id: item.property_id,
      property_title: prop?.title || "Unknown Property",
      city: prop?.city || "",
      category: prop?.spaceCategory || "",
      reaction_type: item.reaction_type,
      is_broker: false // Simplifying for shared view
    };
  });

  const REACTION_ORDER = ["Potential Fit", "Interested", "Inspired Me", "Save"];
  const grouped = REACTION_ORDER.map((type) => ({
    type,
    items: enrichedItems.filter((item) => item.reaction_type === type),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="page-wrapper">
      <AtmosphereBackground variant="default" />
      <Header />
      <main className="wishlist-main">
        <header className="page-header">
          <span className="layer-label">LAYER 06 // SHARED BOARD</span>
          <h1 className="page-title">Shared Board</h1>
          <p style={{ marginTop: 16, color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: 14 }}>
            Viewing a curated collection of properties.
          </p>
        </header>

        <div className="board-content">
          {grouped.map((group) => (
            <section key={group.type} className="reaction-group">
              <h2 className="group-label">{group.type}</h2>
              <div className="cards-grid">
                {group.items.map((item) => (
                  <div key={item.timestamp} className="board-card">
                    <div className="badge-corner">
                      <ReactionBadge reactionType={item.reaction_type} />
                    </div>
                    <div className="card-body">
                      <Link href={`/property/${encodeURIComponent(item.property_id)}`} style={{ textDecoration: "none" }}>
                        <h3 className="card-title">{item.property_title}</h3>
                      </Link>
                      <div className="card-meta">
                        {item.city && <span>{item.city}</span>}
                        {item.category && !item.is_broker && (
                          <>
                            <span className="meta-dot">·</span>
                            <span>{item.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="card-actions">
                      <span className="reaction-badge">{item.reaction_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />

      <style>{`
        .page-wrapper { min-height: 100vh; background: var(--bg); color: var(--text-primary); position: relative; }
        .wishlist-main { max-width: 900px; margin: 0 auto; padding: 120px 24px 80px; position: relative; z-index: 1; }
        .page-header { margin-bottom: 48px; }
        .layer-label { display: block; font-family: system-ui, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: var(--accent); margin-bottom: 16px; }
        .page-title { font-family: var(--font-display); font-size: 40px; font-weight: normal; color: var(--text-primary); margin: 0; }
        .board-content { display: flex; flex-direction: column; gap: 40px; }
        .reaction-group { display: flex; flex-direction: column; gap: 12px; }
        .group-label { font-family: system-ui, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: var(--accent); margin: 0 0 4px; padding-bottom: 8px; border-bottom: 1px solid var(--border-solid); }
        .cards-grid { display: flex; flex-direction: column; gap: 8px; }
        .board-card { display: flex; align-items: center; justify-content: space-between; background: var(--surface2); border: 1px solid var(--border); padding: 16px 20px; transition: opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; position: relative; }
        .board-card:hover { transform: translateY(-3px); border-color: rgba(var(--accent-rgb), 0.3); box-shadow: var(--shadow-md), var(--shadow-glow-soft); }
        .badge-corner { position: absolute; top: -8px; right: -8px; z-index: 10; }
        .card-body { flex: 1; min-width: 0; }
        .card-title { font-family: var(--font-display); font-size: 20px; font-weight: 400; color: var(--text-primary); margin: 0 0 4px; transition: color 0.2s ease; }
        .card-title:hover { color: var(--accent); }
        .card-meta { font-family: system-ui, sans-serif; font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; }
        .meta-dot { color: var(--text-muted); }
        .card-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .reaction-badge { font-family: system-ui, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); border: 1px solid rgba(var(--accent-rgb), 0.3); padding: 4px 10px; white-space: nowrap; }
      `}</style>
    </div>
  );
}
