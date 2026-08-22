import LegalDoc from "@/components/legal/LegalDoc";
import { CURRENT_TERMS_EFFECTIVE_DATE, CURRENT_TERMS_VERSION } from "@/lib/legalVersions";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How ScoutIt currently collects, uses, retains, and protects data during the invited pilot.",
};

const SECTIONS = [
  {
    num: "01",
    title: "Our privacy-first architecture",
    body: `ScoutIt ("ScoutIt," "we," "us," or "our") is an independently operated platform committed to protecting personal data. This Privacy Policy describes the collection, processing, storage, disclosure, and protection of personal data during the invited pilot, with reference to Republic Act No. 10173 and applicable National Privacy Commission guidance. It is not a claim of completed registration or legal certification.

ScoutIt is engineered around principles of data minimization and privacy-by-default. We collect personal data only to the extent strictly necessary to deliver spatial intelligence, secure platform interactions, and maintain account integrity. Public discovery, spatial browsing, and personal wishlist curation stay locally on your device by default.`,
  },
  {
    num: "02",
    title: "Personal data we collect",
    body: `We collect personal data through voluntary submission, platform usage, and account interactions:
— Basic Users / Seekers: Full name, email address, password hash, selected role identity, and platform communication preferences.
— Licensed Brokers: Professional Regulation Commission (PRC) License Number, PRC ID expiration date, Accredited Integrated Professional Organization (AIPO) membership details, brokerage affiliation, and professional identity documents.
— Service Providers (Photographers, Researchers, Event Planners): Portfolio media, verification credentials, professional bio, and service specialties.
— Submission and Telemetry Data: Property submission details, photos, spatial descriptions, geotagged bounty proofs, search filters, and interaction logs.

ScoutIt does not currently collect, process, or store payment-card or bank-account credentials. Subscription billing and Connect purchases are disabled during the invited pilot; no payment provider has been selected.`,
  },
  {
    num: "03",
    title: "On-device Ledger sovereignty",
    body: `Your private wishlist, tagged spaces, saved search categories, and collection boards ("The Ledger") are stored within your local web browser storage by default. ScoutIt servers do not inspect, extract, or log your Ledger until you voluntarily create an account and execute server synchronization.`,
  },
  {
    num: "04",
    title: "Ephemeral chat and retention rules",
    body: `Handshake Chat message contents are temporary. Closing a chat thread initiates a seven (7) day read-only operational retention window. Upon expiration of the 7-day window, message body text is permanently purged from active database storage, leaving non-message deal metadata (timestamps, participant IDs, status flags) for audit trails.

If a chat thread is flagged for harassment, fraudulent listing activity, or terms violations prior to purging, the message data is isolated under restricted access for Trust & Safety review until case resolution.`,
  },
  {
    num: "05",
    title: "Lawful bases for processing under DPA Section 12 & 13",
    body: `Pursuant to Section 12 and Section 13 of the DPA, ScoutIt processes personal data under the following lawful bases:
— Consent: You have given explicit consent upon account registration or voluntary submission.
— Contractual Necessity: Processing is required to execute the Terms of Service, manage account access, deliver Connects, and maintain platform features.
— Legitimate Interests: Processing is required to secure the Platform, detect fraudulent listings, prevent scrapers, and optimize spatial intelligence workflows.
— Legal Obligation: Processing is required to comply with Philippine statutory mandates, tax rules, or law enforcement orders.

We do not sell, rent, or trade your personal data to third parties for commercial marketing.`,
  },
  {
    num: "06",
    title: "Third-party service providers and cross-border data transfers",
    body: `To maintain edge infrastructure, mapping, database storage, and listing document extraction, ScoutIt shares minimal required personal data with trusted third-party service providers:

1. Vercel Inc. — Application Hosting & Edge Routing (United States / Global Edge) — Enterprise DPA, TLS 1.3 Encryption.
2. Supabase Inc. — Encrypted Cloud Database Infrastructure (AWS AP-Southeast Singapore) — AES-256 Encryption at Rest, PostgreSQL Row Level Security (RLS).
3. Mapbox Inc. — Geospatial Mapping & Geocoding APIs (United States / Global) — Anonymized Coordinate Telemetry.
4. Google LLC — Gemini Flash PDF Extraction AI Worker (United States / Global) — Transient API Data Processing Agreement.

Under Section 21 of the DPA (Accountability for Transfer) and NPC Circular 2023-06 (Security of Personal Data), ScoutIt enforces legal contracts with offshore processors ensuring data protection standards comparable to RA 10173.`,
  },
  {
    num: "07",
    title: "Security policies and sentinel defense",
    body: `ScoutIt implements technical, organizational, and physical security measures, including TLS 1.3 transit encryption, AES-256 storage encryption, database Row Level Security (RLS) policies, strict access controls, and rate-limiting sentinel security layers. While we maintain robust infrastructure controls, no electronic transmission is 100% secure; you share responsibility for safeguarding account login credentials.`,
  },
  {
    num: "08",
    title: "Data retention and PII-Detachment Purge rules",
    body: `Personal data is retained only for as long as necessary to fulfill account operations, satisfy legal obligations, or resolve active disputes.

Upon receiving a verified Data Subject Erasure Request under Section 09 of the DPA, ScoutIt executes a PII-Detachment Purge. Personally Identifiable Information (name, email, phone, PRC credentials) is permanently deleted from active account tables. To protect platform spatial history and ecosystem integrity, underlying non-personal spatial telemetry, derivative 3D Vault media, architectural intelligence, and historical transaction milestones are retained, with ownership attributed to an unlinked system archive.`,
  },
  {
    num: "09",
    title: "Your rights under the Philippine Data Privacy Act",
    body: `Under Chapter IV, Section 16 of RA 10173, you possess the following rights:
1. Right to be Informed: To know how your data is collected and processed.
2. Right to Access: To request reasonable access to personal data held by ScoutIt.
3. Right to Object: To withdraw consent to optional data processing.
4. Right to Rectification: To dispute and correct inaccurate or incomplete data.
5. Right to Erasure or Blocking: To request deletion or blocking of personal data upon lawful grounds.
6. Right to Data Portability: To obtain a copy of your personal data in a structured, electronic format.
7. Right to File a Complaint: To lodge a formal complaint with the National Privacy Commission (privacy.gov.ph) if your rights are violated.

To exercise any right, contact our Data Protection Officer as provided in Section 11.`,
  },
  {
    num: "10",
    title: "Minors protocol",
    body: `The Platform is strictly restricted to individuals aged 18 and older. ScoutIt does not knowingly collect personal data from minors. If we discover that personal data of a minor has been collected without verified parental consent under NPC Circular 2024-03, it will be deleted immediately.`,
  },
  {
    num: "11",
    title: "Data Protection Officer (DPO) contact details",
    body: `ScoutIt has not yet published a verified Data Protection Officer mailbox or office address. During the invited pilot, use the official Contact surface for privacy requests. The owner must designate the responsible person and verify the receiving channel before this section names one.`,
  },
  {
    num: "12",
    title: "NPC registration & compliance status",
    body: `ScoutIt does not represent that an NPC registration, Data Processing System registration, or Sworn Declaration and Undertaking has been completed. The owner and Philippine counsel must close the applicable filing and documentation gates before any such statement is published.`,
  },
  {
    num: "13",
    title: "Privacy policy updates",
    body: `ScoutIt reserves the right to modify this Privacy Policy to reflect system updates, regulatory changes, or NPC circular amendments. Material updates will be announced via in-app banners or registered email notifications. The "Effective Date" at the top indicates the latest revision date.`,
  },
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      eyebrow="LAYER 09 // PLATFORM GOVERNANCE"
      title="Privacy Policy"
      meta={`Version ${CURRENT_TERMS_VERSION}  ·  Effective ${CURRENT_TERMS_EFFECTIVE_DATE}  ·  Invited pilot`}
      intro="This invited-pilot notice describes the data ScoutIt currently handles, the providers involved, and the controls available to users. Browsing and saved spaces stay on the device by default. Philippine counsel and the designated privacy lead must review the notice before public commercial launch."
      sections={SECTIONS}
      related={{ href: "/terms", label: "Terms of Service" }}
    />
  );
}
