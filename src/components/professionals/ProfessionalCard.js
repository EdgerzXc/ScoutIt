"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeCheck, MapPin } from "lucide-react";
import ProfessionalSaveButton from "./ProfessionalSaveButton";
import styles from "./professionalDirectory.module.css";

const CATEGORY_MARKS = { broker: "AD", photographer: "LN", researcher: "RX", event_planner: "EV" };

export default function ProfessionalCard({ record, actionLabel }) {
  const onPointerMove = (event) => {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--card-x", `${((event.clientX - rect.left) / rect.width - 0.5) * 4}deg`);
    event.currentTarget.style.setProperty("--card-y", `${((event.clientY - rect.top) / rect.height - 0.5) * -4}deg`);
  };
  const resetPointer = (event) => {
    event.currentTarget.style.setProperty("--card-x", "0deg");
    event.currentTarget.style.setProperty("--card-y", "0deg");
  };

  return (
    <article className={styles.card} onPointerMove={onPointerMove} onPointerLeave={resetPointer}>
      <div className={styles.portrait}>
        {record.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={record.image} alt="" loading="lazy" />
        ) : (
          <span aria-hidden="true">{CATEGORY_MARKS[record.category] || "PR"}</span>
        )}
        <div className={styles.portraitShade} />
        {(record.isPilot || record.isExample) && (
          <span className={styles.sampleFlag}>{record.isPilot ? "Sample · human testing" : "Example profile"}</span>
        )}
        <span className={styles.sourceFlag}>{record.source === "airtable" ? "Public CMS" : "Owner-public profile"}</span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardIdentity}>
          {record.location && <span className={styles.location}><MapPin size={12} aria-hidden="true" />{record.location}</span>}
          <h2>{record.name}</h2>
          {record.headline && <p className={styles.headline}>{record.headline}</p>}
        </div>

        {record.summary && <p className={styles.summary}>{record.summary}</p>}

        {record.specialties.length > 0 && (
          <div className={styles.chips} aria-label="Specialties">
            {record.specialties.slice(0, 4).map((specialty) => <span key={specialty}>{specialty}</span>)}
          </div>
        )}

        <div className={styles.evidence}>
          <span className={styles.sectionLabel}>Public signals</span>
          {record.credentials.length > 0 ? record.credentials.map((credential) => (
            <div className={styles.evidenceRow} key={`${credential.label}-${credential.detail}`}>
              <BadgeCheck size={15} aria-hidden="true" />
              <span><strong>{credential.label}</strong><small>{credential.detail} · {credential.source}</small></span>
            </div>
          )) : <p className={styles.absentSignal}>No public credential evidence is attached.</p>}
          {record.badges.length > 0 && (
            <div className={styles.badges} aria-label="ScoutIt badges">
              {record.badges.map((badge) => (
                <span key={badge.id} title={`${badge.source}${badge.minted_at ? ` · granted ${badge.minted_at.slice(0, 10)}` : ""}`}>
                  {badge.label}<small>{badge.source}</small>
                </span>
              ))}
            </div>
          )}
          {record.availability && (
            <p className={styles.availability} data-available={record.availability.available}>
              <i aria-hidden="true" />
              {record.availability.available ? "Accepting inquiries" : "Not accepting inquiries"}
              <small>{record.availability.source}</small>
            </p>
          )}
        </div>

        <div className={styles.cardActions}>
          <Link className={styles.profileLink} href={record.canonicalPath}>
            {actionLabel}<ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <ProfessionalSaveButton record={record} />
        </div>
      </div>
    </article>
  );
}
