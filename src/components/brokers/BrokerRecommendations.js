import {
  RECOMMENDATION_SECTION_STATES,
} from "@/lib/brokerRecommendations";

/**
 * A-023 phase 4 — Client Recommendations.
 *
 * Three of the four states are non-claims. Only NONE_PUBLISHABLE may say this
 * broker has no published recommendations; NOT_LINKED and LOOKUP_FAILED say
 * why we cannot make that claim instead of asserting absence (Rule 3, 14).
 */
const RECOMMENDATION_COPY = {
  [RECOMMENDATION_SECTION_STATES.NONE_PUBLISHABLE]:
    "No client has published a recommendation for this advisor yet. Recommendations appear here only after the client consents and ScoutIt moderation approves them.",
  [RECOMMENDATION_SECTION_STATES.NOT_LINKED]:
    "This dossier is not yet linked to a ScoutIt account, so client recommendations cannot be read for it.",
  [RECOMMENDATION_SECTION_STATES.LOOKUP_FAILED]:
    "Client recommendations could not be loaded just now. This is a temporary read failure, not a statement that none exist.",
};

function formatMonth(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-PH", { month: "long", year: "numeric", timeZone: "UTC" });
}

export default function BrokerRecommendations({ section }) {
  const listed = section.state === RECOMMENDATION_SECTION_STATES.LISTED;

  return (
    <section className="detail-curations-section" aria-labelledby="broker-recommendations-title">
      <h2 id="broker-recommendations-title">Client Recommendations</h2>
      <p className="section-desc">
        Written by clients, attributed exactly as each client chose, and published only after
        consent and moderation. ScoutIt never edits them and this advisor cannot add or remove them.
      </p>

      {listed ? (
        <ul className="recommendation-list">
          {section.cards.map((card) => (
            <li key={card.id} className="recommendation-card">
              <blockquote className="recommendation-body">{card.body}</blockquote>

              <footer className="recommendation-meta">
                <span className="recommendation-author">{card.author}</span>
                {card.relationship && card.relationship !== card.author && (
                  <span className="recommendation-relationship">{card.relationship}</span>
                )}
                {formatMonth(card.submittedAt) && (
                  <span className="recommendation-date">{formatMonth(card.submittedAt)}</span>
                )}
                <span
                  className={
                    card.verified
                      ? "recommendation-source recommendation-source-verified"
                      : "recommendation-source"
                  }
                >
                  {card.sourceLabel}
                </span>
              </footer>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className={`empty-curations-msg${section.claimsEmptiness ? "" : " representation-notice"}`}
          role={
            section.state === RECOMMENDATION_SECTION_STATES.LOOKUP_FAILED ? "status" : undefined
          }
        >
          {RECOMMENDATION_COPY[section.state]}
        </div>
      )}
    </section>
  );
}
