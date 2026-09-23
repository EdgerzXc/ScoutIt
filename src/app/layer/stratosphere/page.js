import Link from "next/link";
import { ArrowRight, Compass, FileText, MapPin } from "lucide-react";
import LayerNav from "@/components/descent/LayerNav";
import LayerTransition from "@/components/descent/LayerTransition";
import DescentBackdrop from "@/components/descent/DescentBackdrop";
import "./stratosphere-layer.css";

const steps = [
  { icon: Compass, title: "Follow the stage", text: "See what is planned, building, opening, or finished." },
  { icon: MapPin, title: "Find your area", text: "Explore updates where they matter to you." },
  { icon: FileText, title: "Read the story", text: "Open the full article behind each update." },
];

export default function StratospherePreview() {
  return (
    <div className="stratosphere-layer">
      <div className="descent-backdrop" aria-hidden="true"><DescentBackdrop /></div>
      <LayerNav
        prev={{ href: "/layer/orbit", label: "Orbit" }}
        next={{ href: "/stratosphere", label: "Enter Stratosphere" }}
      />
      <main className="strat-main strat-main--entry">
        <div className="strat-top-banner">
          <header className="strat-intro strat-intro--entry">
            <p className="strat-kicker"><span className="strat-live-dot" aria-hidden="true" />Layer 02 &mdash; Stratosphere</p>
            <h1 className="strat-headline">The ground shifts. Find what changed near your <span className="strat-headline-accent">space</span>.</h1>
            <span className="strat-underline" aria-hidden="true" />
            <p className="strat-entry-copy">Enter to explore building updates, areas, and the articles behind them.</p>
            <Link href="/stratosphere" className="strat-entry-cta">Enter Stratosphere <ArrowRight size={17} aria-hidden="true" /></Link>
          </header>
        </div>
        <section className="strat-entry-steps" aria-label="What you can explore inside">
          {steps.map(({ icon: Icon, title, text }) => (
            <div className="strat-entry-step" key={title}>
              <Icon size={18} aria-hidden="true" />
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          ))}
        </section>
        <LayerTransition nextNum="02" nextName="Enter Stratosphere" nextHref="/stratosphere" teaser="Explore the full article library and spatial radar." />
      </main>
    </div>
  );
}
