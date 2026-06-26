import "./layer-descent.css";

// Route-segment layout for the five descent layers (/layer/orbit ... /layer/core).
// Hosts the shared descent stylesheet so each page no longer needs its own copy.
export default function LayerLayout({ children }) {
  // .layer-route lets Lite Mode hide the WebGL backgrounds on these pages only,
  // without touching property-page maps. Display:contents keeps layout intact.
  return (
    <div className="layer-route" style={{ display: "contents" }}>
      {children}
    </div>
  );
}
