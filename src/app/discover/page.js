import DiscoverClient from "./DiscoverClient";
import Header from "@/components/layout/Header";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Discover",
  description:
    "Browse intelligent property briefings across major Philippine hubs. Filter by city and structural specifications.",
};

export default function DiscoverPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div style={{ padding: '60px', color: 'var(--accent)', background: 'var(--bg)', height: '100dvh', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>Loading Discovery Engine Matrix...</div>}>
        <DiscoverClient />
      </Suspense>
    </>
  );
}
