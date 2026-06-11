# SCOUTIT CODEBASE CLEANUP — MASTER PROMPT
# Copy everything below this line into Claude Code exactly as written.
# Do not modify before pasting.
─────────────────────────────────────────────────────────────────────

Read CLAUDE.md and SCOUTIT_BRAND.md before touching any code.

This is a cleanup and restructure session only. You will NOT build any new features. You will NOT modify any logic. You will ONLY read, map, reorganize, and fix broken references. No new functionality. No rewrites.

═══════════════════════════════════════
MISSION
═══════════════════════════════════════

The codebase has accumulated conflicting code, leaked styles, and a disorganized file structure from multiple failed build attempts. The goal of this session is:

1. Map exactly what exists and what each file does
2. Identify every code leakage — styles, components, or logic bleeding into places they do not belong
3. Propose a clean folder structure following Next.js App Router conventions
4. Execute the reorganization safely — move files, fix all imports, verify nothing breaks
5. Leave the codebase in a state where future builds (especially the scrollytelling component) can be added cleanly without collision

═══════════════════════════════════════
STEP 1 — FULL AUDIT. DO NOT TOUCH ANYTHING YET.
═══════════════════════════════════════

Run the following and report every result back to me before doing anything else:

1. List every file in the project recursively:
   find src -type f | sort
   Also list: public/, any config files in root (next.config.js, tailwind.config.js, package.json, tsconfig.json etc.)

2. For each file in src/, report:
   - File name and path
   - What it appears to do in one sentence
   - What it imports
   - What imports it (what other files depend on it)

3. Identify and flag:
   - Any file that imports from an unexpected location (e.g. a component importing global styles directly)
   - Any CSS or style file that applies styles globally when it should be scoped
   - Any component that has inline styles or classNames that conflict with the global design system
   - Any duplicate files — two files doing the same job
   - Any dead files — files that nothing imports and nothing uses
   - Any file left over from failed build attempts (look for scrollytelling, UFO, hamster, video, mp4, or test references that are not part of the current working site)

4. Report the current state of the hero component specifically:
   - Does it contain a UFO image reference?
   - Does it contain any scrollytelling code?
   - Does it reference any files that no longer exist?

Present this full audit to me as a structured report. Wait for my confirmation before proceeding to Step 2.

═══════════════════════════════════════
STEP 2 — PROPOSE THE CLEAN STRUCTURE
═══════════════════════════════════════

Based on the audit, propose a folder structure following Next.js 13+ App Router best practices. Use this as the target architecture:

src/
├── app/
│   ├── layout.js          — root layout, global font, metadata
│   ├── page.js            — homepage, imports sections only, no inline logic
│   ├── globals.css        — ONLY true globals: CSS variables, resets, body/html rules
│   ├── about/
│   │   └── page.js
│   ├── property/
│   │   └── [slug]/
│   │       └── page.js
│   └── (any other existing routes)
│
├── components/
│   ├── hero/
│   │   ├── HeroSection.js         — the hero component
│   │   └── HeroSection.module.css — scoped styles for hero only
│   ├── scrollytelling/
│   │   — EMPTY for now, reserved for the scrollytelling build
│   │   — Create the folder and add a README.md: "Scrollytelling components go here. Do not add files until the scrollytelling build session."
│   ├── ui/
│   │   — Shared small UI elements: buttons, badges, tags
│   ├── layout/
│   │   — Nav, Footer, any persistent layout wrappers
│   └── property/
│       — Property card, property page components
│
├── lib/
│   — Utility functions, Airtable fetch helpers, data formatters
│   — Nothing visual goes here
│
├── hooks/
│   — Custom React hooks (e.g. useScrollProgress will live here later)
│   — Currently may be empty, create the folder
│
└── data/
    — Static data files, constants, config objects

IMPORTANT RULES for the proposal:
- globals.css must contain ONLY: CSS custom properties (color, font, spacing variables), html/body reset, and font-face declarations. Nothing else. No component styles. No utility classes.
- Every component gets its own CSS module (.module.css) for its scoped styles. No component should rely on globals.css for its visual appearance.
- page.js files import components and compose them. They contain no JSX styling themselves.
- No component imports another component's CSS module.
- The scrollytelling folder is created but left empty. No code goes in it during this session.

Present the proposed structure to me. Mark which folders/files already exist and which need to be created. Mark which files need to be moved and where they are going. Wait for my confirmation before touching anything.

═══════════════════════════════════════
STEP 3 — IDENTIFY ALL LEAKAGES
═══════════════════════════════════════

Before moving any file, identify and document every leakage:

A leakage is any of the following:
- A component style defined in globals.css instead of a CSS module
- A CSS rule in globals.css that targets a component class (anything that is not html, body, *, :root, or @font-face)
- A component that imports and applies styles from another component's file
- JavaScript logic that belongs in a utility or hook but is written inline inside a component
- Any leftover code from failed builds that is imported somewhere (even if it errors silently)
- Any hardcoded color, font, or spacing value that should use a CSS variable instead

For each leakage found, document:
- File where the leakage exists
- Line numbers
- What it is doing
- Where it should live instead

Present the full leakage report. Wait for my confirmation before proceeding.

═══════════════════════════════════════
STEP 4 — EXECUTE THE CLEANUP
═══════════════════════════════════════

Only after I have confirmed Steps 2 and 3, execute in this exact order:

4A — Create new folders first:
- Create all new folders from the approved structure
- Create the scrollytelling/README.md placeholder
- Create the hooks/ folder
- Do not move or edit any existing file yet

4B — Fix globals.css first:
- Extract any component-specific styles out of globals.css
- For each extracted style block, create the appropriate .module.css file in the component's folder
- Update the component to import its own CSS module
- Verify globals.css contains ONLY variables, resets, and font declarations when done
- Report what was moved out and where it went

4C — Remove dead and leftover files:
- Delete files identified as dead (nothing imports them)
- Delete files identified as leftover from failed builds
- For each deletion, state exactly what is being deleted and why
- Do not delete anything I have not confirmed in the leakage report

4D — Move components to their correct folders:
- Move each file to its approved destination
- Immediately after each move, update every import path that referenced the old location
- Do not move a second file until the first move's imports are fully updated and verified

4E — Fix all leakages:
- Apply every fix identified in Step 3
- Replace hardcoded values with CSS variables where flagged
- Move inline logic to the correct utility or hook file

4F — Verify nothing broke:
- After all moves and fixes, check that every import in every file resolves correctly
- Check that the homepage still renders (no missing component imports)
- Check that the hero component is intact and unchanged in behavior
- Check that the about page and property pages still have their correct imports
- Report: list every file that was changed, moved, or deleted

═══════════════════════════════════════
STEP 5 — FINAL REPORT
═══════════════════════════════════════

When cleanup is complete, produce a final report containing:

1. Full current file tree (run find src -type f | sort again)
2. List of every file that was moved — old path → new path
3. List of every file that was deleted and why
4. List of every leakage that was fixed
5. List of every import that was updated
6. Current state of globals.css — confirm it contains only variables/resets/fonts
7. Confirmation that the scrollytelling/ folder exists and is empty except for README.md
8. Any remaining issues that could not be fixed in this session and why

═══════════════════════════════════════
RULES FOR THIS ENTIRE SESSION
═══════════════════════════════════════

- Audit before acting. Never move or edit a file before the audit is complete and confirmed.
- One file at a time. Never move multiple files in one operation.
- Fix imports immediately. Every move is followed immediately by import updates before the next move.
- Never rewrite logic. If a function works, keep it exactly as-is. Only move it to the correct location.
- Never touch the hero component's logic or JSX. You may move it to a new folder and update its imports. That is all.
- Never touch any page.js routing logic.
- Never touch next.config.js, tailwind.config.js, or package.json unless an import fix requires it — and ask me first.
- If anything is unclear or ambiguous during execution, stop and ask. Do not guess.
- The scrollytelling folder is a placeholder only. Nothing goes inside it this session.

Do not proceed past Step 1 until I have confirmed the audit report.
