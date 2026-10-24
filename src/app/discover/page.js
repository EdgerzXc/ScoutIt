import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  alternates: { canonical: "/property" },
  title: "Space Directory",
  description:
    "Browse intelligent property briefings across major Philippine hubs. Filter by city and structural specifications.",
};

export default async function DiscoverPage({ searchParams }) {
  const resolvedParams = searchParams ? await searchParams : {};
  const qs = new URLSearchParams();
  if (resolvedParams && typeof resolvedParams === "object") {
    for (const [k, v] of Object.entries(resolvedParams)) {
      if (typeof v === "string" && v) qs.set(k, v);
    }
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  redirect(`/property${suffix}`);
}
