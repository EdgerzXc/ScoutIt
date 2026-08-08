"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

/**
 * Circular account/profile button.
 * Signed in  -> gold initial, links to /profile/<name>
 * Signed out -> person icon, links to /onboarding (create account)
 * 'floating' pins it to the top-right of the viewport (used on the homepage,
 * which has no global header).
 */
export default function ProfileButton({ floating = false }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const { getSession } = await import("@/lib/authClient");
        const { getProfileByUserId } = await import("@/lib/profileClient");

        const { data: { session } } = await getSession();
        if (session?.user) {
          const profile = await getProfileByUserId(session.user.id);
          if (mounted) {
            setUser({
              id: session.user.id,
              name: profile?.display_name || session.user.user_metadata?.full_name || session.user.email,
            });
          }
        } else {
          if (mounted) setUser(null);
        }
      } catch (e) {
        if (mounted) setUser(null);
      }
    }
    
    loadUser();

    // Optionally handle auth state changes
    import("@/lib/authClient").then(({ onAuthStateChange }) => {
      const { data: { subscription } } = onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          loadUser();
        }
      });
      return () => subscription?.unsubscribe();
    });

    return () => {
      mounted = false;
    };
  }, []);

  const href = user ? "/profile" : "/onboarding";
  const label = user?.name ? `Your profile — ${user.name}` : "Create an account";


  return (
    <div className={`profile-action-group ${floating ? "floating" : ""}`}>
      <button
        type="button"
        className="profile-eye-btn"
        onClick={() => window.dispatchEvent(new CustomEvent("scoutit:open-display-settings"))}
        aria-label="Display Settings (Light / Lite / Dark Mode)"
        title="Display Settings (Light / Lite / Dark Mode)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      <Link
        href={href}
        className={`profile-btn ${user ? "signed-in" : ""}`}
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
      </Link>

      <style jsx>{`
        .profile-action-group {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .profile-action-group.floating {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1500;
        }

        .profile-eye-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid var(--accent-border);
          background: var(--brand-overlay);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        }

        .profile-eye-btn:hover {
          border-color: var(--accent-bright);
          background: rgba(232, 174, 60, 0.16);
          transform: scale(1.05);
        }

        .profile-eye-btn:active {
          transform: scale(0.94);
        }

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
          background: rgba(232, 174, 60, 0.16);
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
    </div>
  );
}
