import { siteUrl } from "@/lib/siteUrl";

export const metadata = {
  title: "Platform Tour & Guidebook 101 | ScoutIt Space Intelligence",
  description:
    "Inspect ScoutIt's 10-layer 3D spatial radar, dual-CMS publishing pipeline, RESA RA 9646 VIA attribution, and people & dealings CRM.",
  alternates: {
    canonical: siteUrl("/layer/mantle/tour"),
  },
  openGraph: {
    title: "Platform Tour & Guidebook 101 | ScoutIt Space Intelligence",
    description:
      "Inspect ScoutIt's 10-layer 3D spatial radar, dual-CMS publishing pipeline, RESA RA 9646 VIA attribution, and people & dealings CRM.",
    url: siteUrl("/layer/mantle/tour"),
    siteName: "ScoutIt",
    locale: "en_PH",
    type: "website",
  },
};

export default function PlatformTourLayout({ children }) {
  return children;
}
