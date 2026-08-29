import Link from "next/link";
import { CONTRIBUTION_SECTION_STATES } from "@/lib/brokerContributions";

/**
 * A-023 phase 4 — ScoutIt Contributions.
 *
 * Every row is a link to the artifact it claims credit for, because A-023
 * requires contributions to be inspectable. A contribution whose artifact
 * cannot be opened never reaches this component; the projection drops it.
 */
const CONTRIBUTION_COPY = {
  [CONTRIBUTION_SECTION_STATES.NONE_PUBLISHABLE]:
    "This advisor has not published contributions to ScoutIt yet. Answered questions, approved corrections, briefings, and credited intel appear here once published.",
  [CONTRIBUTION_SECTION_STATES.NOT_LINKED]:
    "This dossier is not yet linked to a ScoutIt account, so contributions cannot be read for it.",
  [CONTRIBUTION_SECTION_STATES.LOOKUP_FAILED]:
    "Contributions could not be loaded just now. This is a temporary read failure, not a statement that none exist.",
};

function formatMonth(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-PH", { month: "short", year: "numeric", timeZone: "UTC" });
}

export default function BrokerContributions({ section }) {
  const listed = section.state === CONTRIBUTION_SECTION_STATES.LISTED;

  return (
    <section className="detail-curations-section" aria-labelledby="broker-contributions-title">
      <h2 id="broker-contributions-title">ScoutIt Contributions</h2>
      <p className="section-desc">
        Work this advisor published on ScoutIt. Each entry opens the item it credits.
        Contributions are a record of participation and form no part of any rating.
      </p>

      {listed ? (
        <ul className="contribution-list">
          {section.cards.map((card) => (
            <li key={card.id}>
              <Link href={card.href} className="contribution-row">
                <span className="contribution-kind">{card.kindLabel}</span>
                <span className="contribution-title">{card.title}</span>
                {formatMonth(card.publishedAt) && (
                  <span className="contribution-date">{formatMonth(card.publishedAt)}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className={`empty-curations-msg${section.claimsEmptiness ? "" : " representation-notice"}`}
          role={
            section.state === CONTRIBUTION_SECTION_STATES.LOOKUP_FAILED ? "status" : undefined
          }
        >
          {CONTRIBUTION_COPY[section.state]}
        </div>
      )}
    </section>
  );
}
