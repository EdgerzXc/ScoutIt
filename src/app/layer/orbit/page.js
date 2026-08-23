import BoardPodium from "@/components/board/BoardPodium";
import LayerNav from "@/components/descent/LayerNav";
import LayerTransition from "@/components/descent/LayerTransition";
import Footer from "@/components/layout/Footer";
import ScoutEarth from "@/components/orbit/ScoutEarthClient";

import styles from "./page.module.css";

export default function OrbitLayer() {
  return (
    <div className={styles.wrapper}>
      <LayerNav next={{ href: "/layer/stratosphere", label: "Stratosphere" }} />

      <div className={styles.earthBackdrop} aria-hidden="true">
        <ScoutEarth showSolarSystem />
      </div>

      <main className={styles.main}>
        <BoardPodium />
        <LayerTransition
          nextNum="02"
          nextName="Stratosphere"
          nextHref="/layer/stratosphere"
          teaser="Enter the atmosphere. Discover spatial intelligence, market stories, and neighborhood briefings."
        />
      </main>

      <Footer />
    </div>
  );
}
