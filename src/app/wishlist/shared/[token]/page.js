import { decryptUserId } from "@/lib/wishlistCrypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchProperties } from "@/lib/airtable";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import { notFound } from "next/navigation";
import { ReactionBadge } from "@/components/ui/ReactionButtons";
import "./shared-board.css";

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

    </div>
  );
}
