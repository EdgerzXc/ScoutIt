"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

/**
 * Circular account/profile button.
 * Signed in  -> gold initial, links to /profile/<name>
 * Signed out -> person icon, links to /onboarding (create account)
 * `floating` pins it to the top-right of the viewport (used on the homepage,
 * which has no global header).
 */
export default function ProfileButton({ floating = false }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    function readUser() {
      try {
        const raw = localStorage.getItem("scoutit_user");
        setUser(raw ? JSON.parse(raw) : null);
      } catch {
        setUser(null);
      }
    }
    readUser();
    window.addEventListener("storage", readUser);
    window.addEventListener("focus", readUser);
    return () => {
      window.removeEventListener("storage", readUser);
      window.removeEventListener("focus", readUser);
    };
  }, []);

  const href = user?.name ? `/profile/${encodeURIComponent(user.name)}` : "/onboarding";
  const label = user?.name ? `Your profile — ${user.name}` : "Create an account";

  return (
    <Link
      href={href}
      className={`profile-btn ${floating ? "floating" : ""} ${user ? "signed-in" : ""}`}
      aria-label={label}
      title={label}
    >
      {user?.name ? (
        <span className="profile-initial">{user.name.charAt(0).toUpperCase()}</span>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )}

      <style jsx>{`
        .profile-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid var(--accent-border);
          background: var(--brand-overlay);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all 0.25s ease;
        }

        .profile-btn.floating {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1500;
        }

        .profile-btn :global(svg) {
          width: 17px;
          height: 17px;
          stroke: var(--accent);
        }

        .profile-initial {
          font-family: var(--font-display);
          font-size: 17px;
          line-height: 1;
          color: var(--accent);
        }

        .profile-btn.signed-in {
          background: var(--accent-dim);
        }

        .profile-btn:hover {
          border-color: var(--accent-bright);
          background: rgba(255, 184, 0, 0.16);
          box-shadow: var(--shadow-glow-soft);
          transform: translateY(-1px);
        }

        .profile-btn:hover :global(svg) {
          stroke: var(--accent-bright);
        }

        .profile-btn:hover .profile-initial {
          color: var(--accent-bright);
        }

        .profile-btn:focus-visible {
          outline: 1.5px solid var(--accent-bright);
          outline-offset: 2px;
        }

        @media (max-width: 640px) {
          .profile-btn {
            width: 38px;
            height: 38px;
          }
          .profile-btn.floating {
            top: 14px;
            right: 14px;
          }
          .profile-initial {
            font-size: 15px;
          }
        }
      `}</style>
    </Link>
  );
}
