// A-146: private inventory is authenticated entitled stock, never indexed.
// A title-only layout would improve ranking before exclusion — the wrong
// order (see a096InterfaceContracts). So this carries noindex first.
export const metadata = {
  title: "Off-Market",
  robots: { index: false, follow: true },
};

export default function OffMarketLayout({ children }) {
  return <>{children}</>;
}
