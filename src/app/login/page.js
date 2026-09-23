import { redirect } from "next/navigation";
import { normalizePrivateReturnPath } from "@/lib/authReturnPath";

// Legacy entry: /login is a stub for /onboarding. A saved or linked
// /login?next=/dashboard/inbox URL must still land correctly instead of
// dropping the deep link (the stub previously ignored its query entirely).
export default async function LoginPage({ searchParams }) {
  const sp = searchParams ? await searchParams : null;
  const raw = sp?.next;
  const next = Array.isArray(raw) ? raw[0] : raw;
  if (!next) redirect("/onboarding");
  redirect(`/onboarding?next=${encodeURIComponent(normalizePrivateReturnPath(next))}`);
}
