import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchProperties } from "@/lib/airtable";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import { notFound } from "next/navigation";
import { ReactionBadge } from "@/components/ui/ReactionButtons";

const SECRET_KEY = process.env.WISHLIST_SHARE_SECRET || "scoutit_wishlist_share_default_k"; 

const getEncryptionKey = () => {
  const key = Buffer.from(SECRET_KEY, "utf-8");
  if (key.length === 32) return key;
  const hash = crypto.createHash("sha256");
  hash.update(SECRET_KEY);
  return hash.digest();
};

export default async function SharedWishlistPage({ params }) {
  const token = params.token;
  
  let userId = null;
  try {
    const payloadBuffer = Buffer.from(token, "base64url").toString("utf-8");
    const [ivStr, authTagStr, encryptedStr] = payloadBuffer.split(":");
    
    if (!ivStr || !authTagStr || !encryptedStr) throw new Error("Invalid token format");
    
    const iv = Buffer.from(ivStr, "base64");
    const authTag = Buffer.from(authTagStr, "base64");
    
    const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedStr, "base64", "utf8");
    decrypted += decipher.final("utf8");
    
    const data = JSON.parse(decrypted);
    // eslint-disable-next-line react-hooks/purity
    if (data.exp && Date.now() > data.exp) {
      throw new Error("Token expired");
    }
    userId = data.userId;
  } catch (err) {
    console.error("[WISHLIST DECRYPT ERROR]", err);
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
            <span className="layer-label">LAYER 04 // SHARED BOARD</span>
            <h1 className="page-title">Shared Board</h1>
          </header>
          <div className="empty-state" style={{ padding: "120px 0", textAlign: "center" }}>
            <div className="empty-heading" style={{ fontFamily: "Georgia, serif", fontSize: 32, color: "#f0ede8" }}>This board is empty.</div>
          </div>
        </main>
        <Footer />
        <style>{`
          .page-wrapper { min-height: 100vh; background: #0e0e0e; color: #f0ede8; position: relative; }
          .wishlist-main { max-width: 900px; margin: 0 auto; padding: 120px 24px 80px; position: relative; z-index: 1; }
          .page-header { margin-bottom: 48px; }
          .layer-label { display: block; font-family: system-ui, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #E8AE3C; margin-bottom: 16px; }
          .page-title { font-family: Georgia, serif; font-size: 40px; font-weight: normal; color: #f0ede8; margin: 0; }
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
          <span className="layer-label">LAYER 04 // SHARED BOARD</span>
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
        .page-wrapper { min-height: 100vh; background: #0e0e0e; color: #f0ede8; position: relative; }
        .wishlist-main { max-width: 900px; margin: 0 auto; padding: 120px 24px 80px; position: relative; z-index: 1; }
        .page-header { margin-bottom: 48px; }
        .layer-label { display: block; font-family: system-ui, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #E8AE3C; margin-bottom: 16px; }
        .page-title { font-family: Georgia, serif; font-size: 40px; font-weight: normal; color: #f0ede8; margin: 0; }
        .board-content { display: flex; flex-direction: column; gap: 40px; }
        .reaction-group { display: flex; flex-direction: column; gap: 12px; }
        .group-label { font-family: system-ui, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #E8AE3C; margin: 0 0 4px; padding-bottom: 8px; border-bottom: 1px solid #262626; }
        .cards-grid { display: flex; flex-direction: column; gap: 8px; }
        .board-card { display: flex; align-items: center; justify-content: space-between; background: linear-gradient(165deg, #1a1917, #111110); border: 1px solid rgba(255, 255, 255, 0.08); padding: 16px 20px; transition: opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; position: relative; }
        .board-card:hover { transform: translateY(-3px); border-color: rgba(232, 174, 60, 0.3); box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45), 0 0 24px rgba(232, 174, 60, 0.18); }
        .badge-corner { position: absolute; top: -8px; right: -8px; z-index: 10; }
        .card-body { flex: 1; min-width: 0; }
        .card-title { font-family: Georgia, serif; font-size: 20px; font-weight: 500; color: #f0ede8; margin: 0 0 4px; transition: color 0.2s ease; }
        .card-title:hover { color: #E8AE3C; }
        .card-meta { font-family: system-ui, sans-serif; font-size: 12px; color: #c8c8c8; display: flex; align-items: center; gap: 4px; }
        .meta-dot { color: #444; }
        .card-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .reaction-badge { font-family: system-ui, sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #E8AE3C; border: 1px solid rgba(232, 174, 60, 0.3); padding: 4px 10px; white-space: nowrap; }
      `}</style>
    </div>
  );
}
