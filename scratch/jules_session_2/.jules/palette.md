## 2024-07-05 - Missing ARIA Labels on CRM Modal Close Buttons
**Learning:** Found a pattern of missing `aria-label` attributes on icon-only close buttons (using `lucide-react`'s `<X />` icon) specifically within the CRM component modals (`NewDealModal.js`, `DealFileSlideOver.js`). This makes these destructive/closing actions inaccessible to screen readers.
**Action:** Always verify icon-only buttons (`<button><Icon/></button>`), especially close buttons in modals/slide-overs, have descriptive `aria-label`s.
