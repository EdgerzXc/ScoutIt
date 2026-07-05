## 2025-07-05 - KanbanBoard Filtering Memoization
**Learning:** In React components with frequent state updates like search inputs, avoiding O(N) array filtering and O(M*N) nested iterations within the render cycle is critical for smooth user experience.
**Action:** Always memoize derived collections, especially when deriving grouped structures (like column bucketing) using `useMemo` and an efficient single-pass grouping instead of multiple `filter` calls.
## 2025-07-05 - BrokerMode and BuyerMode Array Derivations Memoization
**Learning:** React components that render large lists or run multiple loops (`.filter`, `.map`, `.slice`) over props on every render can significantly block the main thread, especially when inputs like search trigger frequent updates.
**Action:** Always wrap `.filter` and derived maps in `useMemo` when rendering lists. Combine multiple loops when possible (e.g., separating pending/accepted/active pitches via one `.forEach` instead of 3 `.filter` calls).
