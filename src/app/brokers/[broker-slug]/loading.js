import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./broker-detail.css";

/**
 * A-023: instant loading state for the canonical broker dossier.
 *
 * It reuses the page's own layout classes rather than inventing skeleton
 * geometry, so the fallback occupies the same grid the resolved dossier does
 * and the swap costs no layout shift. Part B requires a skeleton that matches
 * the real layout, never a spinner.
 *
 * Everything decorative is aria-hidden; one polite status line carries the
 * whole meaning for assistive technology.
 */
function Bar({ width, height = 14, radius = 3 }) {
  return (
    <span
      aria-hidden="true"
      className="dossier-skeleton-bar"
      style={{ width, height, borderRadius: radius }}
    />
  );
}

export default function BrokerDossierLoading() {
  return (
    <div className="page-wrapper" aria-busy="true">
      <Header />

      <main className="broker-detail-main">
        <p className="dossier-skeleton-status" role="status">
          Loading advisor dossier…
        </p>

        <section className="profile-grid" aria-hidden="true">
          <div className="profile-left-column">
            <div className="detail-avatar dossier-skeleton-block" />
            <div className="detail-closures-box">
              <Bar width="62%" height={12} />
              <Bar width="80%" height={18} />
              <Bar width="100%" height={12} />
              <Bar width="88%" height={12} />
            </div>
          </div>

          <div className="profile-right-column">
            <header className="profile-header">
              <Bar width="180px" height={12} />
              <Bar width="min(420px, 82%)" height={52} radius={4} />
              <Bar width="min(320px, 68%)" height={16} />
            </header>

            <div className="profile-body-content">
              <div className="detail-section">
                <Bar width="240px" height={16} />
                <Bar width="100%" height={12} />
                <Bar width="96%" height={12} />
                <Bar width="72%" height={12} />
              </div>

              <div className="detail-section">
                <Bar width="200px" height={16} />
                <div className="focus-pills-list">
                  <Bar width="190px" height={30} radius={999} />
                  <Bar width="220px" height={30} radius={999} />
                  <Bar width="150px" height={30} radius={999} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
