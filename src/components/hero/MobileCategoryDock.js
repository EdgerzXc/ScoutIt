"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CELESTIAL_SPACES } from "./DriftingPropertyBubbles";
import styles from "./mobileCategoryDock.module.css";

const BUBBLE_IMG_V = "20261015-v6";
const getBubbleImg = (diorama) => `/images/bubbles/bubble_${diorama}.png?v=${BUBBLE_IMG_V}`;

export default function MobileCategoryDock() {
  const handleSelect = (categoryType) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("scoutit:black-hole-consume", {
          detail: { category: categoryType },
        })
      );
    }
  };

  return (
    <nav
      className={styles.dockWrapper}
      aria-label="Direct space categories"
      data-testid="mobile-category-dock"
    >
      <div className={styles.dockHeader}>
        <span className={styles.statusPulse} aria-hidden="true" />
        <span className={styles.headerLabel}>Direct Space Access</span>
        <span className={styles.headerCount}>6 Zones</span>
      </div>

      <div className={styles.dockTrack} role="list">
        {CELESTIAL_SPACES.map((space) => {
          const href = `/property?type=${encodeURIComponent(space.type)}`;

          return (
            <div key={space.id} role="listitem">
              <Link
                href={href}
                className={styles.dockCard}
                onClick={() => handleSelect(space.type)}
                aria-label={`Explore ${space.label}: ${space.subtitle}`}
              >
                <div className={styles.orbContainer} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getBubbleImg(space.diorama)}
                    alt=""
                    className={styles.orbImage}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className={styles.orbGleam} />
                </div>

                <div className={styles.cardInfo}>
                  <span className={styles.zoneTag}>{space.zone}</span>
                  <span className={styles.cardLabel}>{space.label}</span>
                </div>

                <ChevronRight className={styles.cardArrow} size={14} aria-hidden="true" />
              </Link>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
