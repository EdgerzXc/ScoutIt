import ContactClient from "./ContactClient";
import "./contact.css";

export const metadata = {
  title: "Contact · ScoutIt",
  description:
    "Reach the ScoutIt team. Questions about a listing, joining as a broker or provider, or anything else about the platform.",
};

// The contact surface.
//
// Deliberately does NOT publish a phone number, office address, or support
// mailbox. The architecture note in the master plan lists those as future
// placeholder modules, `scoutit.space` currently has no MX records, and
// Standing Rule 3 forbids rendering what cannot be sourced. Publishing a
// channel nobody answers is the bug this page exists to fix, not a decoration
// to keep.

export default function ContactPage() {
  return (
    <main className="contact-page">
      <div className="contact-shell">
        <header className="contact-header">
          <span className="contact-eyebrow">Contact</span>
          <h1 className="contact-title">Talk to a person.</h1>
          <p className="contact-lede">
            Questions about a space, joining as a broker or provider, or anything about how
            ScoutIt works. One of us reads every message.
          </p>
        </header>

        <ContactClient />

        <aside className="contact-aside">
          <h2 className="contact-aside-title">Faster routes</h2>
          <ul className="contact-aside-list">
            <li>
              <strong>Asking about a specific space?</strong> Use the enquiry button on that
              property page — it reaches whoever actually holds it, not our general queue.
            </li>
            <li>
              <strong>Already have an account?</strong> Your dashboard inbox keeps the
              conversation attached to the deal it belongs to.
            </li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
