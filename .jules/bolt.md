## 2025-07-05 - KanbanBoard Filtering Memoization
**Learning:** In React components with frequent state updates like search inputs, avoiding O(N) array filtering and O(M*N) nested iterations within the render cycle is critical for smooth user experience.
**Action:** Always memoize derived collections, especially when deriving grouped structures (like column bucketing) using `useMemo` and an efficient single-pass grouping instead of multiple `filter` calls.
