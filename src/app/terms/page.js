import LegalDoc from "@/components/legal/LegalDoc";

export const metadata = {
  title: "Terms of Service",
  description:
    "The terms for using ScoutIt — the Philippines' first spatial commerce platform. Intelligence first. Transactions never.",
};

const SECTIONS = [
  {
    num: "01",
    title: "What ScoutIt is — and what it isn't",
    body: `ScoutIt is operated by ScoutIt Intelligence Technologies Inc., a technology company registered in the Republic of the Philippines ("ScoutIt," "we," "us," or "our"). ScoutIt is the Philippines' first spatial commerce and intelligence platform — a B2B2C technology layer for physical space: homes, commercial offices, short-term rentals, hospitality, restaurants, and event venues. We turn space into clear, verified briefings, and we connect space owners and professionals to seekers.

INTELLIGENCE FIRST. TRANSACTIONS NEVER. ScoutIt is deliberately and strictly NOT a real estate broker, real estate salesperson, real estate appraiser, real estate consultant, or real estate dealer under Republic Act No. 9646 (the Real Estate Service Act of the Philippines, or RESA). ScoutIt does not sell, purchase, lease, negotiate, represent any party in, manage escrow for, or receive commissions or transaction fees on any property transaction. All discussions, viewings, negotiations, lease agreements, purchase contracts, and financial settlements occur entirely off-platform between the respective parties and their independently retained, licensed professionals.`,
  },
  {
    num: "02",
    title: "Your account, role, and age capacity",
    body: `You can browse ScoutIt and use the Ledger (your saved spaces) without an account. To list a space, connect with an advisor, or use platform features, you create an account and select your role identity: seeker, owner, broker, photographer, researcher, or event planner.

Under Article 1327 of the Civil Code of the Philippines, you must be at least eighteen (18) years of age and possess full legal capacity to register an account and enter into binding contracts. By creating an account, you attest that you meet this legal age requirement. Accounts found to be created by minors under 18 will be terminated immediately.

You agree to provide true, accurate, current, and complete information and maintain the security of your account credentials. You are responsible for all actions taken under your account identity. We reserve the right to suspend or terminate accounts that breach these terms, submit fraudulent data, impersonate third parties, or engage in unauthorized real estate practice under RA 9646.`,
  },
  {
    num: "03",
    title: "The Ledger stays yours",
    body: `Your Ledger — the spaces you save and tag (Potential Fit, Interested, Inspired Me, Save) — is stored exclusively within your local web browser storage on your device by default. ScoutIt cannot view, access, or extract your Ledger while it remains un-synced on your device.

If you choose to log in and sync your Ledger across devices, you explicitly instruct ScoutIt to maintain a secure cloud backup mirror of your Ledger. You retain full control to clear local storage or disconnect server synchronization at any time.`,
  },
  {
    num: "04",
    title: "Connects token economy & authorization mechanics",
    body: `Connects are ScoutIt's proprietary, internal digital utility tokens utilized on the Platform strictly as an authorization layer, access control mechanism, and anti-spam protocol. Under Section 3(g) of the RESA Law (RA 9646), Connects are not real estate brokerage fees, referral fees, commissions, success fees, escrow deposits, or legal tender. Paying a Connect buys encrypted digital message transmission bandwidth and platform access — not a real estate transaction or representation.

Each Connect wallet holds three structural allocations:
— Monthly Allowance: Granted based on subscription tier. Resets on the 1st of each calendar month, non-cumulative, with zero rollover. Consumed first.
— Purchased Allocation: Acquired à la carte via authorized payment processors (PayMongo). Permanent, non-expiring, and account-wide. Consumed second.
— Reward Balance: Earned by completing platform data verification bounties. Permanent, non-expiring, and account-wide. Consumed third.

A Connect is consumed immediately upon the successful dispatch and delivery of an interaction (sending an inquiry, submitting a pitch, or requesting contact). In compliance with Republic Act No. 7394 (Consumer Act of the Philippines), the platform service is fully rendered upon transmission; consequently, spent Connects are non-refundable even if the recipient declines, fails to respond, or allows the interaction to time out. Discretionary token corrections may be issued by administration only for verified technical system errors.`,
  },
  {
    num: "05",
    title: "Platform handshakes and broker verification",
    body: `A licensed real estate broker appears on a property listing only after completing a two-key double-opt-in representation handshake (one party initiates an invite or pitch; the other explicitly accepts). This handshake establishes listing visibility authorization only; it does not constitute an exclusive listing agreement or grant platform rating.

Scout Rating points and transaction verification counts are awarded exclusively upon the execution of a separate post-viewing buyer-broker transaction handshake completed inside ScoutIt by both parties. Scout Rating cannot be purchased, tier-granted, or assigned via representation handshakes. Any transaction concluded off-platform that skips the in-platform transaction handshake receives zero Scout Rating credit or platform validation.`,
  },
  {
    num: "06",
    title: "Subscriptions, tiers, and billing operations",
    body: `ScoutIt offers subscription tiers per role: Starry (Free), Solar, Cluster, and Universe. Subscriptions grant enhanced data intelligence, elevated visibility, expanded active listing allowances, and monthly Connect allocations. Subscriptions monetize platform software access and intelligence depth — never the listing of property or browsing of public facts.

Prior to reaching the platform benchmark of 200 approved live properties, premium information and features are unlocked for registered users via a Master Mission Control locker. Paid billing operations remain inactive during this period; however, Connect actions continue to consume free monthly allocations to test anti-spam protocols. Normal subscription paywalls and commercial billing activate upon notice once the operational threshold is reached.

Once billing is active, paid subscriptions automatically renew for successive billing cycles unless cancelled prior to the renewal date via account settings. Cancellation halts future charges and does not entitle the User to a retroactive refund for current active billing cycles.`,
  },
  {
    num: "07",
    title: "Listings, accuracy, and price rules",
    body: `Property owners and listers are the primary source of truth for all listing submissions. Listings authored directly by owners publish following owner attestation and automated policy checks. Listings generated via ScoutIt's document extraction tools (parsing owner-supplied PDF brochures or flyers) require procedural verification against the original source document prior to public release.

PROCEDURAL EXTRACTION VERIFICATION DISCLAIMER: "Verification" on ScoutIt refers strictly to procedural verification — confirming that automated document extraction accurately matches owner-provided PDF source files, or verifying that a lister completed basic identity attestation. ScoutIt procedural verification does NOT constitute a real property title search, legal title audit, physical property appraisal, structural inspection, or guarantee of owner legal capacity under Republic Act No. 7394 (Consumer Act) and Article 1338 of the Civil Code of the Philippines.

ScoutIt strictly prohibits data invention. Missing data points remain blank (indicating "unknown"). Asking prices displayed on the Platform reflect owner-confirmed inputs (mapped strictly to CM_Rent_Per_Sqm). Where pricing is uncertain, listings must state "Price on Request" or remain blank. ScoutIt never appraises, algorithmically estimates, scrapes secondary prices, or negotiates asking prices under Section 3(f) of RA 9646.`,
  },
  {
    num: "08",
    title: "Bounties and field telemetry tasks",
    body: `ScoutIt may issue small real-world data verification tasks ("Bounties"), allowing qualified researchers or photographers to verify location facts, capture geotagged photo evidence, or audit spatial details in exchange for reward Connects.

Bounties tied to specific private properties require Cluster-tier or higher owner approval before reward payout. Submitting falsified proof, fake coordinates, or altered media results in immediate forfeiture of earned rewards, bounty disqualification, and permanent account termination.`,
  },
  {
    num: "09",
    title: "Temporary communication and ephemeral chat retention",
    body: `Handshake Chat provides a private, temporary communication space for connected parties. Closing a chat thread converts it to read-only status for seven (7) days as an operational retention benchmark. Upon expiration of the 7-day window, message body text is permanently purged from active database storage, while non-message transaction metadata (timestamps, participant IDs, status flags) is retained for audit trails.

Every chat interface displays the following mandatory operational disclosure: "Notice: This conversation is temporary. When the chat closes it becomes read-only, and its message contents are deleted after 7 days. ScoutIt is not a party to any agreement made here."

Disputed or reported chat threads are placed under restricted administrative holds for Trust & Safety review until resolved. Exchanging personal contact details within the chat is done entirely at your own risk; ScoutIt cannot un-share information once transmitted.`,
  },
  {
    num: "10",
    title: "The Spatial Vault and intellectual property ownership",
    body: `Spatial Vault assets — including Luma AI 3D spatial scans, 360-degree virtual tours, acoustic heatmaps, and aerial visualisations — produced directly by ScoutIt or its commissioned agents are the exclusive intellectual property of ScoutIt under the Intellectual Property Code of the Philippines (Republic Act No. 8293).

Subscribed property owners receive a limited, revocable, non-exclusive, non-transferable display license to exhibit ScoutIt-produced media on their live Platform listing during their active subscription. If the owner cancels or downgrades their subscription, their display license terminates and owner privileges pause. However, ScoutIt retains sole copyright and ownership of its produced spatial media under work-for-hire provisions of RA 8293 and may continue displaying it on the Platform to entitled users. Owners may not extract, download, export, or republish ScoutIt-produced media on third-party platforms.

Photos, descriptions, and virtual tours directly uploaded by Users remain the intellectual property of the respective User. By uploading, the User grants ScoutIt a worldwide, perpetual, royalty-free, non-exclusive license to host, display, format, and distribute the content in connection with the Platform.`,
  },
  {
    num: "11",
    title: "Removing a listing: soft-delete vs. permanent removal",
    body: `Property owners may withdraw a listing at any time, moving it off-market. Off-market properties are immediately removed from public discovery feeds and search engines, remaining accessible only to entitled Cluster/Universe users if explicitly set to "Quietly open to offers".

Permanent listing removal is an irreversible Danger Zone action. Executing permanent removal removes the listing from owner portfolios, public directories, off-market indexes, and sitemaps. Permanent removal does not delete ScoutIt-owned spatial media, historical transaction metadata, reserved canonical URLs, or internal security audit logs. True erasure of personal data is governed by Privacy Policy Section 08 under the Data Privacy Act (RA 10173).`,
  },
  {
    num: "12",
    title: "Prohibited activities and platform security",
    body: `You expressly agree not to:
1. Act as, advertise as, or convey the impression of being a licensed real estate broker, salesperson, appraiser, or consultant without holding valid credentials issued by the Professional Regulation Commission (PRC) under RA 9646;
2. Submit fraudulent, misleading, or deceptive property listings or pricing facts under RA 7394;
3. Scrape, harvest, extract, or index platform data, spatial media, or user details using automated bots, crawlers, or unauthorized software;
4. Circumvent, disable, or tamper with platform security controls, entitlement paywalls, or Connect token mechanisms;
5. Harass, threaten, impersonate, or breach the privacy of any User under RA 10173; or
6. Utilize the Platform for unlawful purposes under Philippine law.

Breach of these prohibitions results in immediate account revocation, asset forfeiture, and reporting to legal authorities.`,
  },
  {
    num: "13",
    title: "Platform identity and proprietary rights",
    body: `The ScoutIt brand, trademark, software code, dynamic interfaces, scrollytelling visual tracks, Connects economic architecture, spatial display systems, and editorial intelligence publications are the exclusive property of ScoutIt Intelligence Technologies Inc. Unauthorized reproduction, modification, or distribution is prohibited under RA 8293.`,
  },
  {
    num: "14",
    title: "Disclaimer of advice and limitation of liability",
    body: `All intelligence briefings, spatial telemetry, neighborhood metrics, visualisations, and price displays are provided strictly for informational purposes. ScoutIt does not render professional legal, real estate, financial, tax, or investment advice. Users must perform independent due diligence with licensed professionals before entering into any transaction.

The Platform is provided on an "AS IS" and "AS AVAILABLE" basis. To the maximum extent permitted under Philippine law, ScoutIt disclaims all warranties, express or implied. ScoutIt is not liable for indirect, incidental, consequential, special, or punitive damages, nor for any financial loss, loss of contract, commission dispute, or physical property damages arising from off-platform transactions or reliance on platform data.`,
  },
  {
    num: "15",
    title: "Dispute resolution framework",
    body: `ScoutIt handles platform operational disputes only (such as impersonation, unauthorized listing uploads, user harassment, or system technical errors).

ScoutIt WILL NOT mediate, arbitrate, or involve itself in transaction disputes regarding property defects, asking prices, earnest money deposits, lease terms, commission splits, or broker representation contracts. All such disputes are strictly between the contracting parties and their licensed advisors.`,
  },
  {
    num: "16",
    title: "Electronic acceptance and terms modifications",
    body: `Pursuant to Republic Act No. 8792 (Electronic Commerce Act of 2000), registering an account, clicking any confirmation button, or utilizing the Platform constitutes valid, binding electronic contract acceptance equivalent to a physical signature.

ScoutIt reserves the right to amend these Terms at any time. Material changes will be communicated via in-app notifications or registered email. Continued use of the Platform following published amendments constitutes binding acceptance of the revised Terms.`,
  },
  {
    num: "17",
    title: "Governing law and venue selection",
    body: `These Terms are governed by, construed, and enforced in accordance with the laws of the Republic of the Philippines, including RA 9646, RA 10173, RA 8792, RA 7394, and RA 8293. Any legal suit, action, or proceeding arising out of these Terms or the Platform shall be instituted exclusively in the proper courts of Taguig City, Metro Manila, Philippines.`,
  },
  {
    num: "18",
    title: "Official legal contact details",
    body: `For legal inquiries, operational notices, or formal statutory communications, contact ScoutIt at:
ScoutIt Intelligence Technologies Inc.
Attn: Legal Department / Regulatory Compliance
Address: Tower 1, High Street South Corporate Plaza, 9th Ave cor 26th St, Bonifacio Global City, Taguig City 1634, Metro Manila, Philippines
Dedicated Legal Email: legal@scoutit.ph
Data Protection Officer Email: dpo@scoutit.ph`,
  },
];

export default function TermsPage() {
  return (
    <LegalDoc
      eyebrow="LAYER 09 // PLATFORM GOVERNANCE"
      title="Terms of Service"
      meta="Version 1.0  ·  Effective October 24, 2026  ·  Philippine operations governed by RA 9646, RA 10173, RA 8792"
      intro="These Terms of Service govern your access to and use of ScoutIt. By registering an account, accessing the platform, or executing an electronic acceptance, you agree to be bound by these terms. ScoutIt is engineered around procedural verification and statutory compliance under Philippine jurisprudence. Intelligence first. Transactions never."
      sections={SECTIONS}
      related={{ href: "/privacy", label: "Privacy Policy" }}
    />
  );
}
