
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ReactionButtons from "@/components/ui/ReactionButtons";


export default function LedgerButtons() {
  const params = useParams();
  const id = params?.id || "";
  const [propertyInfo, setPropertyInfo] = useState({ title: id, category: "", city: "" });

  useEffect(() => {
    // In a real scenario, this could fetch the property info based on the ID.
    if (id) {
      setPropertyInfo({
        title: id,
        category: "",
        city: ""
      });
    }
  }, [id]);

  if (!id) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="ledger-floating-sidebar">
      <ReactionButtons 
        propertyId={id} 
        propertyTitle={propertyInfo.title} 
        category={propertyInfo.category} 
        city={propertyInfo.city} 
        small={true} 
      />
      <style jsx global>{`
        .ledger-floating-sidebar .reaction-tiles-row.small {
          flex-direction: column !important;
          gap: 16px !important;
        }
      `}</style>
    </div>
  );
}
