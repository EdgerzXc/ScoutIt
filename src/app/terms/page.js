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
    body: `ScoutIt is the Philippines' first spatial commerce platform — a B2B2C intelligence layer for every kind of space: homes, offices, short-term rentals, hospitality, restaurants, and event venues. We turn space into clear, verified briefings, and we connect the people who own and work with space to the people looking for it.

ScoutIt is not a real estate broker, agent, or dealer, and it is not a listings site. We do not sell, lease, negotiate, represent any party in, or take a cut of any property transaction. Our role is intelligence and connection — never the deal itself.

Our standing rule: Intelligence first. Transactions never.`,
  },
  {
    num: "02",
    title: "Your account and your role",
    body: `You can browse ScoutIt and use the Ledger (your saved spaces) without an account. To list a space, connect with an advisor, or use paid features, you create an account and pick one or more roles: seeker, owner, broker, photographer, researcher, or event planner.

You agree to give accurate information and keep it current. You are responsible for everything done under your account. Don't share your login, and don't use someone else's account without their permission.

You must be at least 18 years old to hold a ScoutIt account.

We may suspend or close an account that breaks these terms, posts false information, or harms the platform or other people on it.`,
  },
  {
    num: "03",
    title: "The Ledger stays yours",
    body: `Your Ledger — the spaces you save and tag (Potential Fit, Interested, Inspired Me, Save) — lives in your own browser, on your own device. It is never gated behind a paywall and never required to be on our servers.

If you choose to log in and sync your Ledger across devices, you are asking us to store a copy. Until you do, your shortlisting stays on your device and we cannot see it. See our Privacy Policy for the detail.`,
  },
  {
    num: "04",
    title: "Connects — what they are",
    body: `Connects are ScoutIt's platform currency. They are an authorization and anti-spam layer — they gate who can reach whom and who can be listed on a property. Connects are not a brokerage fee, a commission, or a charge on any transaction. Paying a Connect buys a platform action, not a property.

Each Connect wallet holds three kinds of Connects:
— Granted: issued monthly with your tier. These reset on the 1st of each month and do not roll over.
— Purchased: bought in Connect packs. These never expire.
— Earned: paid out for completing bounties. These never expire.

When you spend, we use your granted Connects first, then purchased, then earned — so the ones that expire are used before the ones that don't.

Connects are tied to your account. They are not transferable between accounts and have no cash value off the platform.`,
  },
  {
    num: "05",
    title: "Connects — spending and refunds",
    body: `A Connect is spent the moment you send the action — a handshake invite, a pitch, or a contact request. It is spent whether or not the other side responds. A decline is a signal, not a refund event; you are free to try again, which costs another Connect.

Typical costs: a handshake (owner inviting a broker, or a broker pitching an owner) costs the initiator 1 Connect, and accepting is free. A seeker contacting a broker costs 1 Connect. Commissioning a photographer, researcher, or event planner costs 2 Connects. Exact costs are shown in the platform before you confirm.

Because a Connect buys an immediate platform action that is delivered the instant you send it, spent Connects are non-refundable. Connect packs you have bought but not yet spent can be refunded only where Philippine consumer law requires it.`,
  },
  {
    num: "06",
    title: "Subscriptions, tiers, and pricing",
    body: `ScoutIt offers four subscription tiers for each role: Starry (free), Solar, Cluster, and Universe. Higher tiers unlock more intelligence, more visibility, more listing slots, and a larger monthly Connects grant. Each role is its own subscription.

We charge for access, intelligence, and connection — never for listings, and never for looking. Public facts about a space (location, size, condition, the owner's asking price where verified) are free to view.

Pricing shown as "Coming Soon" is not yet billable. Paid subscriptions and Connect purchases go live after the platform reaches its launch inventory; until then, paid tiers are previews. Founding "Pioneer Cohort" members who join early may be offered a locked-in rate, honored on the terms stated at the time of that offer.

When billing is live, subscriptions renew automatically for the period you chose unless you cancel before the renewal date. You can cancel anytime; cancellation stops the next charge and is not a refund of the current period.`,
  },
  {
    num: "07",
    title: "Listings, accuracy, and price",
    body: `Listings on ScoutIt are submitted by owners and brokers and are reviewed before they go public. We make a genuine effort to verify what we publish, but we do not guarantee any listing is complete, current, or error-free. A listing is information — it is not an offer to sell, lease, or transfer anything.

We never invent data. A blank field means the information was not available when we published — it does not mean zero, and it does not mean "not applicable."

Price is shown only in a listing's "Your Move" section, only when the owner has verified it, and only as the owner's asking price. ScoutIt does not set, appraise, or broker any price.`,
  },
  {
    num: "08",
    title: "Owner authority and the broker handshake",
    body: `A property's authority comes from its owner — never from whoever entered it first. An owner can sell it themselves, work with one broker, or open it to many. There is no exclusivity built into the platform.

A broker only appears on a property after a two-key handshake: one side invites or pitches, the other side accepts. Neither side can attach the other on their own. A broker who first lists a property is credited as the lister, but that is credit, not a monopoly — other owner-confirmed brokers can appear too.

A broker's Scout Rating reflects verified closures only. It is never bought, never granted by a tier, and never created by a handshake. Being listed on a property is visibility; it is not a rating.

If someone disputes a broker's authority on a listing, we resolve it through human review, with the owner's word as the default.`,
  },
  {
    num: "09",
    title: "The Handshake Chat is temporary",
    body: `When two parties connect, a private chat opens so they can talk and build trust. This chat is ephemeral. Messages are permanently deleted when the chat closes — when both sides complete the handshake, or when either side walks away. ScoutIt does not archive, review, or retain chat contents.

Every chat window carries this line, and it is part of these terms: "This conversation is temporary and will be deleted when closed. ScoutIt is not a party to any agreement made here."

If the two parties choose to share private contact details inside the chat, that exchange is their decision. Once shared, ScoutIt cannot un-share it. A Connect buys you access to start the conversation — it is not a guarantee of privacy after you choose to exchange details. Do not share passwords, government IDs, or bank details through the chat.`,
  },
  {
    num: "10",
    title: "The Spatial Vault and who owns the media",
    body: `The Spatial Vault holds rich media for a space — 3D spatial maps, 360° tours, and drone heatmaps. Most of this media is produced by ScoutIt (or by creators ScoutIt commissions), not uploaded by owners.

Media that ScoutIt produces is ScoutIt's property. While you hold the subscription that includes it, you have a license to have it displayed on your listing. You do not own the produced media, and you cannot take it or reuse it elsewhere.

If you cancel or downgrade, the media ScoutIt produced may remain on the platform and continue to be displayed to qualifying viewers, while your own owner privileges over it are paused. If you bring your own existing tour (by pasting a link you already own), that media stays yours.`,
  },
  {
    num: "11",
    title: "Removing a listing",
    body: `You can switch a listing to off-market or remove it at any time. Removing a listing takes it off the public site and out of your active list immediately. Behind the scenes, we archive rather than erase it, so it can be restored if you come back — and so any ScoutIt-produced media is preserved.

A true, permanent erase of a record is handled through a support request, including a genuine data-removal request under Philippine privacy law. There is no public "delete forever" button, by design.`,
  },
  {
    num: "12",
    title: "Bounties",
    body: `Bounties are small, real-world data tasks — verifying an address, confirming a space is still open, photographing a space. Researchers and photographers can claim a bounty, submit proof, and earn Connects. Where a bounty is tied to a specific owner's property, the owner approves the work before any payout. Submitting false or fabricated proof forfeits the claim and may close your account.`,
  },
  {
    num: "13",
    title: "What you may not do",
    body: `Don't use ScoutIt to:
— Post false, misleading, or fraudulent listings
— Scrape, harvest, or systematically extract platform data
— Get around access controls, or reverse-engineer the platform
— Harass, threaten, or impersonate anyone
— Misrepresent your authority over a property or your professional license
— Do anything that breaks Philippine law, including RA 9646

Breaking these may mean immediate account closure and, where the law requires, a report to the relevant authorities.`,
  },
  {
    num: "14",
    title: "Intellectual property",
    body: `The ScoutIt platform — its brand, design, editorial briefings, the Connects economy, the Spatial Vault framework, and ScoutIt-produced media — belongs to ScoutIt. Don't copy, redistribute, or build derivatives from it without our written permission.

Photos, descriptions, and data that owners and brokers submit stay theirs. By submitting them, you give ScoutIt a non-exclusive license to display that content on the platform for as long as the listing lives here.`,
  },
  {
    num: "15",
    title: "No advice, and the limits of our liability",
    body: `ScoutIt provides intelligence, not professional advice. Nothing on the platform is legal, financial, tax, or investment advice. Decisions about a space are yours; make them with your own professionals.

The platform is provided "as is." To the fullest extent Philippine law allows, ScoutIt is not liable for indirect, incidental, or consequential losses arising from your use of the platform — including anything that happens in a real estate transaction you found, arranged, or discussed through ScoutIt. We are not a party to those transactions.`,
  },
  {
    num: "16",
    title: "Disputes we handle — and ones we don't",
    body: `ScoutIt resolves platform disputes only: unauthorized listings, impersonation, abuse, and similar issues about the platform itself.

ScoutIt does not mediate transaction disputes — price, commission, terms, or anything about the deal between a buyer, seller, owner, or broker. Those are between the parties and their own advisors.`,
  },
  {
    num: "17",
    title: "Electronic acceptance and changes",
    body: `By creating an account or using ScoutIt, you accept these terms electronically, with the same effect as a signature under the Philippine Electronic Commerce Act (RA 8792).

We may update these terms as the platform grows. We'll flag material changes in the platform or by email. If you keep using ScoutIt after a change takes effect, that's your acceptance of the updated terms.`,
  },
  {
    num: "18",
    title: "Governing law and contact",
    body: `These terms are governed by the laws of the Republic of the Philippines, including the Real Estate Service Act (RA 9646), the Electronic Commerce Act (RA 8792), and the Consumer Act (RA 7394). Disputes fall under the jurisdiction of the appropriate Philippine courts.

Questions about these terms? Reach us through the contact channel listed on the platform. We'll add a dedicated legal contact address here before paid features go live.`,
  },
];

export default function TermsPage() {
  return (
    <LegalDoc
      eyebrow="LAYER 09 // PLATFORM GOVERNANCE"
      title="Terms of Service"
      meta="Pre-launch draft · June 2026  ·  Philippine operations governed by RA 9646"
      intro="These terms cover how you use ScoutIt. By browsing or signing in, you agree to them. We've written them in plain language on purpose — if anything here is unclear, ask us before you rely on it. We're in a pre-launch phase, so some paid features described here are previews until billing goes live."
      sections={SECTIONS}
      related={{ href: "/privacy", label: "Privacy Policy" }}
    />
  );
}
