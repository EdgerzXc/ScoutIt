import { RECORD_STATES } from "@/lib/brokerMetrics";
import { CREDENTIAL_STATES } from "@/lib/brokerCredential";
import BrokerRecordChart from "@/components/brokers/BrokerRecordChart";

/**
 * A-023 — the identity block, shared verbatim by the canonical dossier and the
 * editor's live preview so the two cannot drift.
 *
 * Phase 5 replaced the hardcoded "Building a ScoutIt record" panel with the
 * real projection. The panel still says exactly that when there is nothing to
 * publish; the difference is that it is now an answer from the authority
 * rather than a string (Rule 3, Rule 14).
 */
const RECORD_COPY = {
  [RECORD_STATES.BUILDING]:
    "Qualified platform activity will appear here as this advisor completes transactions through ScoutIt.",
  [RECORD_STATES.UNAVAILABLE]:
    "The ScoutIt Record could not be loaded just now. This is a temporary read failure, not a statement that there is no activity.",
};

function ScoutItRecord({ record }) {
  const heading =
    record.state === RECORD_STATES.BUILDING || record.state === RECORD_STATES.UNAVAILABLE;

  return (
    <div className="detail-closures-box">
      <span className="icon-badge">SCOUTIT RECORD</span>

      {heading ? (
        <>
          <p>
            {record.state === RECORD_STATES.BUILDING
              ? "Building a ScoutIt record"
              : "Record unavailable"}
          </p>
          <small>{RECORD_COPY[record.state]}</small>
        </>
      ) : (
        <>
          {record.state === RECORD_STATES.STALE && (
            <p className="record-stale-flag" role="status">
              Last calculated {new Date(record.staleSince).toLocaleDateString("en-PH", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              })}
            </p>
          )}

          {/* A-037 moved the figures into the at-a-glance chart beside the
              advisor's name, so this panel no longer repeats them. Whenever
              this branch renders, at least one metric is publishable — which
              is exactly the condition under which the chart renders — so no
              state can reach here with the numbers now shown nowhere. The
              method note below stays, because provenance is this panel's job. */}
          <small>
            Computed only from activity completed through ScoutIt. Self-reported career history
            never contributes to these figures.
          </small>
        </>
      )}
    </div>
  );
}

export default function BrokerDossierIdentity({ identity, record = null, credential = null }) {
  return (
    <section className="profile-grid">
      <div className="profile-left-column">
        <div
          className="detail-avatar"
          style={{ backgroundImage: identity.image ? `url(${identity.image})` : undefined }}
        />

        {record ? (
          <ScoutItRecord record={record} />
        ) : (
          <div className="detail-closures-box">
            <span className="icon-badge">SCOUTIT RECORD</span>
            <p>Building a ScoutIt record</p>
            <small>{RECORD_COPY[RECORD_STATES.BUILDING]}</small>
          </div>
        )}
      </div>

      <div className="profile-right-column">
        <header className="profile-header profile-header--with-record">
          <div className="profile-header-identity">
          <span className="vector-label">Advisory Profile &middot; {identity.clearanceTier}</span>
          <h1 className="profile-name">{identity.name}</h1>
          <p className="profile-title">{identity.title} {"//"} {identity.location}</p>

          {/* The directory has always flagged example profiles; the canonical
              dossier did not, so a visitor arriving directly saw no notice.
              Any demo figures above are meaningless without it. */}
          {identity.isExample && (
            <span className="example-profile-flag">
              Example profile · illustrative data, not a real advisor record
            </span>
          )}

          {/* RA 9646: a PRC broker licence is valid for three years. The badge
              is driven by the licence's expiry, not by a one-time staff tick,
              so a lapsed registration says so instead of reading as current. */}
          {credential?.state === CREDENTIAL_STATES.VERIFIED_CURRENT && (
            <span className="prc-verified-badge">
              ✓ {credential.label}
              {credential.expiresOn && (
                <span className="prc-expiry-note">Valid to {credential.expiresOn}</span>
              )}
            </span>
          )}
          {credential?.state === CREDENTIAL_STATES.EXPIRED && (
            <span className="prc-lapsed-badge">{credential.label}</span>
          )}
          {credential?.state === CREDENTIAL_STATES.VERIFIED_UNDATED && (
            <span className="prc-undated-badge">{credential.label}</span>
          )}
          </div>

          {/* A-037. The same record the detail panel sources in full, encoded
              so it can be read at a glance. It returns null when nothing
              qualifies, so a building or unreadable record shows the panel's
              sentence rather than an empty instrument. */}
          {record && <BrokerRecordChart record={record} />}
        </header>

        <div className="profile-body-content">
          <div className="detail-section">
            <h2>About the Advisor</h2>
            {/* A-023: every public card states its provenance. This narrative
                is written by the broker, so it says so rather than borrowing
                the authority of the ScoutIt-computed panels beside it. */}
            <span className="provenance-label">Broker-declared</span>
            <p className="bio-paragraph">{identity.bio}</p>
          </div>
          <div className="detail-section">
            <h2>Operational Focus area</h2>
            <div className="focus-pills-list">
              <span className="focus-pill">Specialty: {identity.specialty}</span>
              <span className="focus-pill">Location: {identity.location}</span>
              <span className="focus-pill">Clearance: {identity.clearanceTier}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
