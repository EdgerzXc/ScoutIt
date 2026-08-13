export function getCoreAccountPresentation({ status, isAuthenticated, name = "Scout" }) {
  if (status === "checking") {
    return {
      compactTitle: "Confirming account…",
      title: "Confirming your account…",
      body: "ScoutIt is validating the current session before presenting a private-workspace destination.",
      href: "/onboarding",
      cta: "Please wait",
    };
  }

  if (isAuthenticated) {
    return {
      compactTitle: `Authenticated as ${name}`,
      title: `${name}, your workspace is ready.`,
      body: "Open the dashboard for real saved spaces, listings, conversations, and role-permitted activity. No counts are guessed on this public page.",
      href: "/dashboard",
      cta: "Open live dashboard",
    };
  }

  return {
    compactTitle: "No account connected",
    title: "Explore first. Connect when needed.",
    body: "No sign-in is required to understand the system or browse public spaces. Create an account for private continuity and protected actions.",
    href: "/onboarding",
    cta: "Create your account",
  };
}
