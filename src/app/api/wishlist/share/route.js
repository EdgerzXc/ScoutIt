import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { encryptUserId } from "@/lib/wishlistCrypto";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";

// A-146: token mint + revoke are authed but effectively free to loop. One
// shared 10/min/IP ceiling for both verbs — minting is rare, revoking rarer.
const checkShareRate = createRateLimiter({ limit: 10, windowMs: 60_000, maxKeys: 20_000 });

function shareLimited(request, action) {
  const rate = checkShareRate(clientIp(request));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Too many share-link ${action}. Please wait and try again.` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }
  return null;
}

async function requireShareOwner(request) {
  const userId = await resolveUserId(request);
  if (!userId) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!supabaseAdmin) {
    return { response: NextResponse.json({ error: "Share links are unavailable" }, { status: 503 }) };
  }
  return { userId };
}

export async function POST(request) {
  try {
    const limited = shareLimited(request, "requests");
    if (limited) return limited;
    const auth = await requireShareOwner(request);
    if (auth.response) return auth.response;

    const { data, error } = await supabaseAdmin
      .from("wishlist_share_revocations")
      .select("revoked_before")
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (error) {
      console.error("[WISHLIST SHARE] Revocation lookup failed:", error.message);
      return NextResponse.json({ error: "Share links are unavailable" }, { status: 503 });
    }

    const revokedAt = data?.revoked_before ? new Date(data.revoked_before).getTime() : 0;
    const issuedAt = Math.max(Date.now(), Number.isFinite(revokedAt) ? revokedAt + 1 : 0);
    const shareToken = encryptUserId(auth.userId, { issuedAt });

    return NextResponse.json({ success: true, shareToken });
  } catch (error) {
    console.error("[WISHLIST SHARE] Mint failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const limited = shareLimited(request, "changes");
    if (limited) return limited;
    const auth = await requireShareOwner(request);
    if (auth.response) return auth.response;

    const revokedBefore = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("wishlist_share_revocations")
      .upsert({
        user_id: auth.userId,
        revoked_before: revokedBefore,
        updated_at: revokedBefore,
      }, { onConflict: "user_id" });

    if (error) {
      console.error("[WISHLIST SHARE] Revocation failed:", error.message);
      return NextResponse.json({ error: "Could not deactivate shared links" }, { status: 500 });
    }

    return NextResponse.json({ success: true, revokedBefore });
  } catch (error) {
    console.error("[WISHLIST SHARE] Revocation failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}