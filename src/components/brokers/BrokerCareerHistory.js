import { CAREER_SECTION_STATES } from "@/lib/brokerCareerHistory";

/**
 * A-023 gap G4 — Career History, rendered as the SECONDARY template.
 *
 * This section always appears AFTER the ScoutIt Record in the page order, and
 * its heading says what it is before any number is read. A-023 forbids the two
 * templates being merged; keeping them visually distinct is the last half of
 * that rule, after the storage and projection halves.
 */
const CAREER_COPY = {
  [CAREER_SECTION_STATES.NONE_PUBLISHABLE]:
    "This advisor has not published any experience from before ScoutIt. Declared history appears here only after the advisor attests to it.",
  [CAREER_SECTION_STATES.NOT_LINKED]:
    "This dossier is not yet linked to a ScoutIt account, so declared career history cannot be read for it.",
  [CAREER_SECTION_STATES.LOOKUP_FAILED]:
    "Declared career history could not be loaded just now. This is a temporary read failure, not a statement that none exists.",
};

export default function BrokerCareerHistory({ section }) {
  const listed = section.state === CAREER_SECTION_STATES.LISTED;

  return (
    <section className="detail-curations-section" aria-labelledby="broker-career-title">
      <h2 id="broker-career-title">Career History</h2>
      <p className="section-desc">
        Experience this advisor reports from before ScoutIt, in their own words. These figures are
        self-reported and separate from the ScoutIt Record above, which is computed only from
        activity completed on the platform. Neither total includes the other.
      </p>

      {listed ? (
        <ul className="career-claim-list">
          {section.cards.map((card) => (
            <li key={card.id} className="career-claim">
              <div className="career-claim-head">
                <span className="career-claim-label">{card.label}</span>
                <span className="provenance-label">{card.provenance}</span>
              </div>

              <p className="career-claim-value">
                <strong>{card.value}</strong>
                <span className="career-claim-unit">
                  {card.currency ? `${card.currency} ` : ""}
                  {card.unit}
                </span>
              </p>

              {card.coverageLabel && (
                <p className="career-claim-period">Covering {card.coverageLabel}</p>
              )}
              <p className="career-claim-source">{card.sourceNote}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className={`empty-curations-msg${section.claimsEmptiness ? "" : " representation-notice"}`}
          role={section.state === CAREER_SECTION_STATES.LOOKUP_FAILED ? "status" : undefined}
        >
          {CAREER_COPY[section.state]}
        </div>
      )}
    </section>
  );
}
