import { siteUrl } from "@/lib/siteUrl";

export default function robots() {
  const baseUrl = siteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Prefix form, deliberately: "/dashboard/" would NOT block the bare
        // "/dashboard" route per crawler prefix rules, and every path here is
        // private (off-market is authenticated entitled inventory).
        disallow: [
          "/api/",
          "/admin",
          "/dashboard",
          "/profile",
          "/settings",
          "/wishlist",
          "/off-market",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
