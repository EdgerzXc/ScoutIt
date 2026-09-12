import HomeClient from "@/app/HomeClient";

/**
 * Server wrapper so the homepage can declare a canonical URL.
 *
 * The body is a client component and client components cannot export
 * metadata, so `/` shipped with no canonical tag at all. `scout-it.vercel.app`
 * served byte-identical content, Google had to pick a canonical itself, and it
 * picked the vercel.app copy - which is why a search for "scoutit" returned
 * the Vercel host above this domain, and why Search Console reported
 * "Duplicate without user-selected canonical".
 *
 * Same split /discover already uses: page.js is the server route, the client
 * body lives beside it.
 */
export const metadata = {
  alternates: { canonical: "/" },
};

export default function Page() {
  return <HomeClient />;
}
