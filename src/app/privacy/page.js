import LegalDoc from "@/components/legal/LegalDoc";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How ScoutIt collects, uses, and protects your data — built privacy-first and compliant with the Philippine Data Privacy Act (RA 10173).",
};

const SECTIONS = [
  {
    num: "01",
    title: "Our privacy-first principle",
    body: `ScoutIt is built so that the less we hold about you, the better. Your browsing and your saved spaces stay on your device by default. We collect personal data only where we genuinely need it to run the platform, and we handle it in line with the Philippine Data Privacy Act of 2012 (RA 10173) and the rules of the National Privacy Commission (NPC).

This policy explains what we collect, why, who we share it with, how long we keep it, and the rights you have over it.`,
  },
  {
    num: "02",
    title: "What we collect",
    body: `Account information you give us: your name, email address, and the role(s) you choose (seeker, owner, broker, photographer, researcher, event planner). Brokers and other professionals may add profile and credential details.

Submissions you make: property listings, photos, descriptions, and the data inside them.

Usage information: the pages you visit, searches you run, and spaces you interact with — used to operate and improve the platform.

We do not collect your payment card details ourselves. When billing goes live, payments will be handled by a licensed third-party processor under its own security standards.`,
  },
  {
    num: "03",
    title: "Your Ledger stays on your device",
    body: `Your Ledger — the spaces you save and tag — is stored in your browser's local storage, on your device. It does not reach our servers unless you log in and choose to sync it across devices.

This is deliberate. Your shortlisting and browsing behavior is yours. Until you ask us to sync, we cannot see your Ledger.`,
  },
  {
    num: "04",
    title: "Handshake Chat is not stored",
    body: `Messages in a Handshake Chat are ephemeral. They are permanently deleted when the chat closes, and ScoutIt does not archive, review, or retain their contents.

If you and the other party choose to share private contact details inside the chat, that is your decision and we cannot reverse it. Please don't send passwords, government IDs, or bank details through the chat.`,
  },
  {
    num: "05",
    title: "Why we use your data (our lawful basis)",
    body: `We process your data to:
— Create and run your account, and provide the features you use
— Match you with relevant spaces, advisors, and services
— Send you platform notifications you've asked for or that are part of the service
— Keep the platform safe and prevent abuse
— Improve ScoutIt based on how it's actually used
— Meet our legal obligations

Under RA 10173, we rely on your consent, on the performance of our agreement with you (these Terms), on our legitimate interests in running a safe and useful platform, and on legal obligations — whichever fits the specific use. We do not sell your personal data, and we do not build advertising profiles from it.`,
  },
  {
    num: "06",
    title: "Who we share it with",
    body: `We share data only with service providers who help us run the platform, and only with what they need to do their job:
— Hosting and delivery (Vercel)
— Database and storage (Supabase)
— Maps and geocoding (Mapbox)
— AI extraction for listing intake (Google Gemini)

Some of these providers process data on servers outside the Philippines. Where that happens, we take reasonable steps to ensure your data keeps a comparable level of protection, as RA 10173 requires for cross-border transfers.

We may also disclose data when the law requires it, or to protect the rights and safety of users and the public. We do not otherwise sell or rent your data to anyone.`,
  },
  {
    num: "07",
    title: "Cookies and analytics",
    body: `We use essential cookies that the platform needs to work — for example, to keep you logged in. We may use privacy-respecting analytics to understand aggregate usage, configured to minimize personal data.

You can disable non-essential cookies in your browser. Disabling essential cookies may stop you from logging in or using some features.`,
  },
  {
    num: "08",
    title: "How long we keep it",
    body: `We keep your account data while your account is active. When you remove a listing, we archive it rather than erase it, so it can be restored if you return — you can ask us to permanently delete it.

If you close your account, we delete or anonymize your personal data within a reasonable period, except where we're required by law to keep certain records. Aggregate, anonymized data that can no longer identify you may be kept to improve the platform.`,
  },
  {
    num: "09",
    title: "Your rights under the Data Privacy Act",
    body: `RA 10173 gives you rights over your personal data. You have the right to:
— Be informed about how your data is collected and used
— Access the data we hold about you
— Object to or withdraw consent for certain processing
— Correct inaccurate or outdated data
— Have your data erased or blocked where the law allows
— Data portability — receive a copy of your data in a usable format
— Be compensated for damage caused by mishandling of your data
— File a complaint with the National Privacy Commission

To exercise any of these, contact our Data Protection Officer (below). We'll respond within the timeframe the NPC expects.`,
  },
  {
    num: "10",
    title: "Security",
    body: `We protect your data with encrypted connections (HTTPS), access controls, and database-level security rules. No system is perfectly secure, so if you find a vulnerability, please report it responsibly through our contact channel so we can fix it.`,
  },
  {
    num: "11",
    title: "Not for minors",
    body: `ScoutIt is for adults. You must be at least 18 to hold an account. We don't knowingly collect personal data from anyone under 18. If you believe a minor has given us data, tell us and we'll remove it.`,
  },
  {
    num: "12",
    title: "Our Data Protection Officer",
    body: `For privacy questions, data requests, or concerns, contact ScoutIt's Data Protection Officer through the contact channel listed on the platform. We'll publish a dedicated DPO email address here before paid features and full accounts go live.

If you believe your rights under RA 10173 have been violated and we haven't resolved it, you may also contact the National Privacy Commission at privacy.gov.ph.`,
  },
  {
    num: "13",
    title: "Changes to this policy",
    body: `We may update this policy as the platform grows. We'll flag material changes in the platform or by email. The effective date at the top reflects the current version.`,
  },
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      eyebrow="LAYER 09 // PLATFORM GOVERNANCE"
      title="Privacy Policy"
      meta="Pre-launch draft · June 2026  ·  Compliant with the Data Privacy Act (RA 10173)"
      intro="ScoutIt is built privacy-first. Your browsing and your saved spaces stay on your device by default. This policy explains the data we do collect, why, who we share it with, and the rights you hold under Philippine law. We're in a pre-launch phase, so some features described here are not yet billing or storing data at full scale."
      sections={SECTIONS}
      related={{ href: "/terms", label: "Terms of Service" }}
    />
  );
}
