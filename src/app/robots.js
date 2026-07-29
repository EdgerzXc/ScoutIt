import { siteUrl } from "@/lib/siteUrl";

export default function robots() {
  const baseUrl = siteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/profile/",
          "/settings/",
          "/wishlist/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
